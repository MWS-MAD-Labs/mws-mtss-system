const { isAssignmentOwnerOrAdmin, isAssignmentInViewerTeachingScope } = require('../../src/controllers/mtssController');

// Editing an intervention plan (type, status, dates, strategy, frequency,
// goals - anything in PLAN_EDITABLE_FIELDS) used to be gated the same way
// as roster visibility: any homeroom teacher for the class, or any subject
// teacher whose subject matched, could edit a plan someone else created.
// That meant Subject Teacher D could silently rewrite or cancel an
// intervention Homeroom Teacher C created for the same student, and vice
// versa. isAssignmentOwnerOrAdmin is the fix: only the creator, the
// assigned mentor, or an MTSS admin role can actually change it - everyone
// else can still see it (isAssignmentInViewerTeachingScope, unchanged),
// just not touch it.
describe('isAssignmentOwnerOrAdmin - who can actually edit/cancel an intervention', () => {
    const assignment = {
        createdBy: 'teacher-c-id',
        mentorId: 'teacher-c-id',
    };

    test('the creator can edit their own intervention', () => {
        const viewer = { id: 'teacher-c-id', role: 'teacher' };
        expect(isAssignmentOwnerOrAdmin({ viewer, assignment })).toBe(true);
    });

    test('the assigned mentor can edit even if they did not create it', () => {
        const differentMentorAssignment = { createdBy: 'teacher-c-id', mentorId: 'teacher-e-id' };
        const viewer = { id: 'teacher-e-id', role: 'se_teacher' };
        expect(isAssignmentOwnerOrAdmin({ viewer, assignment: differentMentorAssignment })).toBe(true);
    });

    test('a homeroom teacher for the same class cannot edit someone else\'s intervention', () => {
        const viewer = {
            id: 'teacher-c-homeroom-id',
            role: 'teacher',
            classes: [{ role: 'Homeroom Teacher', grade: 'Grade 3', className: 'Grade 3 - B' }],
        };
        expect(isAssignmentOwnerOrAdmin({ viewer, assignment })).toBe(false);
    });

    test('a matching subject teacher cannot edit someone else\'s intervention', () => {
        const viewer = {
            id: 'teacher-d-id',
            role: 'teacher',
            classes: [{ role: 'Subject Teacher', grade: 'Grade 3', className: 'Grade 3 - B', subject: 'Math' }],
        };
        expect(isAssignmentOwnerOrAdmin({ viewer, assignment })).toBe(false);
    });

    test('an unrelated teacher with no connection cannot edit it', () => {
        const viewer = { id: 'random-teacher-id', role: 'teacher', classes: [] };
        expect(isAssignmentOwnerOrAdmin({ viewer, assignment })).toBe(false);
    });

    test.each(['admin', 'superadmin', 'directorate', 'head_unit'])(
        '%s can always edit any intervention, owner or not',
        (role) => {
            const viewer = { id: 'someone-else-id', role };
            expect(isAssignmentOwnerOrAdmin({ viewer, assignment })).toBe(true);
        },
    );

    test('a plain "principal"-style non-admin role without ownership is still denied', () => {
        const viewer = { id: 'principal-id', role: 'staff' };
        expect(isAssignmentOwnerOrAdmin({ viewer, assignment })).toBe(false);
    });
});

// Visibility is a separate, unchanged concern - a homeroom/matching
// subject teacher should still SEE an intervention someone else created
// for their student, they just can't edit it (see suite above).
describe('isAssignmentInViewerTeachingScope - visibility is unaffected by the ownership change', () => {
    const student = { currentGrade: 'Grade 3', className: 'Grade 3 - B' };
    const assignment = { createdBy: 'teacher-c-id', mentorId: 'teacher-c-id', focusAreas: ['Math'] };

    test('a homeroom teacher for the class still sees an intervention they did not create', () => {
        const viewer = {
            id: 'teacher-c-homeroom-id',
            classes: [{ role: 'Homeroom Teacher', grade: 'Grade 3', className: 'Grade 3 - B' }],
        };
        expect(
            isAssignmentInViewerTeachingScope({ viewer, assignment, students: [student] }),
        ).toBe(true);
    });

    test('a matching subject teacher still sees it too', () => {
        const viewer = {
            id: 'teacher-d-id',
            classes: [{ role: 'Subject Teacher', grade: 'Grade 3', className: 'Grade 3 - B', subject: 'Math' }],
        };
        expect(
            isAssignmentInViewerTeachingScope({ viewer, assignment, students: [student] }),
        ).toBe(true);
    });

    test('an unrelated teacher does not see it', () => {
        const viewer = { id: 'random-teacher-id', classes: [] };
        expect(
            isAssignmentInViewerTeachingScope({ viewer, assignment, students: [student] }),
        ).toBe(false);
    });
});
