const mongoose = require('mongoose');

jest.mock('../../src/services/mwsDataCenterClient', () => ({
    listStudentsByStatus: jest.fn(),
}));

const { listStudentsByStatus } = require('../../src/services/mwsDataCenterClient');
const { syncStudentRoster } = require('../../src/jobs/mtssStudentRosterSync');
const MTSSStudent = require('../../src/models/MTSSStudent');

const TEST_EMAIL_RE = /@roster-sync-test\.millennia21\.id$/;

// listStudentsByStatus is called once per status this job checks
// (REGISTERED, ACTIVE, INACTIVE, GRADUATED, TRANSFERRED, WITHDRAWN,
// ARCHIVED) - only the statuses relevant to a given test need real rows,
// everything else can return empty.
function mockCentralStatuses(byStatus) {
    listStudentsByStatus.mockImplementation(async (status) => byStatus[status] || []);
}

describe('mtssStudentRosterSync - className follows Central, including clearing it', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/integra-learn-test');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        await MTSSStudent.deleteMany({ email: TEST_EMAIL_RE });
    });

    test('clears a stale className when Central no longer reports one', async () => {
        await MTSSStudent.create({
            name: 'Roster Sync Test Student',
            email: 'stale-class@roster-sync-test.millennia21.id',
            currentGrade: 'Kindergarten K1',
            className: 'Kindergarten K1',
        });

        mockCentralStatuses({
            ACTIVE: [{
                email: 'stale-class@roster-sync-test.millennia21.id',
                full_name: 'Roster Sync Test Student',
                current_grade: 'Kindergarten K1',
                current_class: null,
            }],
        });

        const result = await syncStudentRoster();
        expect(result.errors).toBe(0);
        expect(result.updated).toBe(1);

        const updated = await MTSSStudent.findOne({ email: 'stale-class@roster-sync-test.millennia21.id' });
        expect(updated.className).toBeNull();
    });

    test('still applies a real class name from Central', async () => {
        await MTSSStudent.create({
            name: 'Roster Sync Test Student 2',
            email: 'gets-class@roster-sync-test.millennia21.id',
            currentGrade: 'Grade 3',
            className: null,
        });

        mockCentralStatuses({
            ACTIVE: [{
                email: 'gets-class@roster-sync-test.millennia21.id',
                full_name: 'Roster Sync Test Student 2',
                current_grade: 'Grade 3',
                current_class: 'Grade 3 - Comet',
            }],
        });

        const result = await syncStudentRoster();
        expect(result.errors).toBe(0);
        expect(result.updated).toBe(1);

        const updated = await MTSSStudent.findOne({ email: 'gets-class@roster-sync-test.millennia21.id' });
        expect(updated.className).toBe('Grade 3 - Comet');
    });

    test('does not write an update when nothing actually changed', async () => {
        await MTSSStudent.create({
            name: 'Roster Sync Test Student 3',
            email: 'unchanged@roster-sync-test.millennia21.id',
            status: 'ACTIVE',
            currentGrade: 'Grade 5',
            className: 'Grade 5 - Orion',
        });

        mockCentralStatuses({
            ACTIVE: [{
                email: 'unchanged@roster-sync-test.millennia21.id',
                full_name: 'Roster Sync Test Student 3',
                current_grade: 'Grade 5',
                current_class: 'Grade 5 - Orion',
            }],
        });

        const result = await syncStudentRoster();
        expect(result.errors).toBe(0);
        expect(result.updated).toBe(0);
    });

    test('creates a new record with no className when Central has none yet', async () => {
        mockCentralStatuses({
            REGISTERED: [{
                email: 'brand-new@roster-sync-test.millennia21.id',
                full_name: 'Roster Sync Test Student 4',
                current_grade: 'Kindergarten Pre-K',
                current_class: null,
            }],
        });

        const result = await syncStudentRoster();
        expect(result.errors).toBe(0);
        expect(result.created).toBe(1);

        const created = await MTSSStudent.findOne({ email: 'brand-new@roster-sync-test.millennia21.id' });
        expect(created.className).toBeUndefined();
    });
});

