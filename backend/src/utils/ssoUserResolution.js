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

async function resolveOrProvisionSsoUser(rawEmail, relayClaims = {}) {
    const email = normalizeEmail(rawEmail);
    if (!email) return null;

    const tags = Array.isArray(relayClaims.tags) ? relayClaims.tags : [];

    let userStudent = await UserStudent.findOne({ email });
    if (userStudent) {
        try {
            const centralStudentFields = await syncStudentFromCentral(email);
            if (centralStudentFields) {
                Object.assign(userStudent, centralStudentFields);
                userStudent.isActive = true;
            }
        } catch (error) {
            console.error('⚠️ MTSS SSO existing student lookup failed, keeping local status:', error.message);
        }
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

    try {
        const centralStudentFields = await syncStudentFromCentral(email);
        if (centralStudentFields) {
            userStudent = new UserStudent({
                ...centralStudentFields,
                emailVerified: true,
                lastLogin: new Date(),
                ssoProvisioned: true,
            });
            await userStudent.save();
            return userStudent;
        }
    } catch (error) {
        console.error('⚠️ MTSS SSO student lookup failed, falling back to staff check:', error.message);
    }

    let user = await User.findOne({ email });
    const centralFields = await syncEmployeeFromCentral(email);
    if (!centralFields) {
        return null;
    }

    const derivedRole = deriveMtssRoleFromCentralTags(tags, centralFields.jobLevel);

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

module.exports = { resolveOrProvisionSsoUser, nextRole };
