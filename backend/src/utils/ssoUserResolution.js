const User = require('../models/User');
const UserStudent = require('../models/UserStudent');
const { normalizeEmail, deriveUnitFromGrade } = require('./studentUserHelpers');
const { syncEmployeeFromCentral } = require('./employeeCentralSync');
const { syncStudentFromCentral } = require('./studentCentralSync');
const { mapJobLevelToRole } = require('./jobLevelRoleMapping');

async function resolveOrProvisionSsoUser(rawEmail) {
    const email = normalizeEmail(rawEmail);
    if (!email) return null;

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

    if (user) {
        Object.assign(user, centralFields);
        user.role = mapJobLevelToRole(centralFields.jobLevel) || user.role || 'staff';
        user.isActive = true;
        user.emailVerified = true;
        user.lastLogin = new Date();
        await user.save();
        return user;
    }

    user = new User({
        email,
        username: email.split('@')[0],
        role: mapJobLevelToRole(centralFields.jobLevel) || 'staff',
        ...centralFields,
        isActive: true,
        emailVerified: true,
        lastLogin: new Date(),
    });
    await user.save();
    return user;
}

module.exports = { resolveOrProvisionSsoUser };
