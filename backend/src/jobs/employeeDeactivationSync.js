const winston = require('winston');
const User = require('../models/User');
const { listActiveEmployees } = require('../services/mwsDataCenterClient');

// A deactivated/terminated employee's MTSS session (a self-contained 7-day
// JWT) is otherwise never re-checked against Central after login - only a
// fresh SSO login re-syncs isActive. This job is the safety net: it mirrors
// Central's active roster on an interval so someone deactivated there loses
// MTSS access within minutes instead of up to 7 days. Mirrors the same job
// in mws-daily-checkin (jobs/employeeRosterSync.js).
//
// Scope is deliberately narrow - isActive only, never role. Role drift is
// lower-severity and self-corrects on the next real login (see
// jobLevelRoleMapping.js); isActive is the one field where staleness is a
// real access-control risk, so it's the one field this job touches.
//
// Never auto-reactivates and never touches admin/superadmin - same
// exclusion as employeeRosterSync.js, so a Central API hiccup or a missing
// employee record can't lock out an admin. superadmin is additionally
// protected by ssoUserResolution.js's own guard, but excluding both here
// means this job never even attempts to touch them.
const EXEMPT_ROLES = ['admin', 'superadmin'];

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

    const activeEmails = new Set(activeRoster.map((employee) => normalizeEmail(employee.email)));

    const candidates = await User.find({
        employeeId: { $exists: true, $ne: '' },
        isActive: true,
        role: { $nin: EXEMPT_ROLES },
    });

    let deactivated = 0;
    for (const user of candidates) {
        if (activeEmails.has(normalizeEmail(user.email))) continue;

        user.isActive = false;
        await user.save();
        deactivated += 1;
        winston.info(`employeeDeactivationSync: deactivated ${user.email} (no longer active in Central)`);
    }

    winston.info(`employeeDeactivationSync: checked ${candidates.length}, deactivated ${deactivated}`);
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
