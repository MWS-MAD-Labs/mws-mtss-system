const winston = require('winston');
const CentralSyncState = require('../models/CentralSyncState');
const { APP_ID } = require('./centralEntitlement');

// The student roster job reports here when it runs, so the status line can show how old that data is. A failure to
// write this never stops a job. (Access, profiles, classes taught and students supported are one pass in
// jobs/centralSync.js and report through the main sync state.)
const JOBS = Object.freeze({
    roster: 'roster',
});

// Only one server instance runs a job at a time. The lease is a document of its own, so it never blocks the main sync.
async function withLease(name, ttlMs, job) {
    const id = `${APP_ID}:${name}`;
    const now = new Date();
    const until = new Date(now.getTime() + ttlMs);
    const claimed = await CentralSyncState.findOneAndUpdate(
        { _id: id, $or: [{ lockedUntil: null }, { lockedUntil: { $lt: now } }, { lockedUntil: { $exists: false } }] },
        { $set: { lockedUntil: until } },
        { new: true },
    );
    if (!claimed) {
        if (await CentralSyncState.exists({ _id: id })) return { locked: true };
        try {
            await CentralSyncState.create({ _id: id, lockedUntil: until });
        } catch (error) {
            return { locked: true };
        }
    }
    try {
        return await job();
    } finally {
        await CentralSyncState.updateOne({ _id: id }, { $set: { lockedUntil: null } });
    }
}

async function recordJob(name, outcome) {
    try {
        await CentralSyncState.updateOne(
            { _id: APP_ID },
            { $set: { [`jobs.${name}`]: { at: new Date(), ...outcome } } },
            { upsert: true },
        );
    } catch (error) {
        winston.warn(`syncJobStatus: could not record ${name}: ${error.message}`);
    }
}

// Runs one job and writes what happened. Central being unreachable (the job skips) counts as not ok.
async function runTracked(name, job) {
    try {
        const result = await job();
        // Another instance has the lease: nothing ran here, so nothing is recorded.
        if (result?.locked) return result;
        await recordJob(name, { ok: !result?.skipped, skipped: Boolean(result?.skipped), error: result?.skipped ? 'Central could not be reached' : null });
        return result;
    } catch (error) {
        await recordJob(name, { ok: false, skipped: false, error: error.message });
        throw error;
    }
}

module.exports = { JOBS, recordJob, runTracked, withLease };
