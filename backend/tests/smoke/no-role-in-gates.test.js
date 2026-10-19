const fs = require('fs');
const path = require('path');

// Who may open what comes from the permissions Central gave, never from a job label kept here.
// The routes and the scope rules must not read role, jobKind or a role name.
const read = (...parts) => fs.readFileSync(path.join(__dirname, '../../src', ...parts), 'utf8');
const routeFiles = fs.readdirSync(path.join(__dirname, '../../src/routes')).map((name) => ['routes', name]);

const FORBIDDEN = /\.role\b|\.jobKind\b|\.personType\b|'(directorate|head_unit|superadmin|admin|teacher|se_teacher|support_staff|counselor)'/;

describe('access gates', () => {
    const withoutComments = (source) => source.split('\n').filter((line) => !line.trim().startsWith('//')).join('\n');

    test.each(routeFiles)('%s/%s reads no role', (...parts) => {
        expect(withoutComments(read(...parts))).not.toMatch(FORBIDDEN);
    });

    // A student is told apart by personType (own record only), everything else is a permission.
    test('the scope rules read no role', () => {
        const source = withoutComments(read('utils', 'accessScope.js'));
        expect(source).not.toMatch(/\.role\b|\.jobKind\b|'(directorate|head_unit|superadmin|admin|teacher|se_teacher|support_staff|counselor)'/);
    });

    test('the authenticate middleware gates on permissions only', () => {
        const source = read('middleware', 'auth.js');
        const gates = source.slice(source.indexOf('const requireAnyPermission'));
        expect(gates).not.toMatch(/\.role\b|\.jobKind\b/);
    });
});
