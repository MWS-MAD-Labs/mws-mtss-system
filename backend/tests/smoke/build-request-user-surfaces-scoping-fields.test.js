const { buildRequestUser } = require('../../src/middleware/auth');

// applyViewerScope/ensureStudentsWithinViewerScope (mtssAccess.js,
// mtssStudentController.js, mtssController.js) read classes/
// supportedStudentIds off req.user, which is exactly what
// buildRequestUser() produces from the stored Mongoose document on every
// authenticated request. A field present on the User schema but missing
// from this function's return value is invisible to every scoping check
// regardless of what's actually stored in Mongo - this is what silently
// broke se_teacher's roster (supportedStudentIds) when it was added to
// the schema/sync job without also being added here.
describe('buildRequestUser - surfaces the fields access scoping depends on', () => {
    test('surfaces classes[] for teacher/homeroom scoping', () => {
        const user = {
            _id: 'user-1',
            email: 'teacher@millennia21.id',
            role: 'teacher',
            classes: [{ grade: 'Grade 8', className: 'Grade 8 - Cartwheel', role: 'Homeroom Teacher' }],
        };

        const requestUser = buildRequestUser(user);

        expect(requestUser.classes).toEqual(user.classes);
    });

    test('surfaces supportedStudentIds for se_teacher scoping', () => {
        const user = {
            _id: 'user-2',
            email: 'se-teacher@millennia21.id',
            role: 'se_teacher',
            supportedStudentIds: ['64f000000000000000000001', '64f000000000000000000002'],
        };

        const requestUser = buildRequestUser(user);

        expect(requestUser.supportedStudentIds).toEqual(user.supportedStudentIds);
    });

    test('defaults classes/supportedStudentIds to empty arrays rather than undefined when unset', () => {
        const user = {
            _id: 'user-3',
            email: 'no-assignments@millennia21.id',
            role: 'staff',
        };

        const requestUser = buildRequestUser(user);

        expect(requestUser.classes).toEqual([]);
        expect(requestUser.supportedStudentIds).toEqual([]);
    });
});
