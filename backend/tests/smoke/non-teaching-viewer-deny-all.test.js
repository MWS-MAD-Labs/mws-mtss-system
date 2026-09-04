const { applyViewerScope } = require('../../src/controllers/mtssStudentController');

// A viewer whose account somehow reaches the MTSS teacher dashboard but
// isn't actually a teacher (e.g. a MAD Lab developer's account, unit/job
// position matching no known teaching band) used to fall through
// applyViewerScope with zero grade/class clauses to add - the `if
// (gradeClauses.length)` guard meant nothing got pushed onto the filter at
// all, so the query ran unrestricted and returned every student in the
// system instead of none. Mirrors the deny-all fallback the 'student'
// branch already had for the equivalent "can't identify this viewer" case.
describe('applyViewerScope - non-teaching viewer with no derivable grade/unit scope', () => {
    test('denies all students instead of silently returning everyone', () => {
        const viewer = {
            role: 'teacher',
            unit: 'MAD Lab',
            jobPosition: 'Junior Full Stack Web Developer',
            classes: [],
        };

        const filter = applyViewerScope({}, viewer);

        expect(filter.$and).toBeDefined();
        expect(filter.$and).toContainEqual({ _id: null });
        // No grade/class $or clause should have snuck in alongside the
        // deny-all - the empty case takes over the whole filter.
        expect(filter.$and.some((clause) => clause.$or)).toBe(false);
    });

    test('a real teacher with a legitimate unit still gets scoped, not denied', () => {
        const viewer = {
            role: 'teacher',
            unit: 'Junior High',
            jobPosition: 'Coding Teacher',
            classes: [{ grade: 'Junior High', className: 'Junior High - Coding' }],
        };

        const filter = applyViewerScope({}, viewer);

        expect(filter.$and).toBeDefined();
        expect(filter.$and).not.toContainEqual({ _id: null });
        expect(filter.$and.some((clause) => clause.$or)).toBe(true);
    });
});
