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
