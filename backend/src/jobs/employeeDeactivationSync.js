const winston = require('winston');
const User = require('../models/User');
const { listActiveEmployees } = require('../services/mwsDataCenterClient');
const { deriveMtssRoleFromCentralTags } = require('../utils/jobLevelRoleMapping');

// A deactivated/terminated employee's MTSS session (a self-contained 7-day
// JWT) is otherwise never re-checked against Central after login - only a
// fresh SSO login re-syncs isActive. This job is the safety net: it mirrors
// Central's active roster on an interval so someone deactivated there loses
// MTSS access within minutes instead of up to 7 days. Mirrors the same job
// in mws-daily-checkin (jobs/employeeRosterSync.js).
//
// isActive is the only field actually WRITTEN here - it's the one field
// where staleness is a real access-control risk that this job can safely
// resolve on its own. role is additionally DRY-RUN checked (logged, never
// applied) below - see reconstructTagsFromEmployee() for why applying it
// isn't safe.
//
// Never auto-reactivates and never touches admin/superadmin - same
// exclusion as employeeRosterSync.js, so a Central API hiccup or a missing
// employee record can't lock out an admin. superadmin is additionally
// protected by ssoUserResolution.js's own guard, but excluding both here
// means this job never even attempts to touch them.
const EXEMPT_ROLES = ['admin', 'superadmin'];

// Mirrors mws-hub's normalizeAccessToken (apps-service.ts) so the
// reconstructed tags below match what Hub would actually relay at login,
// for the job_level/job_position-derived part of it.
const normalizeAccessToken = (value = '') => String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9:]+/g, '-')
    .replace(/^-+|-+$/g, '');

// DRY-RUN ONLY. Reconstructs the subset of Hub's relayed tags that's a pure
// function of Central's own employee fields: the baseline "employee" tag
// Hub always attaches for user.source === "employee", plus
// job_level/job_position/unit each as a single whole-string tag (Hub adds
// these with splitTokens: false - see mws-hub's getUserAccessTags).
// Deliberately does NOT and cannot reconstruct tags coming from a Hub-side
// manual permission grant (user.role/roles/permissions in Hub's own model)
// - Central's employee API never exposes those, so a role derived from
// these tags alone is only trustworthy for the "does job_level/job_position
// support this" question, never a "does this account have some extra Hub
// grant" one - applying it for real could silently strip a Hub-granted role
// every 5 minutes.
function reconstructTagsFromEmployee(employee) {
    // deriveMtssRoleFromCentralTags expects an array (Array.isArray gate),
    // not a Set - a Set here would silently look empty to it and every
    // derived role would come back null.
    return ['employee', employee.job_level, employee.job_position, employee.unit, employee.employment_type]
        .map(normalizeAccessToken)
        .filter(Boolean);
}

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

async function deactivateMissingEmployees() {
    let activeRoster;
    try {
        activeRoster = await listActiveEmployees();
    } catch (error) {
        winston.warn(`employeeDeactivationSync: failed to fetch active roster, skipping this run: ${error.message}`);
        return { checked: 0, deactivated: 0, skipped: true };
    }

    const rosterByEmail = new Map(activeRoster.map((employee) => [normalizeEmail(employee.email), employee]));

    const candidates = await User.find({
        employeeId: { $exists: true, $ne: '' },
        isActive: true,
        role: { $nin: EXEMPT_ROLES },
    });

    let deactivated = 0;
    let roleDriftDetected = 0;
    for (const user of candidates) {
        const employee = rosterByEmail.get(normalizeEmail(user.email));

        if (!employee) {
            user.isActive = false;
            try {
                // validateModifiedOnly - some documents carry legacy values
                // in fields this job never touches (e.g. an employmentStatus
                // written before its enum was tightened); a full-document
                // validate() on save would reject the isActive change too
                // and, with no per-record guard, abort every remaining
                // candidate in this run.
                await user.save({ validateModifiedOnly: true });
                deactivated += 1;
                winston.info(`employeeDeactivationSync: deactivated ${user.email} (no longer active in Central)`);
            } catch (error) {
                winston.error(`employeeDeactivationSync: failed to deactivate ${user.email}: ${error.message}`);
            }
            continue;
        }

        // DRY-RUN role-drift check: log (never apply) whenever the derived
        // role disagrees with what's stored, so a real Central-driven
        // access change (e.g. someone demoted off Head Unit) is visible
        // within minutes instead of only at next login - without risking a
        // false downgrade for someone whose role includes a Hub-side grant
        // this job can't see.
        const reconstructedTags = reconstructTagsFromEmployee(employee);
        const derivedRole = deriveMtssRoleFromCentralTags(reconstructedTags, employee.job_level, employee.is_teaching_role);
        if (derivedRole && derivedRole !== user.role) {
            roleDriftDetected += 1;
            winston.warn(`employeeDeactivationSync: role drift (dry-run, not applied) - ${user.email} stored='${user.role}' derived='${derivedRole}' (job_level='${employee.job_level}', is_teaching_role=${employee.is_teaching_role})`);
        }
    }

    winston.info(`employeeDeactivationSync: checked ${candidates.length}, deactivated ${deactivated}, roleDriftDetected ${roleDriftDetected}`);
    return { checked: candidates.length, deactivated, roleDriftDetected, skipped: false };
}

let intervalHandle = null;
let isRunning = false;

function start(intervalMs = DEFAULT_INTERVAL_MS) {
    if (intervalHandle) return;

    const tick = async () => {
        if (isRunning) return; // previous run still in progress - skip this tick
        isRunning = true;
        try {
            await deactivateMissingEmployees();
        } catch (error) {
            winston.error('employeeDeactivationSync: run failed:', error);
        } finally {
            isRunning = false;
        }
    };

    intervalHandle = setInterval(tick, intervalMs);
    // Also run shortly after startup, so a deactivation that happened while
    // the server was down gets caught without waiting a full interval.
    setTimeout(tick, 30 * 1000);
    winston.info(`employeeDeactivationSync: scheduled every ${Math.round(intervalMs / 60000)} minutes`);
}

function stop() {
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
    }
}

module.exports = { deactivateMissingEmployees, start, stop };
