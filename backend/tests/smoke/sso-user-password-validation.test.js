const User = require('../../src/models/User');
const UserStudent = require('../../src/models/UserStudent');

// Reproduces the exact SSO handoff failure: "User validation failed:
// password: Path `password` is required." The Hub SSO relay flow never
// sets googleId (that field is a leftover from the removed direct-Google
// OAuth flow) or a password, so the schema's required-unless-googleId rule
// used to reject every brand-new SSO-provisioned account.
describe('User/UserStudent password requirement - SSO-provisioned accounts', () => {
    test('an SSO-provisioned employee (ssoProvisioned: true, no googleId/password) passes validation', () => {
        const user = new User({
            email: 'someone@millennia21.id',
            name: 'Someone',
            employeeId: '11.11.111',
            role: 'se_teacher',
            ssoProvisioned: true,
        });
        const error = user.validateSync();
        expect(error).toBeUndefined();
    });

    test('having employeeId alone (no ssoProvisioned flag) does not waive the password requirement', () => {
        // employeeId means "has a Central employee number", not "authenticates
        // via SSO" - an admin could link a manual/password account to a real
        // employeeId without that account suddenly no longer needing a password.
        const user = new User({
            email: 'linked-manual@millennia21.id',
            name: 'Linked But Manual',
            employeeId: '99.99.999',
        });
        const error = user.validateSync();
        expect(error?.errors?.password).toBeDefined();
    });

    test('a manually-created employee with no ssoProvisioned/password still fails (unchanged behavior)', () => {
        const user = new User({
            email: 'manual@millennia21.id',
            name: 'Manual Account',
        });
        const error = user.validateSync();
        expect(error?.errors?.password).toBeDefined();
    });

    test('an SSO-provisioned student (ssoProvisioned: true, no googleId/password) passes validation', () => {
        const student = new UserStudent({
            email: 'student@millennia21.id',
            name: 'A Student',
            ssoProvisioned: true,
        });
        const error = student.validateSync();
        expect(error).toBeUndefined();
    });

    test('a manually-created student with no password and ssoProvisioned unset still fails (unchanged behavior)', () => {
        const student = new UserStudent({
            email: 'manual-student@millennia21.id',
            name: 'Manual Student',
        });
        const error = student.validateSync();
        expect(error?.errors?.password).toBeDefined();
    });
});
