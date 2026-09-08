const mongoose = require('mongoose');

jest.mock('../../src/utils/studentCentralSync', () => ({
    syncStudentFromCentral: jest.fn(),
}));
jest.mock('../../src/utils/employeeCentralSync', () => ({
    syncEmployeeFromCentral: jest.fn(),
}));

const { syncStudentFromCentral } = require('../../src/utils/studentCentralSync');
const { syncEmployeeFromCentral } = require('../../src/utils/employeeCentralSync');
const { resolveOrProvisionSsoUser } = require('../../src/utils/ssoUserResolution');
const User = require('../../src/models/User');
const UserStudent = require('../../src/models/UserStudent');

const EMPLOYEE_FIELDS = {
    name: 'Test Teacher',
    employeeId: '99.99.001',
    jobPosition: 'Teacher',
    jobLevel: 'Teacher',
    isTeachingRole: true,
    employmentStatus: 'Permanent',
    department: 'Junior High',
    unit: 'Junior High',
};

// Mirrors buildStudentUserPayload's real output shape (studentUserHelpers.js)
// since syncStudentFromCentral is mocked wholesale here, not just its
// Central HTTP call - UserStudent.email/role are required fields set from
// this object directly (new UserStudent({ ...centralStudentFields })), not
// supplied separately the way tryResolveAsEmployee supplies User.email.
const STUDENT_FIELDS = {
    email: 'student@sso-test.millennia21.id',
    name: 'Test Student',
    role: 'student',
    currentGrade: 'Grade 8',
    className: 'Grade 8 - Cartwheel',
};

describe('resolveOrProvisionSsoUser - source-hinted lookup order', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27019/integra-learn-sso-test');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        await User.deleteMany({ email: /@sso-test\.millennia21\.id$/ });
        await UserStudent.deleteMany({ email: /@sso-test\.millennia21\.id$/ });
    });

    test("source: 'employee' resolves without ever calling the student lookup", async () => {
        syncEmployeeFromCentral.mockResolvedValue(EMPLOYEE_FIELDS);

        const user = await resolveOrProvisionSsoUser('teacher@sso-test.millennia21.id', {
            tags: ['employee', 'teacher'],
            source: 'employee',
        });

        expect(user).not.toBeNull();
        expect(user.role).toBe('teacher');
        expect(syncEmployeeFromCentral).toHaveBeenCalledTimes(1);
        expect(syncStudentFromCentral).not.toHaveBeenCalled();
    });

    test("source: 'student' resolves without ever calling the employee lookup", async () => {
        syncStudentFromCentral.mockResolvedValue(STUDENT_FIELDS);

        const student = await resolveOrProvisionSsoUser('student@sso-test.millennia21.id', {
            tags: [],
            source: 'student',
        });

        expect(student).not.toBeNull();
        expect(student.name).toBe('Test Student');
        expect(syncStudentFromCentral).toHaveBeenCalledTimes(1);
        expect(syncEmployeeFromCentral).not.toHaveBeenCalled();
    });

    test("source: 'employee' falls through to the student check when the hint misses", async () => {
        syncEmployeeFromCentral.mockResolvedValue(null);
        syncStudentFromCentral.mockResolvedValue({
            ...STUDENT_FIELDS,
            email: 'mislabeled@sso-test.millennia21.id',
        });

        const result = await resolveOrProvisionSsoUser('mislabeled@sso-test.millennia21.id', {
            tags: [],
            source: 'employee',
        });

        expect(result).not.toBeNull();
        expect(result.name).toBe('Test Student');
        expect(syncEmployeeFromCentral).toHaveBeenCalledTimes(1);
        expect(syncStudentFromCentral).toHaveBeenCalledTimes(1);
    });

    test('no source hint falls back to the original student-first order', async () => {
        syncStudentFromCentral.mockResolvedValue(null);
        syncEmployeeFromCentral.mockResolvedValue(EMPLOYEE_FIELDS);

        const user = await resolveOrProvisionSsoUser('legacy-caller@sso-test.millennia21.id', {
            tags: ['employee'],
        });

        expect(user).not.toBeNull();
        expect(syncStudentFromCentral).toHaveBeenCalledTimes(1);
        expect(syncEmployeeFromCentral).toHaveBeenCalledTimes(1);
    });
});
