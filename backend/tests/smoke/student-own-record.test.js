const { applyViewerScope } = require('../../src/controllers/mtssStudentController');

// A student reaches only their own record, and only by the email Central verified.
describe('a student viewing MTSS', () => {
    const student = (over = {}) => ({ personType: 'student', permissions: ['mtss.read'], ...over });

    test('is matched by email only, never by a name that another student could share', () => {
        const filter = applyViewerScope({}, student({ email: 'kid@school.test', name: 'Alex', nickname: 'Alex', username: 'alex' }));
        expect(filter.$and).toHaveLength(1);
        const [clause] = filter.$and;
        expect(Object.keys(clause)).toEqual(['email']);
        expect(clause.email.test('kid@school.test')).toBe(true);
        expect(clause.email.test('other@school.test')).toBe(false);
    });

    test('is shown nothing at all when the email is not known', () => {
        const filter = applyViewerScope({}, student({ name: 'Alex', nickname: 'Alex' }));
        expect(filter.$and).toEqual([{ _id: null }]);
    });
});
