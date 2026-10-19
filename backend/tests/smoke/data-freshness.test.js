const mongoose = require('mongoose');
const { withoutOrphanedStudents } = require('../../src/controllers/mtssController');
const { runTracked } = require('../../src/utils/syncJobStatus');
const CentralSyncState = require('../../src/models/CentralSyncState');
const { syncIntervalMs } = require('../../src/jobs/centralSync');

describe('plans of students Central no longer lists', () => {
    const live = { _id: 'a', name: 'Live' };
    const gone = { _id: 'b', name: 'Gone', orphanedAt: new Date() };

    test('a plan whose students are all gone from Central is not shown', () => {
        expect(withoutOrphanedStudents([{ _id: 1, studentIds: [gone] }])).toEqual([]);
    });

    test('a plan keeps its students that are still in Central', () => {
        const [plan] = withoutOrphanedStudents([{ _id: 1, studentIds: [live, gone] }]);
        expect(plan.studentIds).toEqual([live]);
    });

    test('a plan with all its students in Central is untouched', () => {
        const plan = { _id: 1, studentIds: [live] };
        expect(withoutOrphanedStudents([plan])).toEqual([plan]);
    });
});

describe('every sync runs at the same pace', () => {
    test('one minute by default, never faster than 15 seconds, 0 turns it off', () => {
        expect(syncIntervalMs(undefined)).toBe(60000);
        expect(syncIntervalMs('5')).toBe(15000);
        expect(syncIntervalMs('0')).toBe(0);
    });
});

describe('job status', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI);
    });
    afterAll(async () => {
        await CentralSyncState.deleteOne({ _id: 'mtss' });
        await mongoose.disconnect();
    });

    test('a finished job is recorded as ok, a skipped one as not ok, a thrown one with its message', async () => {
        await runTracked('roster', async () => ({ skipped: false }));
        let state = await CentralSyncState.findById('mtss').lean();
        expect(state.jobs.roster.ok).toBe(true);

        await runTracked('classes', async () => ({ skipped: true }));
        state = await CentralSyncState.findById('mtss').lean();
        expect(state.jobs.classes.ok).toBe(false);
        expect(state.jobs.classes.error).toMatch(/could not be reached/);

        await expect(runTracked('support', async () => { throw new Error('boom'); })).rejects.toThrow('boom');
        state = await CentralSyncState.findById('mtss').lean();
        expect(state.jobs.support).toMatchObject({ ok: false, error: 'boom' });
    });
});
