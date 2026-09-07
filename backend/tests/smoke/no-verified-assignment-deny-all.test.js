const { applyViewerScope } = require('../../src/controllers/mtssStudentController');

// A teacher/SE teacher whose unit resolves to a known teaching band (Junior
// High, Elementary, Kindergarten) but who has zero verified class
// assignments from Central (classes: [], e.g. a test/dummy employee record
// that was never actually put into a class) used to fall back to
// deriveAllowedGradesForUser's "no specific classes -> assume this
// person's whole unit" behavior, granting unit-wide roster access (all of
// Grade 7/8/9 for Junior High) despite Central confirming no assignment at
// all. teacherClassAssignmentSync.js keeps classes[] authoritatively in
// sync with Central every 15 minutes, so an empty classes[] now reliably
// means "Central confirms zero assignments," not "not synced yet" - the
// roster (and anything that must match it) should deny-all here, the same
// as the non-teaching-viewer case in non-teaching-viewer-deny-all.test.js.
describe('applyViewerScope - known teaching unit but no verified Central assignment', () => {
    test('a Junior High "teacher" with no classes gets denied, not the whole unit', () => {
        const viewer = {
            role: 'teacher',
            unit: 'Junior High',
            jobPosition: 'Homeroom Teacher',
            classes: [],
        };

        const filter = applyViewerScope({}, viewer);

        expect(filter.$and).toBeDefined();
        expect(filter.$and).toContainEqual({ _id: null });
        expect(filter.$and.some((clause) => clause.$or)).toBe(false);
    });

    test('an Elementary "teacher" with no classes gets denied too', () => {
        const viewer = {
            role: 'teacher',
            unit: 'Elementary',
            jobPosition: 'Homeroom Teacher',
            classes: [],
        };

        const filter = applyViewerScope({}, viewer);

        expect(filter.$and).toContainEqual({ _id: null });
        expect(filter.$and.some((clause) => clause.$or)).toBe(false);
    });

    test('the same Junior High teacher, once Central sync populates a real class, gets scoped normally', () => {
        const viewer = {
            role: 'teacher',
            unit: 'Junior High',
            jobPosition: 'Homeroom Teacher',
            classes: [{ grade: 'Grade 7', className: 'Grade 7 - Huangshan' }],
        };

        const filter = applyViewerScope({}, viewer);

        expect(filter.$and).not.toContainEqual({ _id: null });
        expect(filter.$and.some((clause) => clause.$or)).toBe(true);
    });
});
