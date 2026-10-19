const mongoose = require('mongoose');
const { VISIBLE_STUDENT_FILTER, isVisibleStudent } = require('../../src/utils/studentVisibility');
const { buildFilter } = require('../../src/controllers/mtssStudentController');
const { withoutHiddenStudents, markMissingMentors, MENTOR_MISSING_LABEL } = require('../../src/controllers/mtssController');
const MentorAssignment = require('../../src/models/MentorAssignment');

// Only students Central has put in a class (ACTIVE) and still lists are seen in MTSS.
describe('who is visible in MTSS', () => {
    test('an ACTIVE student that Central still lists is visible, nobody else is', () => {
        expect(isVisibleStudent({ status: 'ACTIVE', orphanedAt: null })).toBe(true);
        expect(isVisibleStudent({ status: 'ACTIVE' })).toBe(true);
        expect(isVisibleStudent({ status: 'REGISTERED' })).toBe(false);
        expect(isVisibleStudent({ status: 'GRADUATED' })).toBe(false);
        expect(isVisibleStudent({ status: 'active' })).toBe(false);
        expect(isVisibleStudent({ status: 'ACTIVE', orphanedAt: new Date() })).toBe(false);
        expect(isVisibleStudent(null)).toBe(false);
    });

    test('the student list filter cannot be widened by the query', () => {
        for (const query of [{}, { status: 'REGISTERED' }, { status: 'all' }, { orphaned: 'all' }, { orphaned: 'true' }]) {
            const filter = buildFilter(query);
            expect(filter.status).toBe(VISIBLE_STUDENT_FILTER.status);
            expect(filter.orphanedAt).toBeNull();
        }
    });

    describe('plans', () => {
        const live = { _id: 'a', name: 'Live', status: 'ACTIVE' };
        const registered = { _id: 'b', name: 'Registered', status: 'REGISTERED' };
        const gone = { _id: 'c', name: 'Gone', status: 'ACTIVE', orphanedAt: new Date() };

        test('a plan whose students are all hidden is not shown', () => {
            expect(withoutHiddenStudents([{ _id: 1, studentIds: [registered, gone] }])).toEqual([]);
        });

        test('a plan keeps the students that are visible', () => {
            const [plan] = withoutHiddenStudents([{ _id: 1, studentIds: [live, registered, gone] }]);
            expect(plan.studentIds).toEqual([live]);
        });

        test('a plan with only visible students, or none at all, is left alone', () => {
            const full = { _id: 1, studentIds: [live] };
            const empty = { _id: 2, studentIds: [] };
            expect(withoutHiddenStudents([full, empty])).toEqual([full, empty]);
        });
    });
});

describe('plans whose mentor is gone', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI);
    });
    afterAll(async () => {
        await MentorAssignment.deleteMany({ notes: 'mentor-gone-test' });
        await mongoose.disconnect();
    });

    test('a stored mentor id with nobody behind it is labelled, a plan with no mentor stays unassigned', async () => {
        const base = { studentIds: [new mongoose.Types.ObjectId()], tier: 'tier2', status: 'active', notes: 'mentor-gone-test', createdBy: new mongoose.Types.ObjectId(), focusAreas: ['math'] };
        const withMentor = await MentorAssignment.collection.insertOne({ ...base, mentorId: new mongoose.Types.ObjectId() });
        const without = await MentorAssignment.collection.insertOne({ ...base, mentorId: null });
        // What populate hands back when the person is not there: mentorId null.
        const populated = [{ _id: withMentor.insertedId, mentorId: null }, { _id: without.insertedId, mentorId: null }];

        const [gone, never] = await markMissingMentors(populated);

        expect(gone).toMatchObject({ mentorMissing: true, mentorName: MENTOR_MISSING_LABEL });
        expect(never.mentorMissing).toBeUndefined();
    });
});
