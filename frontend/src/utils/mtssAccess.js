const NATIVE_MTSS_ADMIN_ROLES = new Set(["directorate", "superadmin", "admin"]);
const NATIVE_MTSS_TEACHER_ROLES = new Set(["teacher", "se_teacher"]);
const DEFAULT_MTSS_LEADER_EMAILS = new Set([
    "aria@millennia21.id",
    "kholida@millennia21.id",
    "latifah@millennia21.id",
]);
const DEFAULT_MTSS_OBSERVER_EMAILS = new Set([
    "faisal@millennia21.id",
    "mahrukh@millennia21.id",
]);

const normalizeRole = (role = "") => String(role || "").trim().toLowerCase();
const normalizeEmail = (email = "") => String(email || "").trim().toLowerCase();

const buildFallbackMtssAccess = (user = {}) => {
    const role = normalizeRole(user?.role);
    const email = normalizeEmail(user?.email);

    if (DEFAULT_MTSS_OBSERVER_EMAILS.has(email)) {
        return {
            hasAccess: true,
            isReadOnly: true,
            canAccessAdmin: false,
            canManageConfig: false,
            accessLevel: "observer",
            effectiveRole: "observer",
            source: "frontend_fallback",
        };
    }

    if (NATIVE_MTSS_ADMIN_ROLES.has(role)) {
        return {
            hasAccess: true,
            isReadOnly: false,
            canAccessAdmin: true,
            canManageConfig: true,
            accessLevel: "admin",
            effectiveRole: role,
            source: "frontend_fallback",
        };
    }

    if (NATIVE_MTSS_TEACHER_ROLES.has(role)) {
        return {
            hasAccess: true,
            isReadOnly: false,
            canAccessAdmin: false,
            canManageConfig: false,
            accessLevel: "teacher",
            effectiveRole: role,
            source: "frontend_fallback",
        };
    }

    if (DEFAULT_MTSS_LEADER_EMAILS.has(email)) {
        return {
            hasAccess: true,
            isReadOnly: false,
            canAccessAdmin: true,
            canManageConfig: true,
            accessLevel: "leader",
            effectiveRole: "head_unit",
            source: "frontend_fallback",
        };
    }

    return {
        hasAccess: false,
        isReadOnly: false,
        canAccessAdmin: false,
        canManageConfig: false,
        accessLevel: null,
        effectiveRole: null,
        source: "frontend_fallback",
    };
};

export const getMtssAccessProfile = (user = null) => {
    if (!user || typeof user !== "object") return buildFallbackMtssAccess({});
    const profile = user.mtssAccess;
    if (profile && typeof profile === "object" && typeof profile.hasAccess === "boolean") {
        return profile;
    }
    return buildFallbackMtssAccess(user);
};

export const hasMtssAccess = (user = null) => getMtssAccessProfile(user).hasAccess === true;

export const isMtssObserver = (user = null) => getMtssAccessProfile(user).accessLevel === "observer";

export const canAccessMtssAdmin = (user = null) => getMtssAccessProfile(user).canAccessAdmin === true;

export const getDefaultMtssRoute = (user = null) => {
    const profile = getMtssAccessProfile(user);
    if (!profile.hasAccess) return null;
    if (profile.accessLevel === "observer") return "/mtss/observer";
    if (profile.canAccessAdmin) return "/mtss/admin";
    return "/mtss/teacher";
};
