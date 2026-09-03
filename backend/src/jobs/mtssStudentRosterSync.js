const winston = require('winston');
const MTSSStudent = require('../models/MTSSStudent');
const { listStudentsByStatus } = require('../services/mwsDataCenterClient');

// Scheduled version of scripts/applyCentralStudentSync.js - creates/updates
// MTSSStudent records from Central's roster on an interval, so "Crew
// Roster" doesn't stay empty until someone remembers to run that script by
// hand. Mirrors employeeDeactivationSync.js/studentDeactivationSync.js's
// job shape (this file intentionally duplicates the fetch/diff logic
// rather than sharing it with the manual script, same as
// dryRunCentralStudentSync.js and applyCentralStudentSync.js already do
// with each other).
//
// Deliberately never touches:
//   - a record Central no longer shows as enrolled (likely has real
//     intervention history - that's studentDeactivationSync.js's job to
//     flip isActive on the login side, not this job's to alter here)
//   - a record with no Central match at all (manually added, or a data
//     mismatch - needs a human, not a job)
const ENROLLED_STATUSES = new Set(['REGISTERED', 'ACTIVE']);
const ALL_STATUSES = ['REGISTERED', 'ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'WITHDRAWN', 'ARCHIVED'];

// Longer than the 5-minute deactivation jobs - a new/updated roster row
// showing up a bit late is lower-severity than a revoked account staying
// active.
const DEFAULT_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

async function fetchCentralStudentsByStatus() {
    const byStatus = {};
    for (const status of ALL_STATUSES) {
        try {
            byStatus[status] = await listStudentsByStatus(status);
        } catch (error) {
            winston.warn(`mtssStudentRosterSync: failed to fetch Central students with status=${status}: ${error.message}`);
            byStatus[status] = [];
        }
    }
    return byStatus;
}

async function syncStudentRoster() {
    const byStatus = await fetchCentralStudentsByStatus();
    const centralByEmail = new Map();
    for (const status of ALL_STATUSES) {
        for (const student of byStatus[status]) {
            const email = normalizeEmail(student.email);
            if (email) centralByEmail.set(email, { ...student, status });
        }
    }

    if (centralByEmail.size === 0) {
        winston.warn('mtssStudentRosterSync: Central returned no students at all, skipping this run');
        return { created: 0, updated: 0, errors: 0, skipped: true };
    }

    const mtssStudents = await MTSSStudent.find({}).select('name email currentGrade className status');
    const mtssByEmail = new Map();
    mtssStudents.forEach((doc) => {
        const email = normalizeEmail(doc.email);
        if (email) mtssByEmail.set(email, doc);
    });

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const [email, central] of centralByEmail) {
        if (!ENROLLED_STATUSES.has(central.status)) continue; // out of scope - see header

        const existing = mtssByEmail.get(email);

        if (!existing) {
            try {
                await MTSSStudent.create({
                    name: central.full_name,
                    email,
                    currentGrade: central.current_grade || undefined,
                    className: central.current_class || undefined,
                });
                created += 1;
                winston.info(`mtssStudentRosterSync: created ${email} (${central.full_name})`);
            } catch (error) {
                errors += 1;
                winston.error(`mtssStudentRosterSync: failed to create ${email}: ${error.message}`);
            }
            continue;
        }

        const update = {};
        if (existing.currentGrade !== central.current_grade) {
            update.currentGrade = central.current_grade;
        }
        // Only apply a class when Central actually has one - most students
        // aren't enrolled into a class there yet, and MTSS's own className
        // stays authoritative until it does.
        if (central.current_class && existing.className !== central.current_class) {
            update.className = central.current_class;
        }
        if (existing.name !== central.full_name) {
            update.name = central.full_name;
        }

        if (Object.keys(update).length) {
            try {
                await MTSSStudent.findByIdAndUpdate(existing._id, update, { runValidators: true });
                updated += 1;
                winston.info(`mtssStudentRosterSync: updated ${email}: ${Object.keys(update).join(', ')}`);
            } catch (error) {
                errors += 1;
                winston.error(`mtssStudentRosterSync: failed to update ${email}: ${error.message}`);
            }
        }
    }

    winston.info(`mtssStudentRosterSync: checked ${centralByEmail.size}, created ${created}, updated ${updated}, ${errors} error(s)`);
    return { created, updated, errors, skipped: false };
}

let intervalHandle = null;
let isRunning = false;

function start(intervalMs = DEFAULT_INTERVAL_MS) {
    if (intervalHandle) return;

    const tick = async () => {
        if (isRunning) return; // previous run still in progress - skip this tick
        isRunning = true;
        try {
            await syncStudentRoster();
        } catch (error) {
            winston.error('mtssStudentRosterSync: run failed:', error);
        } finally {
            isRunning = false;
        }
    };

    intervalHandle = setInterval(tick, intervalMs);
    // Also run shortly after startup, so a roster change that happened
    // while the server was down gets caught without waiting a full
    // interval.
    setTimeout(tick, 30 * 1000);
    winston.info(`mtssStudentRosterSync: scheduled every ${Math.round(intervalMs / 60000)} minutes`);
}

function stop() {
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
    }
}

module.exports = { syncStudentRoster, start, stop };
