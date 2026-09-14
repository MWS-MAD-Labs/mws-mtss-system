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
