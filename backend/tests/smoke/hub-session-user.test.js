const mongoose = require('mongoose');

jest.mock('../../src/services/mwsDataCenterClient', () => ({
    lookupApplicationEntitlement: jest.fn(),
}));
jest.mock('../../src/utils/employeeCentralSync', () => ({
    syncEmployeeFromCentral: jest.fn(),
}));
jest.mock('../../src/utils/studentCentralSync', () => ({
    syncStudentFromCentral: jest.fn(),
}));

const { lookupApplicationEntitlement } = require('../../src/services/mwsDataCenterClient');
const { syncEmployeeFromCentral } = require('../../src/utils/employeeCentralSync');
const { syncStudentFromCentral } = require('../../src/utils/studentCentralSync');
const { resolveSessionUser, clearEntitlementCache } = require('../../src/utils/hubSessionUser');
const Person = require('../../src/models/Person');

const EMAIL = /@session-test\.id$/;
const EMPLOYEE_FIELDS = {
    centralPersonId: 'person-session',
    name: 'Session Person',
    employeeId: '99.99.077',
    jobPosition: 'Staff',
    jobLevel: 'Staff',
    employmentStatus: 'PERMANENT',
    department: 'Operational',
    unit: 'Operational',
};
const entitlement = (over = {}) => ({
    id: 'ent-session',
    person_id: 'person-session',
    application_id: 'mtss',
    organization_id: 'org-test',
    role: 'STAFF',
    permissions: ['users.read'],
    version: 1,
    is_active: true,
    ...over,
});
const claims = { sub: 'person-session', email: 'session@session-test.id', source: 'employee', tags: [] };

describe('resolveSessionUser', () => {
    beforeAll(async () => {
        process.env.CENTRAL_ORGANIZATION_ID = 'org-test';
        await mongoose.connect(process.env.MONGODB_URI);
    });
    afterAll(async () => {
        await Person.deleteMany({ email: EMAIL });
        await mongoose.connection.close();
    });
    beforeEach(async () => {
        process.env.CENTRAL_ORGANIZATION_ID = 'org-test';
        jest.clearAllMocks();
        clearEntitlementCache();
        await Person.deleteMany({ email: EMAIL });
        syncEmployeeFromCentral.mockResolvedValue({ ...EMPLOYEE_FIELDS });
        syncStudentFromCentral.mockResolvedValue(null);
    });

    test('gives nobody access when Central has nothing for them, or it is not active', async () => {
        lookupApplicationEntitlement.mockResolvedValueOnce(null);
        expect(await resolveSessionUser(claims)).toBeNull();
        clearEntitlementCache();
        lookupApplicationEntitlement.mockResolvedValueOnce(entitlement({ is_active: false }));
        expect(await resolveSessionUser(claims)).toBeNull();
    });

    test('gives nobody access for another organization or another application', async () => {
        lookupApplicationEntitlement.mockResolvedValueOnce(entitlement({ organization_id: 'other-org' }));
        expect(await resolveSessionUser(claims)).toBeNull();
        clearEntitlementCache();
        lookupApplicationEntitlement.mockResolvedValueOnce(entitlement({ application_id: 'daily-checkin' }));
        expect(await resolveSessionUser(claims)).toBeNull();
    });

    test('creates the local record on the first visit and keeps what Central allows', async () => {
        lookupApplicationEntitlement.mockResolvedValue(entitlement());
        const person = await resolveSessionUser(claims);
        expect(person.email).toBe(claims.email);
        expect(person.centralPersonId).toBe('person-session');
        expect(person.personType).toBe('employee');
        expect(person.centralEntitlementPermissions).toEqual(['users.read']);
        expect(syncEmployeeFromCentral).toHaveBeenCalledTimes(1);
    });

    test('does not ask Central about the person again while the entitlement has not changed', async () => {
        lookupApplicationEntitlement.mockResolvedValue(entitlement());
        await resolveSessionUser(claims);
        clearEntitlementCache();
        await resolveSessionUser(claims);
        expect(syncEmployeeFromCentral).toHaveBeenCalledTimes(1);
    });

    test('brings the record in line when Central changed the role', async () => {
        lookupApplicationEntitlement.mockResolvedValue(entitlement());
        await resolveSessionUser(claims);
        clearEntitlementCache();
        lookupApplicationEntitlement.mockResolvedValue(entitlement({ version: 2, permissions: ['users.read', 'sync.read'] }));
        const person = await resolveSessionUser(claims);
        expect(person.centralEntitlementVersion).toBe(2);
        expect(person.centralEntitlementPermissions).toEqual(['sync.read', 'users.read']);
    });

    test('makes a student when Central knows the person as one', async () => {
        syncEmployeeFromCentral.mockResolvedValue(null);
        syncStudentFromCentral.mockResolvedValue({ centralPersonId: 'person-session', name: 'A Student', currentGrade: 'Grade 4', className: 'Orion', status: 'ACTIVE' });
        lookupApplicationEntitlement.mockResolvedValue(entitlement());
        const person = await resolveSessionUser({ ...claims, source: 'student' });
        expect(person.personType).toBe('student');
        expect(person.currentGrade).toBe('Grade 4');
    });

    test('gives nobody access when Central knows the person as neither', async () => {
        syncEmployeeFromCentral.mockResolvedValue(null);
        lookupApplicationEntitlement.mockResolvedValue(entitlement());
        expect(await resolveSessionUser(claims)).toBeNull();
    });

    test('lets an error go up when Central cannot be asked, so "try again" is told from "no access"', async () => {
        lookupApplicationEntitlement.mockRejectedValue(new Error('Central is down'));
        await expect(resolveSessionUser(claims)).rejects.toThrow('Central is down');
    });
});
