const winston = require('winston');
const Person = require('../models/Person');
const CentralSyncState = require('../models/CentralSyncState');
const central = require('../services/mwsDataCenterClient');
const { PERSON_TYPE, CENTRAL_STATUS } = require('../constants/person');
const { APP_ID, validateEntitlement, expectedOrganizationId, entitlementProjection, projectionChanged } = require('../utils/centralEntitlement');
const { mapCentralEmployee } = require('../utils/employeeCentralSync');
const MTSSStudent = require('../models/MTSSStudent');
const { mapCentralStudent } = require('../utils/studentCentralSync');
const { normalizeEmail } = require('../utils/studentUserHelpers');

// Keeps the people of this app in line with Central, by itself, inside the server. Each tick is one small
// question (the key); the full list of who may use the app is read only when the key moved. What Central keeps
// about a person that is not part of the key (unit, job, grade, class, who teaches what, which students a special
// education teacher supports) is read in bulk every minute too. Whatever Central stops listing keeps its history and
// loses access.
const MIN_SECONDS = 15;
const DEFAULT_SECONDS = 60;
const PROFILE_EVERY_MS = 60 * 1000;
// A tick can land a moment early; this keeps the profiles from slipping to every second tick.
const PROFILE_SLACK_MS = 5 * 1000;

const CLASS_ROLE_LABELS = {
    HOMEROOM: 'Homeroom Teacher',
    SUPPORTING_HOMEROOM: 'Homeroom Teacher',
    SUBJECT_TEACHER: 'Subject Teacher',
};
const LEASE_MS = 3 * 60 * 1000;
const FIRST_RUN_MS = 5 * 1000;
const ENROLLED_STUDENT_STATUSES = ['REGISTERED', 'ACTIVE'];

// What went wrong, in words the status line can show. A 403 from Central names the scope the token lacks.
function describeFailure(error) {
    if (error?.response?.status === 403) {
        const body = error.response?.data || {};
        const text = [body.message, typeof body.errors === 'string' ? body.errors : JSON.stringify(body.errors || '')].join(' ');
        const scope = /scope '([^']+)'/.exec(text)?.[1];
        return scope ? `MTSS's API token is missing the scope ${scope}` : "Central refused a request from MTSS's API token";
    }
    return error?.message || 'Unknown error';
}

// 0 turns it off. Anything unusable falls back to the default, and nothing runs faster than 15 seconds.
function syncIntervalMs(raw) {
    if (raw === undefined || String(raw).trim() === '') return DEFAULT_SECONDS * 1000;
    const seconds = Number(raw);
    if (!Number.isFinite(seconds) || seconds < 0) return DEFAULT_SECONDS * 1000;
    if (seconds === 0) return 0;
    return Math.max(seconds, MIN_SECONDS) * 1000;
}

// Who Central says may use the app, brought into the people collection.
async function syncAccess(api = central) {
    const { rows, key } = await api.listApplicationEntitlements(APP_ID);
    const organizationId = expectedOrganizationId();
    const people = await Person.find({});
    const byPersonId = new Map(people.filter((p) => p.centralPersonId).map((p) => [p.centralPersonId, p]));
    const summary = { created: 0, updated: 0, revoked: 0, unchanged: 0, unmapped: 0, invalid: 0 };
    const warnings = new Set();
    const seen = new Set();

    for (const row of rows) {
        let entitlement;
        try {
            entitlement = validateEntitlement({
                id: row.id,
                application_id: APP_ID,
                organization_id: row.organization_id,
                role: row.role,
                permissions: row.permissions,
                version: row.version,
            }, organizationId);
        } catch (error) {
            summary.invalid += 1;
            continue;
        }
        seen.add(row.person_id);

        const projection = entitlementProjection(entitlement);
        const person = byPersonId.get(row.person_id);
        if (person) {
            const changed = projectionChanged(person, projection) || person.centralStatus !== CENTRAL_STATUS.ACTIVE;
            if (!changed) {
                summary.unchanged += 1;
                continue;
            }
            Object.assign(person, projection, { centralStatus: CENTRAL_STATUS.ACTIVE });
            await person.save();
            summary.updated += 1;
            continue;
        }

        // Somebody new: ask Central once what kind of person they are and what it keeps about them.
        const created = await buildNewPerson(api, row, projection, warnings);
        if (!created) {
            summary.unmapped += 1;
            continue;
        }
        const email = normalizeEmail(row.person?.email);
        const sameEmail = email ? await Person.findOne({ email }) : null;
        if (sameEmail) {
            summary.invalid += 1;
            continue;
        }
        await Person.create(created);
        summary.created += 1;
    }

    for (const person of people) {
        if (!person.centralPersonId || seen.has(person.centralPersonId)) continue;
        if (person.centralStatus === CENTRAL_STATUS.NO_ACCESS && !(person.centralEntitlementPermissions || []).length) continue;
        person.centralStatus = CENTRAL_STATUS.NO_ACCESS;
        person.centralEntitlementPermissions = [];
        await person.save();
        summary.revoked += 1;
    }

    return { summary, key, warnings: [...warnings] };
}

