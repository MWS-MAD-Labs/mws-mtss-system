jest.mock('../../src/services/mwsDataCenterClient', () => ({
    listActiveEmployees: jest.fn(),
}));
jest.mock('../../src/models/User', () => ({ find: jest.fn() }));

const User = require('../../src/models/User');
const { listActiveEmployees } = require('../../src/services/mwsDataCenterClient');
const { deactivateMissingEmployees } = require('../../src/jobs/employeeDeactivationSync');

const makeCandidate = (overrides = {}) => ({
    email: 'someone@millennia21.id',
    isActive: true,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
});

afterEach(() => jest.clearAllMocks());

describe('deactivateMissingEmployees', () => {
    test('deactivates a candidate no longer in the active roster', async () => {
        const candidate = makeCandidate({ email: 'gone@millennia21.id' });
        User.find.mockResolvedValue([candidate]);
        listActiveEmployees.mockResolvedValue([]); // empty active roster - this person is missing

        const result = await deactivateMissingEmployees();

        expect(result).toEqual({ checked: 1, deactivated: 1, skipped: false });
        expect(candidate.isActive).toBe(false);
        expect(candidate.save).toHaveBeenCalledTimes(1);
    });

    test('leaves a candidate alone when still in the active roster', async () => {
        const candidate = makeCandidate({ email: 'still-here@millennia21.id' });
        User.find.mockResolvedValue([candidate]);
        listActiveEmployees.mockResolvedValue([{ email: 'still-here@millennia21.id' }]);

        const result = await deactivateMissingEmployees();

        expect(result).toEqual({ checked: 1, deactivated: 0, skipped: false });
        expect(candidate.isActive).toBe(true);
        expect(candidate.save).not.toHaveBeenCalled();
    });

    test('the candidate query itself excludes admin/superadmin and non-Central accounts', async () => {
        listActiveEmployees.mockResolvedValue([]);
        User.find.mockResolvedValue([]);

        await deactivateMissingEmployees();

        expect(User.find).toHaveBeenCalledWith({
            employeeId: { $exists: true, $ne: '' },
            isActive: true,
            role: { $nin: ['admin', 'superadmin'] },
        });
    });

    test('does not throw and reports skipped when Central is unreachable', async () => {
        listActiveEmployees.mockRejectedValue(new Error('ECONNREFUSED'));

        const result = await deactivateMissingEmployees();

        expect(result).toEqual({ checked: 0, deactivated: 0, skipped: true });
        expect(User.find).not.toHaveBeenCalled();
    });

    test('email matching is case-insensitive against the active roster', async () => {
        const candidate = makeCandidate({ email: 'Mixed.Case@millennia21.id' });
        User.find.mockResolvedValue([candidate]);
        listActiveEmployees.mockResolvedValue([{ email: 'mixed.case@millennia21.id' }]);

        const result = await deactivateMissingEmployees();

        expect(result.deactivated).toBe(0);
        expect(candidate.isActive).toBe(true);
    });
});
