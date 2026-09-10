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
// Deliberately never touches identity fields (name/currentGrade/className)
// for a record Central no longer shows as enrolled - those stay frozen as
// the student's last real snapshot, since the record likely has real
// intervention history attached. status IS still kept in sync either way
// (see CENTRAL_TO_MTSS_STATUS below), so a graduated/withdrawn student
// correctly drops out of "All Students" via the existing Status filter
// instead of sitting there indefinitely under a stale 'active' default -
// studentDeactivationSync.js does the equivalent for the separate
// UserStudent (login) model, not this one.
//
// Still never touches a record with no Central match at all (manually
// added, or a data mismatch - needs a human, not a job).
const ENROLLED_STATUSES = new Set(['REGISTERED', 'ACTIVE']);
const ALL_STATUSES = ['REGISTERED', 'ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'WITHDRAWN', 'ARCHIVED'];

// MTSSStudent.status's enum is narrower than Central's - WITHDRAWN and
// ARCHIVED both collapse to 'inactive' since there's no closer match.
// REGISTERED means Central hasn't put them in a class yet, so they don't
// belong in the "active" caseload view either - 'pending' fits until they
// actually get enrolled into a class and Central promotes them to ACTIVE.
const CENTRAL_TO_MTSS_STATUS = {
    REGISTERED: 'pending',
    ACTIVE: 'active',
    GRADUATED: 'graduated',
    TRANSFERRED: 'transferred',
    WITHDRAWN: 'inactive',
    ARCHIVED: 'inactive',
    INACTIVE: 'inactive',
};

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
        const isEnrolled = ENROLLED_STATUSES.has(central.status);
        const targetStatus = CENTRAL_TO_MTSS_STATUS[central.status] || 'active';

        const existing = mtssByEmail.get(email);

        if (!existing) {
            if (!isEnrolled) continue; // no MTSS record and not currently enrolled - nothing to create
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
        if (existing.status !== targetStatus) {
            update.status = targetStatus;
        }

        // Identity fields only ever move for someone Central currently
        // shows as enrolled - see the header comment for why a graduated/
        // withdrawn record's className/currentGrade/name stay frozen.
        if (isEnrolled) {
            if (existing.currentGrade !== central.current_grade) {
                update.currentGrade = central.current_grade;
            }
            // Central is authoritative either way, including when it now says
            // "no class" - clearing className here, not just setting it, so a
            // student who was un-enrolled or moved off this room in Central
            // (a class reorganized, deleted, or re-rostered) stops showing up
            // in that room's MTSS view instead of the stale name lingering
            // forever. See exact-class-and-se-scope.test.js/
            // no-verified-assignment-deny-all.test.js for the same "empty from
            // Central means deny, not keep the old value" rule already applied
            // to classes[]/supportedStudentIds.
            const centralClassName = central.current_class || null;
            const existingClassName = existing.className || null;
            if (existingClassName !== centralClassName) {
                update.className = centralClassName;
            }
            if (existing.name !== central.full_name) {
                update.name = central.full_name;
            }
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