async function buildNewPerson(api, row, projection, warnings) {
    const email = normalizeEmail(row.person?.email);
    if (!email) return null;
    let fields = null;
    let personType = null;

    // One lookup that Central refuses must not stop the rest, so a failure leaves this person out and says why.
    const attempt = async (lookup) => {
        try {
            return await lookup();
        } catch (error) {
            warnings.add(describeFailure(error));
            return null;
        }
    };
    const employee = await attempt(() => api.lookupEmployeeByPersonId(row.person_id));
    if (employee) {
        personType = PERSON_TYPE.EMPLOYEE;
        fields = mapCentralEmployee(employee);
    } else {
        const student = await attempt(() => api.lookupStudentByEmail(email));
        if (student) {
            personType = PERSON_TYPE.STUDENT;
            fields = mapCentralStudent(student);
        }
    }
    if (!fields) return null;

    return {
        ...fields,
        email,
        name: fields.name || row.person.full_name,
        centralPersonId: row.person_id,
        personType,
        isActive: true,
        centralStatus: CENTRAL_STATUS.ACTIVE,
        username: email.split('@')[0],
        ...projection,
    };
}

const sameClasses = (a = [], b = []) => {
    if (a.length !== b.length) return false;
    const key = (entry) => `${entry.grade || ''}|${entry.className || ''}|${entry.subject || ''}|${entry.role || ''}`;
    const left = a.map(key).sort();
    const right = b.map(key).sort();
    return left.every((value, index) => value === right[index]);
};

const sameIds = (a = [], b = []) => {
    if (a.length !== b.length) return false;
    const left = a.map((id) => id.toString()).sort();
    const right = b.map((id) => id.toString()).sort();
    return left.every((value, index) => value === right[index]);
};

// Who teaches what, by the teacher's Central person id, and by email for an answer that has no person id. The person
// id is what finds a teacher whose email changed in Central.
function classesByTeacher(assignments) {
    const byPersonId = new Map();
    const byEmail = new Map();
    const add = (map, key, entries) => {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(...entries);
    };
    for (const assignment of assignments) {
        const personId = assignment.workforce_member?.person_id || null;
        const email = normalizeEmail(assignment.employee_email || assignment.workforce_member?.email);
        // A mixed-age room holds students of more than one grade: one entry per grade the class teaches.
        const grades = [assignment.grade_name, ...(assignment.additional_grade_names || [])].filter(Boolean);
        const entries = grades.map((grade) => ({
            grade,
            className: assignment.class_name || undefined,
            subject: assignment.subject || undefined,
            role: CLASS_ROLE_LABELS[assignment.role] || undefined,
        }));
        if (personId) add(byPersonId, personId, entries);
        else if (email) add(byEmail, email, entries);
    }
    return { byPersonId, byEmail };
}

// The students each special education teacher supports, as MTSS student ids, by the teacher's Central person id (by
// email for an answer without one). The students are found by their email in Central now, which the roster sync keeps
// on the MTSS record.
async function supportedIdsByTeacher(assignments) {
    const studentEmailsByKey = { byPersonId: new Map(), byEmail: new Map() };
    for (const assignment of assignments) {
        const personId = assignment.workforce_member?.person_id || null;
        const employeeEmail = normalizeEmail(assignment.employee_email || assignment.workforce_member?.email);
        const studentEmail = normalizeEmail(assignment.student_email);
        if (!studentEmail || (!personId && !employeeEmail)) continue;
        const map = personId ? studentEmailsByKey.byPersonId : studentEmailsByKey.byEmail;
        const key = personId || employeeEmail;
        if (!map.has(key)) map.set(key, new Set());
        map.get(key).add(studentEmail);
    }
    const allStudentEmails = [...new Set([...studentEmailsByKey.byPersonId.values(), ...studentEmailsByKey.byEmail.values()].flatMap((set) => [...set]))];
    const students = allStudentEmails.length ? await MTSSStudent.find({ email: { $in: allStudentEmails } }).select('_id email') : [];
    const idByEmail = new Map(students.map((student) => [normalizeEmail(student.email), student._id]));
    const resolve = (map) => {
        const result = new Map();
        for (const [key, emails] of map) result.set(key, [...emails].map((email) => idByEmail.get(email)).filter(Boolean));
        return result;
    };
    return { byPersonId: resolve(studentEmailsByKey.byPersonId), byEmail: resolve(studentEmailsByKey.byEmail) };
}

