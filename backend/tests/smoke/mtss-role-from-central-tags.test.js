const { deriveMtssRoleFromCentralTags } = require('../../src/utils/jobLevelRoleMapping');

describe('deriveMtssRoleFromCentralTags', () => {
    test('director tag outranks everything else', () => {
        expect(deriveMtssRoleFromCentralTags(['public', 'employee', 'staff', 'director'], 'Director'))
            .toBe('directorate');
    });

    test('head-unit tag maps to head_unit regardless of job_level spelling', () => {
        expect(deriveMtssRoleFromCentralTags(['public', 'employee', 'staff', 'head-unit'], 'Kepala Unit'))
            .toBe('head_unit');
    });

    test('principal tag maps to head_unit too - MTSS has no separate leader tier for it', () => {
        expect(deriveMtssRoleFromCentralTags(['public', 'employee', 'staff', 'principal'], 'Principal'))
            .toBe('head_unit');
    });

    test('admin tag grants admin access even when job_level is unrecognized (the original bug)', () => {
        // This is exactly the case that used to silently fall through to
        // 'staff': a job_level ("Principal") outside the old 6-entry
        // dictionary. Hub's fuzzy tag matcher already recognizes it.
        expect(deriveMtssRoleFromCentralTags(['public', 'employee', 'staff', 'admin'], 'Principal'))
            .toBe('admin');
    });

    test('teacher tag sub-classifies using job_level within the teaching-staff family', () => {
        expect(deriveMtssRoleFromCentralTags(['public', 'employee', 'staff', 'teacher'], 'SE Teacher'))
            .toBe('se_teacher');
        expect(deriveMtssRoleFromCentralTags(['public', 'employee', 'staff', 'teacher'], 'Support Staff'))
            .toBe('support_staff');
    });

    test('teacher tag with an unrecognized job_level falls through to generic teacher, not staff', () => {
        expect(deriveMtssRoleFromCentralTags(['public', 'employee', 'staff', 'teacher'], 'Coordinator'))
            .toBe('teacher');
    });

    test('baseline staff tag with no more specific signal still grants staff-level access', () => {
        expect(deriveMtssRoleFromCentralTags(['public', 'employee', 'staff'], 'Staff'))
            .toBe('staff');
    });

    test('no relevant tags at all yields no MTSS role', () => {
        expect(deriveMtssRoleFromCentralTags(['public', 'student'], null)).toBeNull();
        expect(deriveMtssRoleFromCentralTags([], 'Teacher')).toBeNull();
        expect(deriveMtssRoleFromCentralTags(undefined, 'Teacher')).toBeNull();
    });
});
