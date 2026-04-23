export const MTSS_REALTIME_ADMIN_ROLES = new Set(["directorate", "admin", "superadmin", "head_unit"]);
export const MTSS_REALTIME_MENTOR_ROLES = new Set(["teacher", "staff", "support_staff", "se_teacher", "counselor"]);

const normalizeComparable = (value = "") =>
    value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

export const resolveMtssRealtimeScope = (user = {}) => {
    const role = normalizeComparable(user?.role || "");
    if (MTSS_REALTIME_ADMIN_ROLES.has(role)) {
        return "all";
    }

    const unit = normalizeComparable(user?.unit || user?.department || "");
    if (unit.includes("junior high")) return "junior-high";
    if (unit.includes("elementary")) return "elementary";
    if (unit.includes("kindergarten")) return "kindergarten";
    if (unit.includes("pelangi")) return "pelangi";

    return "all";
};
