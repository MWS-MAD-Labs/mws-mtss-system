const winston = require('winston');
const CentralSyncState = require('../models/CentralSyncState');
const { APP_ID } = require('./centralEntitlement');

// The follow-up jobs (student roster, classes taught, students supported) each report here when they run, so the
// status line can show how old each kind of data is. A failure to write this never stops a job.
const JOBS = Object.freeze({
    roster: 'roster',
    classes: 'classes',
    support: 'support',
});

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
        await recordJob(name, { ok: !result?.skipped, skipped: Boolean(result?.skipped), error: result?.skipped ? 'Central could not be reached' : null });
        return result;
    } catch (error) {
        await recordJob(name, { ok: false, skipped: false, error: error.message });
        throw error;
    }
}

module.exports = { JOBS, recordJob, runTracked };
