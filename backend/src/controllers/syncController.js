const winston = require('winston');
const SyncStatus = require('../models/SyncStatus');
const { syncStudentRoster } = require('../jobs/mtssStudentRosterSync');
const { syncTeacherClassAssignments } = require('../jobs/teacherClassAssignmentSync');
const { syncStudentSupportAssignments } = require('../jobs/studentSupportAssignmentSync');
const { deactivateMissingEmployees } = require('../jobs/employeeDeactivationSync');
const { deactivateMissingStudents } = require('../jobs/studentDeactivationSync');
const { sendSuccess, sendError } = require('../utils/response');

const DOC_ID = 'manual-sync';
// Short cooldown outside production so the button is actually testable
// without a 5-minute wait between clicks.
const COOLDOWN_MS = process.env.NODE_ENV === 'production' ? 5 * 60 * 1000 : 30 * 1000;

const cooldownRemainingSeconds = (doc) => {
    if (!doc || !doc.lastTriggeredAt) return 0;
    const remainingMs = COOLDOWN_MS - (Date.now() - doc.lastTriggeredAt.getTime());
    return Math.max(0, Math.ceil(remainingMs / 1000));
};

const toStatusPayload = (doc) => ({
    isRunning: Boolean(doc?.isRunning),
    lastTriggeredAt: doc?.lastTriggeredAt || null,
    lastTriggeredBy: doc?.lastTriggeredBy || null,
    lastResult: doc?.lastResult || null,
    cooldownRemainingSeconds: cooldownRemainingSeconds(doc)
});

// Runs every sync/deactivation job this app owns, exactly the same
// functions the scheduled intervals call - no behavioral drift between
// "waited for it" and "clicked the button". None of these jobs throw on a
// Central fetch failure (each catches internally and resolves with
// skipped: true), so this never needs to treat a settled promise as a
// partial failure.
async function runAllSyncJobs() {
    const [student, teacherClasses, studentSupport, employeeDeactivation, studentDeactivation] = await Promise.allSettled([
        syncStudentRoster(),
        syncTeacherClassAssignments(),
        syncStudentSupportAssignments(),
        deactivateMissingEmployees(),
        deactivateMissingStudents()
    ]);

    const settle = (result) => (result.status === 'fulfilled'
        ? result.value
        : { skipped: true, error: result.reason?.message || 'unknown error' });

    return {
        studentRoster: settle(student),
        teacherClassAssignments: settle(teacherClasses),
        studentSupportAssignments: settle(studentSupport),
        employeeDeactivation: settle(employeeDeactivation),
        studentDeactivation: settle(studentDeactivation)
    };
}

const getSyncStatus = async (req, res) => {
    const doc = await SyncStatus.findById(DOC_ID);
    return sendSuccess(res, 'Sync status retrieved', toStatusPayload(doc));
};

const triggerSync = async (req, res) => {
    const now = new Date();
    const cooldownCutoff = new Date(now.getTime() - COOLDOWN_MS);

    // Ensure the singleton document exists first, separately from the
    // conditional claim below - combining upsert:true with a filter that an
    // *existing* document can fail (still cooling down / already running)
    // makes Mongo try to insert a second document with the same _id and
    // throw a duplicate-key error instead of just reporting "no match".
    try {
        await SyncStatus.create({ _id: DOC_ID });
    } catch (error) {
        if (error.code !== 11000) throw error; // already exists - fine
    }

    // Atomic claim: only succeeds if no run is in progress and the last
    // trigger (if any) is older than the cooldown window. Any number of
    // concurrent clicks from any number of users collapse into at most one
    // real run per window - everyone else just sees this run's result.
    const claimed = await SyncStatus.findOneAndUpdate(
        {
            _id: DOC_ID,
            isRunning: { $ne: true },
            $or: [
                { lastTriggeredAt: { $exists: false } },
                { lastTriggeredAt: { $lte: cooldownCutoff } }
            ]
        },
        {
            $set: {
                isRunning: true,
                lastTriggeredAt: now,
                lastTriggeredBy: req.user?.email || 'unknown'
            }
        },
        { new: true }
    );

    if (!claimed) {
        const current = await SyncStatus.findById(DOC_ID);
        return sendError(res, 'A sync already ran recently. Please wait for the cooldown to finish.', 429, toStatusPayload(current));
    }

    try {
        const result = await runAllSyncJobs();
        winston.info(`manual sync triggered by ${claimed.lastTriggeredBy}: ${JSON.stringify(result)}`);

        const updated = await SyncStatus.findByIdAndUpdate(
            DOC_ID,
            { $set: { isRunning: false, lastResult: result } },
            { new: true }
        );

        return sendSuccess(res, 'Sync completed', toStatusPayload(updated));
    } catch (error) {
        winston.error('manual sync run failed unexpectedly:', error);
        await SyncStatus.findByIdAndUpdate(DOC_ID, { $set: { isRunning: false } });
        return sendError(res, 'Sync failed to complete', 500);
    }
};

module.exports = { getSyncStatus, triggerSync };
