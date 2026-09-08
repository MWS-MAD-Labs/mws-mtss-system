const User = require('../models/User');
const UserStudent = require('../models/UserStudent');
const { normalizeEmail, deriveUnitFromGrade } = require('./studentUserHelpers');
const { syncEmployeeFromCentral } = require('./employeeCentralSync');
const { syncStudentFromCentral } = require('./studentCentralSync');
const { deriveMtssRoleFromCentralTags } = require('./jobLevelRoleMapping');

// superadmin has no Central/Hub concept at all - Hub's own access tags treat
// "super-admin" job titles the same as plain "admin" (see mws-hub's
// ACCESS_ALIASES). It can only ever be granted locally, so the automated
// sync must never downgrade it back to 'admin' just because that's the
// highest tier Central can express.
function nextRole(derivedRole, existingRole) {
    if (existingRole === 'superadmin') return existingRole;
    return derivedRole || existingRole || 'staff';
}

// Always re-verifies against Central, even when a local UserStudent record
// already exists - Central is the only thing that gets to say whether this
// email is currently a student. Returns the UserStudent doc if Central
// confirms it, otherwise null (after deactivating a now-stale local record,
// when Central's answer was a confident "no" rather than a lookup failure).
async function tryResolveAsStudent(email) {
    let userStudent = await UserStudent.findOne({ email });

    let centralStudentFields = null;
    let studentLookupFailed = false;
    try {
        centralStudentFields = await syncStudentFromCentral(email);
    } catch (error) {
        console.error('⚠️ MTSS SSO student lookup failed:', error.message);
        studentLookupFailed = true;
    }

    if (centralStudentFields) {
        if (!userStudent) {
            userStudent = new UserStudent({ ...centralStudentFields });
        } else {
            Object.assign(userStudent, centralStudentFields);
        }
        userStudent.isActive = true;
        userStudent.emailVerified = true;
        userStudent.lastLogin = new Date();
        userStudent.ssoProvisioned = true;
        if (!userStudent.unit || !userStudent.department) {
            const unitInfo = deriveUnitFromGrade(userStudent.currentGrade, userStudent.className);
            if (unitInfo.unit) userStudent.unit = unitInfo.unit;
            if (unitInfo.department) userStudent.department = unitInfo.department;
        }
        await userStudent.save();
        return userStudent;
    }

    // A lookup error is treated as "couldn't check" rather than "not a
    // student" - if we already have a local record, keep trusting it
    // rather than kicking someone out over a network hiccup.
    if (studentLookupFailed) {
        if (userStudent) {
            userStudent.emailVerified = true;
            userStudent.lastLogin = new Date();
            userStudent.ssoProvisioned = true;
            await userStudent.save();
            return userStudent;
        }
        return null;
    }

    // Central confirmed this is no longer a student - deactivate the stale
    // record instead of leaving it active but unreachable.
    if (userStudent && userStudent.isActive) {
        userStudent.isActive = false;
        await userStudent.save();
    }
    return null;
}

async function tryResolveAsEmployee(email, tags) {
    let user = await User.findOne({ email });
    const centralFields = await syncEmployeeFromCentral(email);
    if (!centralFields) {
        return null;
    }

    const derivedRole = deriveMtssRoleFromCentralTags(
        tags,
        centralFields.jobLevel,
        centralFields.isTeachingRole,
    );

    if (user) {
        Object.assign(user, centralFields);
        user.role = nextRole(derivedRole, user.role);
        user.isActive = true;
        user.emailVerified = true;
        user.lastLogin = new Date();
        user.ssoProvisioned = true;
        await user.save();
        return user;
    }

    user = new User({
        email,
        username: email.split('@')[0],
        role: derivedRole || 'staff',
        ...centralFields,
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(),
        ssoProvisioned: true,
    });
    await user.save();
    return user;
}

// relayClaims.source ("employee"/"student") is Hub's own already-resolved
// answer, stamped into the relay token at mint time (mws-hub already did
// exactly this same Central lookup moments earlier - see
// mws-hub/backend/src/lib/central-client.ts's resolveCentralIdentity).
// Checking that one first means the common case (Hub's classification
// still matches Central, true for the overwhelming majority of logins)
// costs one Central call instead of two, and produces one Central audit
// log entry instead of two - previously this always tried student, then
// employee, regardless of source, so every single employee login logged a
// student-lookup miss that told nobody anything.
//
// Still falls through to the other check when the hinted one comes up
// empty, so a stale hint (Hub's classification lagging a very recent
// Central change) self-corrects instead of failing the login outright.
// One accepted trade-off: when source hints 'employee' and that check
// succeeds (the common path), the stale-student-record deactivation inside
// tryResolveAsStudent never runs for this login - a person who just
// changed from student to employee keeps their old UserStudent record
// active one login cycle longer than before. Central's own tags already
// stop that record from granting anything meaningful, and the next login
// that ever hints 'student' (or omits source) still catches it.
async function resolveOrProvisionSsoUser(rawEmail, relayClaims = {}) {
    const email = normalizeEmail(rawEmail);
    if (!email) return null;

    const tags = Array.isArray(relayClaims.tags) ? relayClaims.tags : [];
    const source = relayClaims.source;

    if (source === 'employee') {
        const employeeResult = await tryResolveAsEmployee(email, tags);
        if (employeeResult) return employeeResult;
        return tryResolveAsStudent(email);
    }

    if (source === 'student') {
        const studentResult = await tryResolveAsStudent(email);
        if (studentResult) return studentResult;
        return tryResolveAsEmployee(email, tags);
    }

    // No hint (relay claims omit source, or a caller other than the Hub
    // relay flow) - fall back to the original student-first order.
    const studentResult = await tryResolveAsStudent(email);
    if (studentResult) return studentResult;
    return tryResolveAsEmployee(email, tags);
}

module.exports = { resolveOrProvisionSsoUser, nextRole };
