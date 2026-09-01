const winston = require('winston');
const UserStudent = require('../models/UserStudent');
const { listStudentsByStatus } = require('../services/mwsDataCenterClient');

// Same gap as employeeDeactivationSync.js, for students: a withdrawn/
// graduated/transferred student's MTSS session (a self-contained 7-day JWT)
// is otherwise never re-checked against Central after login - only a fresh
// SSO login re-syncs isActive. This job mirrors Central's enrolled roster on
// an interval so a status change there ends MTSS access within minutes
// instead of up to 7 days.
//
// REGISTERED and ACTIVE are both treated as "still enrolled" - see
// dryRunCentralStudentSync.js for why Central has no single status that
// means that unambiguously. Everything else (GRADUATED, TRANSFERRED,
// WITHDRAWN, ARCHIVED, INACTIVE) means deactivate.
const ENROLLED_STATUSES = ['REGISTERED', 'ACTIVE'];

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

async function fetchEnrolledEmails() {
    const emails = new Set();
    for (const status of ENROLLED_STATUSES) {
        const students = await listStudentsByStatus(status);
        students.forEach((student) => {
            const email = normalizeEmail(student.email);
            if (email) emails.add(email);
        });
    }
    return emails;
}

async function deactivateMissingStudents() {
    let enrolledEmails;
    try {
        enrolledEmails = await fetchEnrolledEmails();
    } catch (error) {
        winston.warn(`studentDeactivationSync: failed to fetch enrolled roster, skipping this run: ${error.message}`);
        return { checked: 0, deactivated: 0, skipped: true };
    }

    const candidates = await UserStudent.find({ isActive: true });

    let deactivated = 0;
    for (const student of candidates) {
        if (enrolledEmails.has(normalizeEmail(student.email))) continue;

        student.isActive = false;
        await student.save();
        deactivated += 1;
        winston.info(`studentDeactivationSync: deactivated ${student.email} (no longer enrolled in Central)`);
    }

    winston.info(`studentDeactivationSync: checked ${candidates.length}, deactivated ${deactivated}`);
    return { checked: candidates.length, deactivated, skipped: false };
}

let intervalHandle = null;
let isRunning = false;

function start(intervalMs = DEFAULT_INTERVAL_MS) {
    if (intervalHandle) return;

    const tick = async () => {
        if (isRunning) return; // previous run still in progress - skip this tick
        isRunning = true;
        try {
            await deactivateMissingStudents();
        } catch (error) {
            winston.error('studentDeactivationSync: run failed:', error);
        } finally {
            isRunning = false;
        }
    };

    intervalHandle = setInterval(tick, intervalMs);
    setTimeout(tick, 30 * 1000);
    winston.info(`studentDeactivationSync: scheduled every ${Math.round(intervalMs / 60000)} minutes`);
}

function stop() {
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
    }
}

module.exports = { deactivateMissingStudents, start, stop };