const differs = (person, fields) => Object.entries(fields).some(([key, value]) => value !== undefined && String(person[key] ?? '') !== String(value ?? ''));

// What Central keeps about each person outside the key: unit, job, grade, class, and whether they are still
// active there. Each list is read on its own. A list that cannot be read in full is skipped and never used to
// deactivate anyone, and the other carries on.
async function syncProfiles(api = central) {
    const summary = { updated: 0, deactivated: 0, reactivated: 0, emailsChanged: 0, emailsHeld: 0, skipped: false, warnings: [] };
    const warnings = new Set();
    const read = async (label, load) => {
        try {
            return await load();
        } catch (error) {
            warnings.add(`${label} skipped: ${describeFailure(error)}`);
            return null;
        }
    };

    const employees = await read('Employees', () => api.listActiveEmployees());
    const students = await read('Students', async () => {
        const byEmail = new Map();
        const byPersonId = new Map();
        for (const status of ENROLLED_STUDENT_STATUSES) {
            for (const student of await api.listStudentsByStatus(status)) {
                const email = normalizeEmail(student.email);
                if (email) byEmail.set(email, student);
                if (student.person_id) byPersonId.set(student.person_id, student);
            }
        }
        return { byEmail, byPersonId };
    });
    const classAssignments = await read('Class assignments', () => api.listClassTeacherAssignments());
    const supportAssignments = await read('Student support assignments', () => api.listStudentSupportAssignments());
    summary.warnings = [...warnings];
    if (!employees && !students && !classAssignments && !supportAssignments) return { ...summary, skipped: true };

    const teachingClasses = classAssignments ? classesByTeacher(classAssignments) : null;
    const supportedStudents = supportAssignments ? await supportedIdsByTeacher(supportAssignments) : null;

    const employeesByPersonId = employees ? new Map(employees.map((e) => [e.person_id, e])) : null;
    const people = await Person.find({ personType: { $exists: true } });
    // Who holds each email now, so a person is not given an email that is another person's.
    const holderOf = new Map(people.map((person) => [normalizeEmail(person.email), String(person._id)]));

    for (const person of people) {
        let next = null;
        // The email Central has for this person now. Looked up by person id, so it is found after a change of email.
        let centralEmail = null;
        if (person.personType === PERSON_TYPE.EMPLOYEE && employeesByPersonId) {
            const employee = employeesByPersonId.get(person.centralPersonId);
            if (!employee) {
                next = { isActive: false };
            } else {
                centralEmail = normalizeEmail(employee.email);
                const { name, gender, employeeId, jobPosition, jobLevel, isTeachingRole, employmentStatus, department, unit } = mapCentralEmployee(employee);
                next = { name, gender, employeeId, jobPosition, jobLevel, isTeachingRole, employmentStatus, department, unit, isActive: true };
            }
        } else if (person.personType === PERSON_TYPE.STUDENT && students) {
            const student = (person.centralPersonId && students.byPersonId.get(person.centralPersonId)) || students.byEmail.get(normalizeEmail(person.email));
            if (!student) {
                next = { isActive: false };
            } else {
                centralEmail = normalizeEmail(student.email);
                const { name, nickname, gender, status, currentGrade, className, unit, department } = mapCentralStudent(student);
                next = { name, nickname, gender, status, currentGrade, className, unit, department, isActive: true };
            }
        }

        // Who teaches which class, and which students a special education teacher supports. A list that could not be
        // read leaves what is stored as it is.
        const isEmployee = person.personType === PERSON_TYPE.EMPLOYEE;

        // The email follows Central, unless another person already has it (then somebody has to look).
        if (centralEmail && centralEmail !== normalizeEmail(person.email)) {
            const holder = holderOf.get(centralEmail);
            if (holder && holder !== String(person._id)) {
                summary.emailsHeld += 1;
                warnings.add(`${centralEmail} already belongs to another person here, the old email of ${person.centralPersonId} was kept`);
            } else {
                holderOf.delete(normalizeEmail(person.email));
                holderOf.set(centralEmail, String(person._id));
                next = { ...(next || {}), email: centralEmail };
                summary.emailsChanged += 1;
            }
        }

        const email = centralEmail || normalizeEmail(person.email);
        const pick = (lists) => lists.byPersonId.get(person.centralPersonId) || lists.byEmail.get(email) || [];
        const classes = isEmployee && teachingClasses ? pick(teachingClasses) : null;
        const supported = isEmployee && supportedStudents ? pick(supportedStudents) : null;
        const classesChanged = classes && !sameClasses(person.classes || [], classes);
        const supportChanged = supported && !sameIds(person.supportedStudentIds || [], supported);
        if (!(next && differs(person, next)) && !classesChanged && !supportChanged) continue;

        const wasActive = person.isActive;
        if (next) Object.assign(person, Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined)));
        if (classesChanged) person.classes = classes;
        if (supportChanged) person.supportedStudentIds = supported;
        await person.save();
        if (next?.isActive === false && wasActive) summary.deactivated += 1;
        else if (next?.isActive && !wasActive) summary.reactivated += 1;
        else summary.updated += 1;
    }
    summary.warnings = [...warnings];
    return summary;
}

