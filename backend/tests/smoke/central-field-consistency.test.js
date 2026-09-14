const User = require('../../src/models/User');
const UserStudent = require('../../src/models/UserStudent');

// mws-data-center's MasterUnit table, queried directly against the real
// local Central database (2026-08-27). This is admin-editable master data,
// not a fixed enum on Central's side - it previously drifted out from under
// MTSS's hardcoded schema enum silently (BRIDGE, RISE, SHIELD, SAFE, COMPASS
// were missing, and any employee in one of those units could not log into
// MTSS at all: Mongoose rejected the save). department/unit/jobLevel no
// longer have an enum constraint (see models/User.js) specifically so this
// class of incident can't recur - these tests are a regression guard
// against that constraint ever coming back, not a coverage list to maintain.
const CENTRAL_UNITS = [
    'BRIDGE', 'Kindergarten', 'Elementary', 'Pelangi', 'RISE', 'SHIELD',
    'SAFE', 'Junior High', 'COMPASS', 'Directorate', 'MAD Lab', 'CARE',
];

// mws-data-center's EmploymentType Prisma enum (prisma/schema.prisma) -
// User.employmentStatus stores this exact casing, no local mapping.
const CENTRAL_EMPLOYMENT_TYPES = ['PERMANENT', 'CONTRACT', 'PART_TIME', 'PROBATION', 'FREELANCE', 'WFH'];

describe('User/UserStudent department/unit/jobLevel have no fixed enum', () => {
    test('User.schema has no enum constraint on department/unit/jobLevel', () => {
        expect(User.schema.path('department').enumValues).toEqual([]);
        expect(User.schema.path('unit').enumValues).toEqual([]);
        expect(User.schema.path('jobLevel').enumValues).toEqual([]);
    });

    test.each(CENTRAL_UNITS)('unit "%s" is accepted by User.unit/department', (unit) => {
        const user = new User({
            email: 'unit-check@millennia21.id',
            name: 'Unit Check',
            ssoProvisioned: true,
            unit,
            department: unit,
        });
        const error = user.validateSync();
        expect(error?.errors?.unit).toBeUndefined();
        expect(error?.errors?.department).toBeUndefined();
    });

    test.each(CENTRAL_UNITS)('unit "%s" is accepted by UserStudent.unit/department', (unit) => {
        const student = new UserStudent({
            email: 'unit-check-student@millennia21.id',
            name: 'Unit Check Student',
            ssoProvisioned: true,
            unit,
            department: unit,
        });
        const error = student.validateSync();
        expect(error?.errors?.unit).toBeUndefined();
        expect(error?.errors?.department).toBeUndefined();
    });

    test('a not-yet-seen unit name is still accepted (no fixed vocabulary)', () => {
        const user = new User({
            email: 'unit-check-future@millennia21.id',
            name: 'Future Unit Check',
            ssoProvisioned: true,
            unit: 'Some Brand New Unit',
            department: 'Some Brand New Unit',
        });
        const error = user.validateSync();
        expect(error?.errors?.unit).toBeUndefined();
        expect(error?.errors?.department).toBeUndefined();
    });
});

describe('User.employmentStatus accepts Central\'s EmploymentType values directly', () => {
    test.each(CENTRAL_EMPLOYMENT_TYPES)('employment_type "%s" is accepted as-is, no mapping', (centralValue) => {
        const user = new User({
            email: 'employment-check@millennia21.id',
            name: 'Employment Check',
            ssoProvisioned: true,
            employmentStatus: centralValue,
        });
        const error = user.validateSync();
        expect(error?.errors?.employmentStatus).toBeUndefined();
    });
});
