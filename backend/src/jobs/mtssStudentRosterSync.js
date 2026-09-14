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
// (MTSSStudent.status stores Central's StudentStatus value as-is - see
// models/MTSSStudent.js), so a graduated/withdrawn student correctly drops
// out of "All Students" via the existing Status filter instead of sitting
// there indefinitely under a stale ACTIVE default - studentDeactivationSync.js
// does the equivalent for the separate UserStudent (login) model, not this one.
//
// Still never touches identity/status fields, and never deletes, a record
// with no Central match at all (manually added, or a data mismatch) - but
// it IS flagged via orphanedAt (models/MTSSStudent.js) so an admin can find
// and decide what to do with it, instead of it silently lingering forever
// on a teacher's live roster with no trace of why.
const ENROLLED_STATUSES = new Set(['REGISTERED', 'ACTIVE']);
const ALL_STATUSES = ['REGISTERED', 'ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'WITHDRAWN', 'ARCHIVED'];

// Longer than the 5-minute deactivation jobs - a new/updated roster row
// showing up a bit late is lower-severity than a revoked account staying
// active.
const DEFAULT_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

// Central is the single source of truth here - a genuinely empty response
// (every status fetch succeeds, none of them have anyone) is real data and
// must propagate everywhere else exactly like any other answer from
// Central would. What must NOT propagate is a guess: if any status fetch
// actually fails (network error, non-2xx, timeout), that failure is
// re-thrown as-is instead of being swallowed into an empty array - an
// empty array on error was indistinguishable from Central honestly saying
// "nobody", which meant a mid-fetch outage could get diffed as if Central
// had emptied out for real. The caller (syncStudentRoster) catches this
// and skips the whole run rather than act on a partial/unknown picture.
async function fetchCentralStudentsByStatus() {
    const byStatus = {};
    for (const status of ALL_STATUSES) {
        byStatus[status] = await listStudentsByStatus(status);
    }
    return byStatus;
}

async function syncStudentRoster() {
    let byStatus;
    try {
        byStatus = await fetchCentralStudentsByStatus();
    } catch (error) {
        winston.warn(`mtssStudentRosterSync: failed to fetch Central roster, skipping this run: ${error.message}`);
        return { created: 0, updated: 0, errors: 0, orphaned: 0, unorphaned: 0, skipped: true };
    }

    const centralByEmail = new Map();
    for (const status of ALL_STATUSES) {
        for (const student of byStatus[status]) {
            const email = normalizeEmail(student.email);
            if (email) centralByEmail.set(email, { ...student, status });
        }
    }

    // No "if centralByEmail.size === 0, skip" guard here on purpose - every
    // status fetch above already succeeded (a real failure would have
    // thrown and been caught above), so an empty result at this point is
    // Central genuinely reporting zero students, not a sign of an outage.
    // The loop below (and the orphan sweep after it) already does the
    // right thing with that: every existing MTSSStudent gets flagged as
    // orphaned, matching "not in Central means not here either."

    const mtssStudents = await MTSSStudent.find({}).select('name email gender currentGrade className status orphanedAt');
    const mtssByEmail = new Map();
    mtssStudents.forEach((doc) => {
        const email = normalizeEmail(doc.email);
        if (email) mtssByEmail.set(email, doc);
    });

    let created = 0;
    let updated = 0;
    let errors = 0;
    let orphaned = 0;
    let unorphaned = 0;

    for (const [email, central] of centralByEmail) {
        const isEnrolled = ENROLLED_STATUSES.has(central.status);
        // Direct pass-through - MTSSStudent.status stores Central's exact
        // StudentStatus value, no local narrowing table needed.
        const targetStatus = central.status;

        const existing = mtssByEmail.get(email);

        if (!existing) {
            if (!isEnrolled) continue; // no MTSS record and not currently enrolled - nothing to create
            try {
                await MTSSStudent.create({
                    name: central.full_name,
                    email,
                    gender: central.gender,
                    status: targetStatus,
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
        if (central.gender && existing.gender !== central.gender) {
            update.gender = central.gender;
        }
        // Found a match this run - clear a stale orphan flag, if any.
        if (existing.orphanedAt) {
            update.orphanedAt = null;
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
                if (update.orphanedAt === null) unorphaned += 1;
                winston.info(`mtssStudentRosterSync: updated ${email}: ${Object.keys(update).join(', ')}`);
            } catch (error) {
                errors += 1;
                winston.error(`mtssStudentRosterSync: failed to update ${email}: ${error.message}`);
            }
        }
    }

    // Anything in mtssByEmail never visited above has no Central match at
    // all under any status - flag it (if not already flagged) rather than
    // touching its data. Central being fully unreachable this run already
    // returned early above, so reaching here means Central genuinely
    // answered and genuinely doesn't know this email.
    for (const [email, doc] of mtssByEmail) {
        if (centralByEmail.has(email)) continue;
        if (doc.orphanedAt) continue;
        try {
            await MTSSStudent.findByIdAndUpdate(doc._id, { orphanedAt: new Date() });
            orphaned += 1;
            winston.info(`mtssStudentRosterSync: flagged ${email} as orphaned (no Central match)`);
        } catch (error) {
            errors += 1;
            winston.error(`mtssStudentRosterSync: failed to flag ${email} as orphaned: ${error.message}`);
        }
    }

    winston.info(`mtssStudentRosterSync: checked ${centralByEmail.size}, created ${created}, updated ${updated}, ${orphaned} newly orphaned, ${unorphaned} un-orphaned, ${errors} error(s)`);
    return { created, updated, errors, orphaned, unorphaned, skipped: false };
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
