const { APP_ID, validateEntitlement, entitlementProjection, projectionChanged, applyEntitlementProjection } = require('../../src/utils/centralEntitlement');

const entitlement = (over = {}) => ({
    id: 'ent-1',
    application_id: APP_ID,
    organization_id: 'org-test',
    role: 'TEACHER',
    permissions: ['users.read', 'sync.read'],
    version: 3,
    ...over,
});

describe('entitlement of Central', () => {
    it('is for the application named mtss unless the .env names another', () => {
        expect(APP_ID).toBe('mtss');
    });

    it('is accepted for this application and organization, with the permissions sorted and once', () => {
        const valid = validateEntitlement(entitlement({ permissions: ['sync.read', 'users.read', 'sync.read'] }), 'org-test');
        expect(valid.permissions).toEqual(['sync.read', 'users.read']);
        expect(valid.version).toBe(3);
    });

    it('leaves out a permission this code does not know instead of refusing the whole role', () => {
        const valid = validateEntitlement(entitlement({ permissions: ['users.read', 'removed.long.ago'] }), 'org-test');
        expect(valid.permissions).toEqual(['users.read']);
    });

    it('is refused for another application, another organization, or an organization that is not configured', () => {
        expect(() => validateEntitlement(entitlement({ application_id: 'daily-checkin' }), 'org-test')).toThrow(/another application/);
        expect(() => validateEntitlement(entitlement({ organization_id: 'other' }), 'org-test')).toThrow(/organization/);
        expect(() => validateEntitlement(entitlement(), '')).toThrow(/not configured/);
    });

    it('is refused when it carries something it should not, or lacks what it needs', () => {
        expect(() => validateEntitlement({ ...entitlement(), extra: true }, 'org-test')).toThrow();
        expect(() => validateEntitlement(entitlement({ version: -1 }), 'org-test')).toThrow();
        expect(() => validateEntitlement(entitlement({ role: '' }), 'org-test')).toThrow();
    });

    it('tells a changed projection from the same one', () => {
        const valid = validateEntitlement(entitlement(), 'org-test');
        const projection = entitlementProjection(valid);
        const person = { ...projection };
        expect(projectionChanged(person, projection)).toBe(false);
        expect(projectionChanged({ ...person, centralEntitlementVersion: 2 }, projection)).toBe(true);
        expect(projectionChanged({ ...person, centralEntitlementPermissions: ['users.read'] }, projection)).toBe(true);
        expect(projectionChanged({}, projection)).toBe(true);
    });

    it('writes the projection on a person and says whether anything changed', () => {
        const valid = validateEntitlement(entitlement(), 'org-test');
        const person = {};
        expect(applyEntitlementProjection(person, valid)).toBe(true);
        expect(person.centralEntitlementRole).toBe('TEACHER');
        expect(applyEntitlementProjection(person, valid)).toBe(false);
    });
});
