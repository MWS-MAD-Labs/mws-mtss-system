const User = require('../../src/models/User');
const UserStudent = require('../../src/models/UserStudent');
const { normalizeEmploymentStatus } = require('../../src/utils/employeeCentralSync');

// mws-data-center's MasterUnit table, queried directly against the real
// local Central database (2026-08-27). This is admin-editable master data,
// not a fixed enum on Central's side, so it can drift out from under
// MTSS's hardcoded schema enum silently - as it already had (BRIDGE, RISE,
// SHIELD, SAFE, COMPASS were missing, and any employee in one of those
// units could not log into MTSS at all: Mongoose rejected the save).
const CENTRAL_UNITS = [
    'BRIDGE', 'Kindergarten', 'Elementary', 'Pelangi', 'RISE', 'SHIELD',
    'SAFE', 'Junior High', 'COMPASS', 'Directorate', 'MAD Lab', 'CARE',
];

// mws-data-center's EmploymentType Prisma enum (prisma/schema.prisma) - the
// one enum Central genuinely fixes, so this list only needs updating if
// Central's schema itself changes.
const CENTRAL_EMPLOYMENT_TYPES = ['PERMANENT', 'CONTRACT', 'PART_TIME', 'PROBATION', 'FREELANCE', 'WFH'];

describe('User/UserStudent unit enum covers every real Central unit', () => {
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
});

describe('User.employmentStatus covers every Central EmploymentType', () => {
    test.each(CENTRAL_EMPLOYMENT_TYPES)('employment_type "%s" maps to a value accepted by the schema', (centralValue) => {
        const mapped = normalizeEmploymentStatus(centralValue);
        expect(mapped).toBeDefined();

        const user = new User({
            email: 'employment-check@millennia21.id',
            name: 'Employment Check',
            ssoProvisioned: true,
            employmentStatus: mapped,
        });
        const error = user.validateSync();
        expect(error?.errors?.employmentStatus).toBeUndefined();
    });
});
