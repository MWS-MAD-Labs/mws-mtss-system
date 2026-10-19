const { PERMISSIONS } = require('../constants/permissions');
const { has, isStudent } = require('./accessScope');

// A name for the kind of person this is, worked out from what Central gave them and what it keeps about them.
// It is never stored and never decides access: it is the label the assistant speaks to and the screens show. A
// route or a data scope asks for a permission instead (tests/smoke/no-role-in-gates.test.js keeps it that way).
const ACTOR_KIND = Object.freeze({
    STUDENT: 'student',
    DIRECTORATE: 'directorate',
    HEAD_UNIT: 'head_unit',
    ADMIN: 'admin',
    SE_TEACHER: 'se_teacher',
    TEACHER: 'teacher',
    STAFF: 'staff',
});

function actorKind(user) {
    if (!user) return null;
    if (isStudent(user)) return ACTOR_KIND.STUDENT;
    if (has(user, PERMISSIONS.MTSS_ADMIN)) {
        if (has(user, PERMISSIONS.MTSS_SCOPE_ALL)) return ACTOR_KIND.DIRECTORATE;
        if (has(user, PERMISSIONS.MTSS_SCOPE_UNIT)) return ACTOR_KIND.HEAD_UNIT;
        return ACTOR_KIND.ADMIN;
    }
    if (user.isTeachingRole) {
        const supports = Array.isArray(user.supportedStudentIds) && user.supportedStudentIds.length > 0;
        const teachesClass = Array.isArray(user.classes) && user.classes.length > 0;
        return supports && !teachesClass ? ACTOR_KIND.SE_TEACHER : ACTOR_KIND.TEACHER;
    }
    return ACTOR_KIND.STAFF;
}

module.exports = { ACTOR_KIND, actorKind };
