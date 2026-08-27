const NATIVE_MTSS_ADMIN_ROLES = new Set(["directorate", "superadmin", "admin"]);
// 'principal' was dropped here to match accessControl.js (the backend, the
// authoritative check) - MTSS never actually stores that role value itself,
// Hub's "principal" access tag maps onto 'head_unit' during SSO sync (same
// leader tier, same permissions), so a stray "principal" role on a user
// object here would otherwise be treated as valid by this fallback but
// rejected by the backend that actually gates every API call.
const NATIVE_MTSS_LEADER_ROLES = new Set(["head_unit"]);
const NATIVE_MTSS_TEACHER_ROLES = new Set(["teacher", "se_teacher", "staff", "support_staff", "counselor"]);
// No default leader allowlist here anymore - Central's job_level for MTSS's
// leadership team is literally "Head Unit" today, which the SSO sync (see
// mws-mtss-system's jobLevelRoleMapping.js) already derives to role
// 'head_unit', already recognized above. The observer allowlist below stays:
// it deliberately *caps* someone whose Central title implies more (see
// accessControl.js), which Central has no way to express.
const DEFAULT_MTSS_OBSERVER_EMAILS = new Set([
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

    if (NATIVE_MTSS_LEADER_ROLES.has(role)) {
        return {
            hasAccess: true,
            isReadOnly: false,
            canAccessAdmin: true,
            canManageConfig: true,
            accessLevel: "leader",
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
    if (profile.accessLevel === "observer") return "/observer";
    if (profile.canAccessAdmin) return "/admin";
    return "/teacher";
};
