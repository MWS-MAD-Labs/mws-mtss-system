const {
    isAssignmentOwnerOrAdmin,
    isAssignmentInViewerTeachingScope,
    canViewerSeeAssignment
} = require('../../src/controllers/mtssController');

// Editing an intervention plan (type, status, dates, strategy, frequency,
// goals - anything in PLAN_EDITABLE_FIELDS) used to be gated the same way
// as roster visibility: any homeroom teacher for the class, or any subject
// teacher whose subject matched, could edit a plan someone else created.
// That meant Subject Teacher D could silently rewrite or cancel an
// intervention Homeroom Teacher C created for the same student, and vice
// versa. isAssignmentOwnerOrAdmin is the fix: only the creator, the
// assigned mentor, or someone holding mtss.admin can actually change it - everyone
// else can still see it (isAssignmentInViewerTeachingScope, unchanged),
// just not touch it.
describe('isAssignmentOwnerOrAdmin - who can actually edit/cancel an intervention', () => {
    const assignment = {
        createdBy: 'teacher-c-id',
        mentorId: 'teacher-c-id',
    };

    test('the creator can edit their own intervention', () => {
        const viewer = { id: 'teacher-c-id', permissions: ['mtss.read'] };
        expect(isAssignmentOwnerOrAdmin({ viewer, assignment })).toBe(true);
    });

    test('the assigned mentor can edit even if they did not create it', () => {
        const differentMentorAssignment = { createdBy: 'teacher-c-id', mentorId: 'teacher-e-id' };
        const viewer = { id: 'teacher-e-id', permissions: ['mtss.read'] };
        expect(isAssignmentOwnerOrAdmin({ viewer, assignment: differentMentorAssignment })).toBe(true);
    });

    test('a homeroom teacher for the same class cannot edit someone else\'s intervention', () => {
        const viewer = {
            id: 'teacher-c-homeroom-id',
            permissions: ['mtss.read'],
            classes: [{ role: 'Homeroom Teacher', grade: 'Grade 3', className: 'Grade 3 - B' }],
        };
        expect(isAssignmentOwnerOrAdmin({ viewer, assignment })).toBe(false);
    });

    test('a matching subject teacher cannot edit someone else\'s intervention', () => {
        const viewer = {
            id: 'teacher-d-id',
            permissions: ['mtss.read'],
            classes: [{ role: 'Subject Teacher', grade: 'Grade 3', className: 'Grade 3 - B', subject: 'Math' }],
        };
        expect(isAssignmentOwnerOrAdmin({ viewer, assignment })).toBe(false);
    });

    test('an unrelated teacher with no connection cannot edit it', () => {
        const viewer = { id: 'random-teacher-id', permissions: ['mtss.read'], classes: [] };
        expect(isAssignmentOwnerOrAdmin({ viewer, assignment })).toBe(false);
    });

    test('someone holding mtss.admin can always edit any intervention, owner or not', () => {
        const viewer = { id: 'someone-else-id', permissions: ['mtss.read', 'mtss.admin'] };
        expect(isAssignmentOwnerOrAdmin({ viewer, assignment })).toBe(true);
    });

    test('a plain "principal"-style non-admin role without ownership is still denied', () => {
        const viewer = { id: 'principal-id', permissions: ['mtss.read', 'mtss.write'] };
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

describe('canViewerSeeAssignment - shared list/detail visibility', () => {
    const students = [{ currentGrade: 'Grade 3', className: 'Grade 3 - B' }];
    const assignment = { createdBy: 'creator-id', mentorId: 'mentor-id', focusAreas: ['Math'] };

    test('owners and admins can see an assignment', () => {
        expect(canViewerSeeAssignment({ viewer: { id: 'mentor-id', permissions: ['mtss.read'] }, assignment, students })).toBe(true);
        expect(canViewerSeeAssignment({ viewer: { id: 'admin-id', permissions: ['mtss.admin'] }, assignment, students })).toBe(true);
    });

    test('teaching scope grants visibility but unrelated teachers are denied', () => {
        const mathTeacher = {
            id: 'math-teacher-id',
            permissions: ['mtss.read'],
            classes: [{ role: 'Subject Teacher', grade: 'Grade 3', className: 'Grade 3 - B', subject: 'Math' }]
        };
        expect(canViewerSeeAssignment({ viewer: mathTeacher, assignment, students })).toBe(true);
        expect(canViewerSeeAssignment({ viewer: { id: 'other-id', permissions: ['mtss.read'], classes: [] }, assignment, students })).toBe(false);
    });
});