describe('mtssStudentRosterSync - genuinely empty vs. a failed fetch', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/integra-learn-test');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        await MTSSStudent.deleteMany({ email: TEST_EMAIL_RE });
    });

    test('flags an existing record as orphaned when Central genuinely reports zero students across every status', async () => {
        await MTSSStudent.create({
            name: 'Roster Sync Test Student 5',
            email: 'genuinely-empty@roster-sync-test.millennia21.id',
            status: 'ACTIVE',
            currentGrade: 'Kindergarten K1',
            className: 'Kindergarten K1',
        });

        // Every status fetch succeeds and returns [] - a real, honest
        // answer from Central, not an error.
        mockCentralStatuses({});

        const result = await syncStudentRoster();
        expect(result.skipped).toBe(false);
        expect(result.orphaned).toBe(1);

        const doc = await MTSSStudent.findOne({ email: 'genuinely-empty@roster-sync-test.millennia21.id' });
        expect(doc.orphanedAt).not.toBeNull();
    });

    test('skips the run entirely, touching nothing, when a status fetch actually fails', async () => {
        const existing = await MTSSStudent.create({
            name: 'Roster Sync Test Student 6',
            email: 'fetch-failure@roster-sync-test.millennia21.id',
            status: 'ACTIVE',
            currentGrade: 'Kindergarten K1',
            className: 'Kindergarten K1',
        });

        listStudentsByStatus.mockImplementation(async (status) => {
            if (status === 'ACTIVE') throw new Error('simulated network failure');
            return [];
        });

        const result = await syncStudentRoster();
        expect(result.skipped).toBe(true);

        // Nothing touched - not created, not updated, and critically not
        // orphaned just because the (incomplete) fetch happened to come
        // back without this email in it.
        const doc = await MTSSStudent.findById(existing._id);
        expect(doc.orphanedAt).toBeNull();
        expect(doc.status).toBe('ACTIVE');
    });
});