// One tick. Takes the lease, asks for the key, reads the list when it moved, reads the profiles when due.
// `force` skips the checks. Returns what happened.
async function runSync({ force = false, api = central, now = new Date() } = {}) {
    const claimed = await CentralSyncState.findOneAndUpdate(
        { _id: APP_ID, $or: [{ lockedUntil: null }, { lockedUntil: { $lt: now } }, { lockedUntil: { $exists: false } }] },
        { $set: { lockedUntil: new Date(now.getTime() + LEASE_MS) } },
        { new: true },
    );
    if (!claimed) {
        const exists = await CentralSyncState.exists({ _id: APP_ID });
        if (exists) return { status: 'locked' };
        try {
            await CentralSyncState.create({ _id: APP_ID, lockedUntil: new Date(now.getTime() + LEASE_MS) });
        } catch (error) {
            return { status: 'locked' };
        }
    }
    const state = claimed || (await CentralSyncState.findById(APP_ID));

    const result = { status: 'unchanged' };
    const warnings = new Set();
    const update = { checkedAt: now, lastError: null };
    try {
        const centralKey = await api.getApplicationEntitlementKey(APP_ID);
        if (force || !centralKey || centralKey !== state.key) {
            const { summary, key, warnings: accessWarnings } = await syncAccess(api);
            accessWarnings.forEach((warning) => warnings.add(warning));
            Object.assign(update, { key, syncedAt: now, lastSummary: summary });
            result.status = 'synced';
            result.summary = summary;
        }
        const profilesDue = force || !state.profilesSyncedAt || now - state.profilesSyncedAt >= PROFILE_EVERY_MS - PROFILE_SLACK_MS;
        if (profilesDue) {
            const profiles = await syncProfiles(api);
            (profiles.warnings || []).forEach((warning) => warnings.add(warning));
            if (!profiles.skipped) update.profilesSyncedAt = now;
            result.profiles = profiles;
            if (result.status === 'unchanged' && (profiles.updated || profiles.deactivated || profiles.reactivated)) result.status = 'synced';
        }
    } catch (error) {
        const message = describeFailure(error);
        update.lastError = message;
        result.status = 'error';
        result.message = message;
        winston.warn(`centralSync: ${message}`);
    } finally {
        update.warnings = [...warnings];
        if (update.warnings.length) winston.warn(`centralSync: ${update.warnings.join('; ')}`);
        await CentralSyncState.updateOne({ _id: APP_ID }, { $set: { ...update, lockedUntil: null } });
    }
    result.warnings = [...warnings];
    return result;
}

let intervalHandle = null;
let firstRunHandle = null;

function start(intervalMs = syncIntervalMs(process.env.MTSS_AUTO_SYNC_SECONDS)) {
    if (intervalHandle || intervalMs <= 0) return;
    const tick = () => runSync().catch((error) => winston.error('centralSync: tick failed:', error));
    intervalHandle = setInterval(tick, intervalMs);
    firstRunHandle = setTimeout(tick, FIRST_RUN_MS);
    winston.info(`centralSync: asking Central every ${Math.round(intervalMs / 1000)} seconds`);
}

function stop() {
    if (intervalHandle) clearInterval(intervalHandle);
    if (firstRunHandle) clearTimeout(firstRunHandle);
    intervalHandle = null;
    firstRunHandle = null;
}

module.exports = { start, stop, runSync, syncAccess, syncProfiles, syncIntervalMs, describeFailure };
