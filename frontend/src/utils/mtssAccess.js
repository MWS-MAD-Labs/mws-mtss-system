import { hasPermission } from "@/utils/accessControl";
import { PERMISSIONS } from "@/constants/permissions";

// MTSS access comes from three permissions that build on each other (see backend middleware/auth.js):
// mtss.read opens it, mtss.write adds writing, mtss.admin adds managing. Reading without writing is the observer.
export const getMtssAccessProfile = (user = null) => {
    const hasAccess = hasPermission(user, PERMISSIONS.MTSS_READ);
    const canWrite = hasAccess && hasPermission(user, PERMISSIONS.MTSS_WRITE);
    const canAccessAdmin = hasAccess && hasPermission(user, PERMISSIONS.MTSS_ADMIN);

    let accessLevel = null;
    if (canAccessAdmin) accessLevel = "admin";
    else if (canWrite) accessLevel = "teacher";
    else if (hasAccess) accessLevel = "observer";

    return {
        hasAccess,
        isReadOnly: hasAccess && !canWrite && !canAccessAdmin,
        canAccessAdmin,
        canManageConfig: canAccessAdmin,
        accessLevel,
    };
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
