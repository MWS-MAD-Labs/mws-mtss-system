const { nextRole } = require('../../src/utils/ssoUserResolution');

describe('nextRole (SSO sync guard)', () => {
    test('never downgrades an existing superadmin, even when Central only signals admin', () => {
        expect(nextRole('admin', 'superadmin')).toBe('superadmin');
        expect(nextRole('teacher', 'superadmin')).toBe('superadmin');
        expect(nextRole(null, 'superadmin')).toBe('superadmin');
    });

    test('applies the freshly derived role for everyone else', () => {
        expect(nextRole('head_unit', 'teacher')).toBe('head_unit');
        expect(nextRole('admin', 'staff')).toBe('admin');
    });

    test('keeps the existing role when Central gives no signal this sync', () => {
        expect(nextRole(null, 'head_unit')).toBe('head_unit');
    });

    test('falls back to staff when there is neither a derived role nor an existing one', () => {
        expect(nextRole(null, null)).toBe('staff');
        expect(nextRole(null, undefined)).toBe('staff');
    });
});
