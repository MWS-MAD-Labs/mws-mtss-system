export const JUNIOR_HIGH_GRADES = ["Grade 7", "Grade 8", "Grade 9"];

export const normalizeUnit = (value = "") => value.toString().trim().toLowerCase();

export const isKindergartenLabel = (value = "") => {
    const normalized = value?.toString().toLowerCase();
    return normalized?.includes("kindergarten") || normalized?.includes("kindy");
};

export const isSpecificKindergartenVariant = (value = "") => /\b(pre[-\s]?k|k\s*1|k\s*2)\b/i.test(value || "");

export const isJuniorHighPrincipal = (user = {}) => {
    if (normalizeUnit(user?.unit) !== "junior high") return false;
    const role = (user?.role || "").toLowerCase();
    const jobPosition = (user?.jobPosition || "").toLowerCase();
    const jobLevel = (user?.jobLevel || "").toLowerCase();
    return role === "head_unit" || jobPosition.includes("principal") || jobLevel.includes("head");
};