describe('mtssStudentRosterSync - a student is kept by the Central person id, not by the email', () => {
    const at = (name) => `${name}@roster-sync-test.millennia21.id`;
    const student = (personId, email, over = {}) => ({
        person_id: personId,
        email,
        full_name: `Person ${personId}`,
        current_grade: 'Grade 5',
        current_class: 'Grade 5 - Orion',
        ...over,
    });
    const clean = () => MTSSStudent.deleteMany({ $or: [{ email: TEST_EMAIL_RE }, { centralPersonId: /^rs-test-/ }] });

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/integra-learn-test');
    });

    afterAll(async () => {
        await clean();
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        await clean();
    });

    test('a record from before the person id existed gets it, found by its email', async () => {
        await MTSSStudent.create({ name: 'Person rs-test-1', email: at('older'), status: 'ACTIVE', currentGrade: 'Grade 5', className: 'Grade 5 - Orion' });
        mockCentralStatuses({ ACTIVE: [student('rs-test-1', at('older'))] });

        const result = await syncStudentRoster();

        expect(result).toMatchObject({ created: 0, updated: 1, errors: 0, orphaned: 0 });
        expect((await MTSSStudent.findOne({ email: at('older') })).centralPersonId).toBe('rs-test-1');
    });

    test('a new email in Central changes the label of the same record instead of starting an empty one', async () => {
        const record = await MTSSStudent.create({
            name: 'Person rs-test-2', email: at('before'), centralPersonId: 'rs-test-2', status: 'ACTIVE', currentGrade: 'Grade 5', className: 'Grade 5 - Orion',
        });
        mockCentralStatuses({ ACTIVE: [student('rs-test-2', at('after'))] });

        const result = await syncStudentRoster();

        expect(result).toMatchObject({ created: 0, updated: 1, errors: 0, orphaned: 0, needsReview: 0, possibleDuplicates: [] });
        const kept = await MTSSStudent.find({ centralPersonId: 'rs-test-2' });
        expect(kept).toHaveLength(1);
        expect(String(kept[0]._id)).toBe(String(record._id));
        expect(kept[0].email).toBe(at('after'));
        expect(kept[0].orphanedAt).toBeFalsy();
        expect(await MTSSStudent.countDocuments({ email: at('before') })).toBe(0);
    });

    test('keeps the old email and asks for a look when another record already has the new one', async () => {
        const mine = await MTSSStudent.create({ name: 'Person rs-test-3', email: at('mine'), centralPersonId: 'rs-test-3', status: 'ACTIVE', currentGrade: 'Grade 5', className: 'Grade 5 - Orion' });
        await MTSSStudent.create({ name: 'Someone else', email: at('taken'), status: 'ACTIVE', currentGrade: 'Grade 5', className: 'Grade 5 - Orion' });
        mockCentralStatuses({ ACTIVE: [student('rs-test-3', at('taken'))] });

        const result = await syncStudentRoster();

        expect(result.needsReview).toBe(1);
        expect(result.errors).toBe(0);
        expect((await MTSSStudent.findById(mine._id)).email).toBe(at('mine'));
    });

    test('does not take over an email that belongs to another person, and settles on the next run', async () => {
        await MTSSStudent.create({ name: 'Person rs-test-4', email: at('shared'), centralPersonId: 'rs-test-4', status: 'ACTIVE', currentGrade: 'Grade 5', className: 'Grade 5 - Orion' });
        // Central gave the old email of person 4 to person 5, and person 4 got a new one.
        mockCentralStatuses({ ACTIVE: [student('rs-test-5', at('shared')), student('rs-test-4', at('moved'))] });

        const first = await syncStudentRoster();
        expect(first.needsReview).toBe(1);
        expect(await MTSSStudent.countDocuments({ centralPersonId: 'rs-test-5' })).toBe(0);
        expect((await MTSSStudent.findOne({ centralPersonId: 'rs-test-4' })).email).toBe(at('moved'));

        const second = await syncStudentRoster();
        expect(second).toMatchObject({ created: 1, needsReview: 0 });
        expect((await MTSSStudent.findOne({ centralPersonId: 'rs-test-5' })).email).toBe(at('shared'));
        expect(await MTSSStudent.countDocuments({ centralPersonId: 'rs-test-4' })).toBe(1);
    });

    test('a record matched by its person id is not flagged as orphaned even when Central shows another email', async () => {
        await MTSSStudent.create({ name: 'Person rs-test-6', email: at('gone'), centralPersonId: 'rs-test-6', status: 'ACTIVE', currentGrade: 'Grade 5', className: 'Grade 5 - Orion', orphanedAt: new Date() });
        mockCentralStatuses({ ACTIVE: [student('rs-test-6', at('now'))] });

        const result = await syncStudentRoster();

        expect(result.unorphaned).toBe(1);
        expect((await MTSSStudent.findOne({ centralPersonId: 'rs-test-6' })).orphanedAt).toBeNull();
    });

    test('warns about a likely duplicate when a new record shares the name of an unmatched older one', async () => {
        const older = await MTSSStudent.create({ name: 'Same Name Student', email: at('typo'), status: 'ACTIVE', currentGrade: 'Grade 5', className: 'Grade 5 - Orion' });
        mockCentralStatuses({ ACTIVE: [student('rs-test-7', at('correct'), { full_name: 'Same Name Student' })] });

        const result = await syncStudentRoster();

        expect(result.created).toBe(1);
        expect(result.orphaned).toBe(1);
        expect(result.possibleDuplicates).toEqual([{ email: at('correct'), existing: [{ id: String(older._id), email: at('typo') }] }]);
    });
});
