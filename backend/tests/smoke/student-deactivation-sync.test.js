jest.mock('../../src/services/mwsDataCenterClient', () => ({
    listStudentsByStatus: jest.fn(),
}));
jest.mock('../../src/models/UserStudent', () => ({ find: jest.fn() }));

const UserStudent = require('../../src/models/UserStudent');
const { listStudentsByStatus } = require('../../src/services/mwsDataCenterClient');
const { deactivateMissingStudents } = require('../../src/jobs/studentDeactivationSync');

const makeCandidate = (overrides = {}) => ({
    email: 'student@millennia21.id',
    isActive: true,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
});

afterEach(() => jest.clearAllMocks());

describe('deactivateMissingStudents', () => {
    test('deactivates a student no longer enrolled (missing from both REGISTERED and ACTIVE)', async () => {
        const candidate = makeCandidate({ email: 'graduated@millennia21.id' });
        UserStudent.find.mockResolvedValue([candidate]);
        listStudentsByStatus.mockResolvedValue([]); // empty for every status queried

        const result = await deactivateMissingStudents();

        expect(result).toEqual({ checked: 1, deactivated: 1, skipped: false });
        expect(candidate.isActive).toBe(false);
        expect(candidate.save).toHaveBeenCalledTimes(1);
    });

    test('leaves a student alone when enrolled under either REGISTERED or ACTIVE', async () => {
        const candidate = makeCandidate({ email: 'still-enrolled@millennia21.id' });
        UserStudent.find.mockResolvedValue([candidate]);
        listStudentsByStatus.mockImplementation((status) =>
            Promise.resolve(status === 'REGISTERED' ? [{ email: 'still-enrolled@millennia21.id' }] : []));

        const result = await deactivateMissingStudents();

        expect(result).toEqual({ checked: 1, deactivated: 0, skipped: false });
        expect(candidate.isActive).toBe(true);
        expect(candidate.save).not.toHaveBeenCalled();
    });

    test('the candidate query only ever looks at currently-active local students', async () => {
        listStudentsByStatus.mockResolvedValue([]);
        UserStudent.find.mockResolvedValue([]);

        await deactivateMissingStudents();

        expect(UserStudent.find).toHaveBeenCalledWith({ isActive: true });
    });

    test('does not throw and reports skipped when Central is unreachable', async () => {
        listStudentsByStatus.mockRejectedValue(new Error('ECONNREFUSED'));

        const result = await deactivateMissingStudents();

        expect(result).toEqual({ checked: 0, deactivated: 0, skipped: true });
        expect(UserStudent.find).not.toHaveBeenCalled();
    });

    test('email matching is case-insensitive against the enrolled roster', async () => {
        const candidate = makeCandidate({ email: 'Mixed.Case@millennia21.id' });
        UserStudent.find.mockResolvedValue([candidate]);
        listStudentsByStatus.mockImplementation((status) =>
            Promise.resolve(status === 'ACTIVE' ? [{ email: 'mixed.case@millennia21.id' }] : []));

        const result = await deactivateMissingStudents();

        expect(result.deactivated).toBe(0);
        expect(candidate.isActive).toBe(true);
    });
});
