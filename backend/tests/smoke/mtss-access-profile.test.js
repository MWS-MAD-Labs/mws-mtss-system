const { buildMtssAccessProfile } = require('../../src/utils/accessControl');

// These cover the leader allowlist removal: once the SSO sync derives
// role='head_unit' straight from Central's own "Head Unit" job_level (see
// jobLevelRoleMapping.js), the native-role branch here already grants leader
// access on its own - the allowlist that used to exist for four named
// people (aria/faisal/kholida/latifah) is redundant, not load-bearing.
describe('buildMtssAccessProfile - leader access via native role (post-allowlist-removal)', () => {
    test('a user with role head_unit gets leader access without needing an email allowlist', () => {
        const profile = buildMtssAccessProfile({ email: 'someone-not-on-any-list@millennia21.id', role: 'head_unit' });
        expect(profile.hasAccess).toBe(true);
        expect(profile.canAccessAdmin).toBe(true);
        expect(profile.accessLevel).toBe('leader');
        expect(profile.source).toBe('native_role');
    });

    test('a plain teacher role does not get leader/admin access', () => {
        const profile = buildMtssAccessProfile({ email: 'teacher@millennia21.id', role: 'teacher' });
        expect(profile.canAccessAdmin).toBe(false);
        expect(profile.accessLevel).toBe('teacher');
    });
});

// The observer allowlist is a deliberate cap, not a data gap: Mahrukh's
// Central job_level is "Director" (which the native-role branch would grant
// full admin access to), but she must stay read-only in MTSS specifically.
// This must keep winning even though her role field says something higher.
describe('buildMtssAccessProfile - observer allowlist deliberately caps a higher native role', () => {
    test('mahrukh gets read-only observer access even with role directorate', () => {
        const profile = buildMtssAccessProfile({ email: 'mahrukh@millennia21.id', role: 'directorate' });
        expect(profile.hasAccess).toBe(true);
        expect(profile.isReadOnly).toBe(true);
        expect(profile.canAccessAdmin).toBe(false);
        expect(profile.accessLevel).toBe('observer');
        expect(profile.source).toBe('default_observer_allowlist');
    });

    test('the same directorate role for anyone else gets full (non-read-only) admin access', () => {
        const profile = buildMtssAccessProfile({ email: 'someone-else@millennia21.id', role: 'directorate' });
        expect(profile.isReadOnly).toBe(false);
        expect(profile.canAccessAdmin).toBe(true);
        expect(profile.source).toBe('native_role');
    });
});
