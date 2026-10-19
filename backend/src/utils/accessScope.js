const { PERMISSIONS } = require('../constants/permissions');

// How much of the school one person sees in MTSS. Reading is one permission, how many students are in view is
// another. With neither scope permission it is only the students Central assigned: the classes they teach and the
// students they support.
const SCOPE_MODE = Object.freeze({
    NONE: 'none',
    ASSIGNED: 'assigned',
    UNIT: 'unit',
    ALL: 'all',
});

const has = (user, permission) => Array.isArray(user?.permissions) && user.permissions.includes(permission);
const unitOf = (user) => String(user?.unit || user?.department || '').trim();

function resolveMtssScope(user) {
    if (!has(user, PERMISSIONS.MTSS_READ)) return { mode: SCOPE_MODE.NONE };
    if (has(user, PERMISSIONS.MTSS_SCOPE_ALL)) return { mode: SCOPE_MODE.ALL };
    if (has(user, PERMISSIONS.MTSS_SCOPE_UNIT)) {
        // A unit scope without a unit shows nobody, never everybody.
        return unitOf(user) ? { mode: SCOPE_MODE.UNIT, unit: unitOf(user) } : { mode: SCOPE_MODE.NONE };
    }
    return { mode: SCOPE_MODE.ASSIGNED };
}

const isStudent = (user) => user?.personType === 'student';

module.exports = { SCOPE_MODE, has, resolveMtssScope, isStudent };
