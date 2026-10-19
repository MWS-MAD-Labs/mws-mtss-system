jest.mock('../../src/services/mwsDataCenterClient', () => ({
    lookupEmployeeByEmail: jest.fn(),
    lookupEmployeeByPersonId: jest.fn(),
    lookupStudentByEmail: jest.fn(),
}));

const { lookupEmployeeByEmail, lookupEmployeeByPersonId } = require('../../src/services/mwsDataCenterClient');
const { syncEmployeeFromCentral } = require('../../src/utils/employeeCentralSync');

const employee = (over = {}) => ({ person_id: 'person-1', email: 'a@lookup.test', full_name: 'A', unit: 'Elementary', ...over });

describe('finding an employee in Central', () => {
    beforeEach(() => jest.clearAllMocks());

    test('asks by person id first, so a changed email still finds the person', async () => {
        lookupEmployeeByPersonId.mockResolvedValue(employee({ email: 'new@lookup.test' }));
        const fields = await syncEmployeeFromCentral('old@lookup.test', 'person-1');
        expect(lookupEmployeeByPersonId).toHaveBeenCalledWith('person-1');
        expect(lookupEmployeeByEmail).not.toHaveBeenCalled();
        expect(fields.name).toBe('A');
    });

    test('falls back to the email when the person id finds nobody', async () => {
        lookupEmployeeByPersonId.mockResolvedValue(null);
        lookupEmployeeByEmail.mockResolvedValue(employee());
        expect((await syncEmployeeFromCentral('a@lookup.test', 'person-1')).name).toBe('A');
        expect(lookupEmployeeByEmail).toHaveBeenCalledWith('a@lookup.test');
    });

    test('asks only by email when no person id is known, and answers null for nobody', async () => {
        lookupEmployeeByEmail.mockResolvedValue(null);
        expect(await syncEmployeeFromCentral('x@lookup.test')).toBeNull();
        expect(lookupEmployeeByPersonId).not.toHaveBeenCalled();
    });
});
