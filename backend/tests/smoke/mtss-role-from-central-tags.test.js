const { deriveMtssRoleFromCentralTags } = require('../../src/utils/jobLevelRoleMapping');

describe('deriveMtssRoleFromCentralTags', () => {
    test('director tag outranks everything else', () => {
        expect(deriveMtssRoleFromCentralTags(['public', 'employee', 'staff', 'director'], 'Director', false))
            .toBe('directorate');
    });

    test('head-unit tag maps to head_unit regardless of job_level spelling', () => {
        expect(deriveMtssRoleFromCentralTags(['public', 'employee', 'staff', 'head-unit'], 'Kepala Unit', false))
            .toBe('head_unit');
    });

    test('principal tag maps to head_unit too - MTSS has no separate leader tier for it', () => {
        expect(deriveMtssRoleFromCentralTags(['public', 'employee', 'staff', 'principal'], 'Principal', false))
            .toBe('head_unit');
    });

    test('admin tag grants admin access even when job_level is unrecognized (the original bug)', () => {
        // This is exactly the case that used to silently fall through to
        // 'staff': a job_level ("Principal") outside the old 6-entry
        // dictionary. Hub's fuzzy tag matcher already recognizes it.
        expect(deriveMtssRoleFromCentralTags(['public', 'employee', 'staff', 'admin'], 'Principal', false))
            .toBe('admin');
    });

    test('teacher tag sub-classifies using job_level within the teaching-staff family, when Central confirms the job_level actually teaches', () => {
        expect(deriveMtssRoleFromCentralTags(['public', 'employee', 'staff', 'teacher'], 'SE Teacher', true))
            .toBe('se_teacher');
        expect(deriveMtssRoleFromCentralTags(['public', 'employee', 'staff', 'teacher'], 'Support Staff', true))
            .toBe('support_staff');
    });

    test('teacher tag with an unrecognized-but-teaching job_level falls through to generic teacher, not staff', () => {
        expect(deriveMtssRoleFromCentralTags(['public', 'employee', 'staff', 'teacher'], 'Coordinator', true))
            .toBe('teacher');
    });

    test('teacher tag with Central saying is_teaching_role is false lands on staff, regardless of job_level text', () => {
        // The rizqi bug: a MAD Lab developer carries only the baseline
        // 'employee'/'staff' tag from Hub (every active employee does),
        // and a job_level that matches nothing in
        // TEACHER_FAMILY_BY_JOB_LEVEL - it used to silently default to
        // 'teacher' and reach the teacher dashboard. Central's own
        // is_teaching_role flag on that job_level is now the deciding
        // signal instead of "did we fail to recognize the job_level".
        expect(deriveMtssRoleFromCentralTags(
            ['public', 'employee', 'staff'],
            'Junior',
            false,
        )).toBe('staff');
        expect(deriveMtssRoleFromCentralTags(
            ['public', 'employee', 'staff', 'teacher'],
            'Teacher',
            false,
        )).toBe('staff');
    });

    test('baseline staff tag with no more specific signal still grants staff-level access', () => {
        expect(deriveMtssRoleFromCentralTags(['public', 'employee', 'staff'], 'Staff', false))
            .toBe('staff');
    });

    test('no relevant tags at all yields no MTSS role', () => {
        expect(deriveMtssRoleFromCentralTags(['public', 'student'], null, false)).toBeNull();
        expect(deriveMtssRoleFromCentralTags([], 'Teacher', true)).toBeNull();
        expect(deriveMtssRoleFromCentralTags(undefined, 'Teacher', true)).toBeNull();
    });
});
