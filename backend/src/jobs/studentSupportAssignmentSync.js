const winston = require('winston');
const User = require('../models/User');
const MTSSStudent = require('../models/MTSSStudent');
const { listStudentSupportAssignments } = require('../services/mwsDataCenterClient');

// Keeps User.supportedStudentIds in sync with Central's real
// StudentSupportAssignment data, so an SE teacher's "My Students" roster
// (mtssStudentController.js's applyViewerScope) is exactly who Central
// says they support - not a class or grade, since an SE teacher's
// relationship to a student is per-student, not per-classroom. Central is
// the source of truth here - this job always overwrites
// supportedStudentIds with whatever Central currently says, including
// clearing it back to [] for an SE teacher Central no longer shows any
// active assignment for.
//
// Same interval class as teacherClassAssignmentSync.js - a stale student
// list showing up a bit late is low-severity, not an access-control risk
// like the two deactivation jobs.
const DEFAULT_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

const sameIds = (a = [], b = []) => {
    if (a.length !== b.length) return false;
    const sortedA = a.map((id) => id.toString()).sort();
    const sortedB = b.map((id) => id.toString()).sort();
    return sortedA.every((value, index) => value === sortedB[index]);
};

async function syncStudentSupportAssignments() {
    let assignments;
    try {
        assignments = await listStudentSupportAssignments();
    } catch (error) {
        winston.warn(`studentSupportAssignmentSync: failed to fetch Central assignments, skipping this run: ${error.message}`);
        return { checked: 0, updated: 0, skipped: true };
    }

    const studentEmailsByEmployeeEmail = new Map();
    assignments.forEach((assignment) => {
        const employeeEmail = normalizeEmail(assignment.employee_email);
        const studentEmail = normalizeEmail(assignment.student_email);
        if (!employeeEmail || !studentEmail) return;
        if (!studentEmailsByEmployeeEmail.has(employeeEmail)) {
            studentEmailsByEmployeeEmail.set(employeeEmail, new Set());
        }
        studentEmailsByEmployeeEmail.get(employeeEmail).add(studentEmail);
    });

    // One lookup for every student email this run touches, instead of one
    // per SE teacher - Central's response is already the full active-
    // assignment list, so this covers every email we could possibly need.
    const allStudentEmails = Array.from(
        new Set(Array.from(studentEmailsByEmployeeEmail.values()).flatMap((set) => Array.from(set))),
    );
    const students = allStudentEmails.length
        ? await MTSSStudent.find({ email: { $in: allStudentEmails } }).select('_id email')
        : [];
    const studentIdByEmail = new Map(students.map((student) => [normalizeEmail(student.email), student._id]));

    const users = await User.find({ email: { $exists: true, $ne: '' } }).select('email supportedStudentIds');

    let updated = 0;
    for (const user of users) {
        const studentEmails = studentEmailsByEmployeeEmail.get(normalizeEmail(user.email));
        const nextIds = studentEmails
            ? Array.from(studentEmails)
                .map((email) => studentIdByEmail.get(email))
                .filter(Boolean)
            : [];

        if (sameIds(user.supportedStudentIds || [], nextIds)) continue;

        await User.findByIdAndUpdate(user._id, { supportedStudentIds: nextIds }, { runValidators: true });
        updated += 1;
        winston.info(`studentSupportAssignmentSync: updated ${user.email} - ${nextIds.length} student(s)`);
    }

    winston.info(`studentSupportAssignmentSync: checked ${users.length}, updated ${updated}`);
    return { checked: users.length, updated, skipped: false };
}

let intervalHandle = null;
let isRunning = false;

function start(intervalMs = DEFAULT_INTERVAL_MS) {
    if (intervalHandle) return;

    const tick = async () => {
        if (isRunning) return; // previous run still in progress - skip this tick
        isRunning = true;
        try {
            await syncStudentSupportAssignments();
        } catch (error) {
            winston.error('studentSupportAssignmentSync: run failed:', error);
        } finally {
            isRunning = false;
        }
    };

    intervalHandle = setInterval(tick, intervalMs);
    setTimeout(tick, 30 * 1000);
    winston.info(`studentSupportAssignmentSync: scheduled every ${Math.round(intervalMs / 60000)} minutes`);
}

function stop() {
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
    }
}

module.exports = { syncStudentSupportAssignments, start, stop };
