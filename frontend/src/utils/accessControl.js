const NATIVE_DASHBOARD_ROLES = new Set(['directorate', 'superadmin', 'admin', 'head_unit']);

export const getEmotionalDashboardRole = (user) => {
    if (!user) return null;
    return user.dashboardRole || user.dashboardAccess?.effectiveRole || user.role || null;
};

export const hasEmotionalDashboardAccess = (user) => {
    if (!user) return false;

    const role = user.role;
    const effectiveRole = getEmotionalDashboardRole(user);
    if (role && NATIVE_DASHBOARD_ROLES.has(role)) {
        return true;
    }
    if (effectiveRole && NATIVE_DASHBOARD_ROLES.has(effectiveRole)) {
        return true;
    }

    const delegatedAccess = user.dashboardAccess;
    if (!delegatedAccess) {
        return false;
    }

    if (delegatedAccess.hasDelegatedAccess === false) {
        return false;
    }

    const scopes = Array.isArray(delegatedAccess.scope) ? delegatedAccess.scope : null;
    if (scopes && scopes.length > 0) {
        return scopes.includes('emotional_dashboard');
    }

    return Boolean(delegatedAccess.hasDelegatedAccess);
};

export const hasDelegatedDashboardAccess = (user) => {
    return Boolean(user?.dashboardAccess?.hasDelegatedAccess);
};

export const getDelegatedDashboardDetails = (user) => {
    if (!user?.dashboardAccess?.hasDelegatedAccess) {
        return null;
    }
    return user.dashboardAccess;
};
