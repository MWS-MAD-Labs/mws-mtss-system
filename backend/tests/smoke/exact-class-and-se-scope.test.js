const { applyViewerScope } = require('../../src/controllers/mtssStudentController');

// An assigned viewer gets one $or of alternatives: the supported students and/or the classes taught.
const alternativesOf = (filter) => filter.$and.find((clause) => clause.$or).$or;
const classAlternativeOf = (filter) => alternativesOf(filter).find((alt) => alt.$and);

// Central's own class system is the single source of truth for "who
// teaches what" - homeroom, supporting homeroom, and subject teachers all
// get exactly the classes Central's ClassTeacherAssignment says they
// teach, never widened to a whole grade or unit (see
// no-verified-assignment-deny-all.test.js for the "zero classes -> zero
// students" half of this; this file covers "one real class -> only that
// class", which used to fail for Junior High specifically before this
// fix - a JH homeroom teacher with a single Grade 8 class used to see
// every Grade 8 student in the school).
describe('applyViewerScope - exact class scoping (no grade/unit widening)', () => {
    test('a Junior High homeroom teacher with one real class is scoped to that class only', () => {
        const viewer = {
            permissions: ['mtss.read'],
            mtssScope: { mode: 'assigned' },
            unit: 'Junior High',
            jobPosition: 'Homeroom Teacher',
            classes: [{ grade: 'Grade 8', className: 'Grade 8 - Cartwheel', role: 'Homeroom Teacher' }],
        };

        const filter = applyViewerScope({}, viewer);

        expect(filter.$and).toBeDefined();
        expect(filter.$and).not.toContainEqual({ _id: null });
        const classClauses = classAlternativeOf(filter).$and[0].$or;
        // Exactly one class matched, not every Grade 8 class in the unit -
        // a single regex clause naming this specific room.
        expect(classClauses).toHaveLength(1);
        expect(classClauses[0].className.test('Grade 8 - Cartwheel')).toBe(true);
        expect(classClauses[0].className.test('Grade 8 - Mount Roraima')).toBe(false);
    });

    test('excludes students with no current class assigned yet', () => {
        const viewer = {
            permissions: ['mtss.read'],
            mtssScope: { mode: 'assigned' },
            unit: 'Junior High',
            jobPosition: 'Homeroom Teacher',
            classes: [{ grade: 'Grade 8', className: 'Grade 8 - Cartwheel', role: 'Homeroom Teacher' }],
        };

        const filter = applyViewerScope({}, viewer);

        expect(classAlternativeOf(filter).$and).toContainEqual({ className: { $exists: true, $nin: [null, ''] } });
    });

    test('a mixed-age Kindergarten room still matches by class name alone, no grade clause needed', () => {
        // jobs/centralSync.js pushes one classes[] entry per grade
        // a mixed room holds, all sharing the same className - matching by
        // className already covers every grade physically in that room.
        const viewer = {
            permissions: ['mtss.read'],
            mtssScope: { mode: 'assigned' },
            unit: 'Kindergarten',
            jobPosition: 'Homeroom Teacher',
            classes: [
                { grade: 'Kindergarten K1', className: 'Kindergarten - Sunrise Room', role: 'Homeroom Teacher' },
                { grade: 'Kindergarten Pre-K', className: 'Kindergarten - Sunrise Room', role: 'Homeroom Teacher' },
            ],
        };

        const filter = applyViewerScope({}, viewer);

        const classClauses = classAlternativeOf(filter).$and[0].$or;
        expect(classClauses).toHaveLength(1);
        expect(classClauses[0].className.test('Kindergarten - Sunrise Room')).toBe(true);
    });
});

describe('applyViewerScope - SE teacher scoped by supported students, not classes', () => {
    test('an SE teacher with supportedStudentIds is scoped to exactly those students', () => {
        const viewer = {
            permissions: ['mtss.read'],
            mtssScope: { mode: 'assigned' },
            unit: 'Junior High',
            jobPosition: 'Special Education Teacher',
            classes: [],
            supportedStudentIds: ['64f000000000000000000001', '64f000000000000000000002'],
        };

        const filter = applyViewerScope({}, viewer);

        expect(alternativesOf(filter)).toEqual([
            { _id: { $in: ['64f000000000000000000001', '64f000000000000000000002'] } },
        ]);
    });

    test('an SE teacher with no verified supported students is denied, not widened to their unit', () => {
        const viewer = {
            permissions: ['mtss.read'],
            mtssScope: { mode: 'assigned' },
            unit: 'Junior High',
            jobPosition: 'Special Education Teacher',
            classes: [],
            supportedStudentIds: [],
        };

        const filter = applyViewerScope({}, viewer);

        expect(filter.$and).toContainEqual({ _id: null });
    });
});

describe('applyViewerScope - classes taught plus students supported', () => {
    test('a teacher who also supports students sees both, not just one', () => {
        const viewer = {
            permissions: ['mtss.read'],
            mtssScope: { mode: 'assigned' },
            classes: [{ grade: 'Grade 8', className: 'Grade 8 - Cartwheel', role: 'Homeroom Teacher' }],
            supportedStudentIds: ['64f000000000000000000001'],
        };

        const alternatives = alternativesOf(applyViewerScope({}, viewer));

        expect(alternatives).toHaveLength(2);
        expect(alternatives).toContainEqual({ _id: { $in: ['64f000000000000000000001'] } });
    });
});
