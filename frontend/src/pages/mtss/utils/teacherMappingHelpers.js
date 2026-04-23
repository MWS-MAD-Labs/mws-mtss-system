import { formatDate } from "./teacherCommonUtils";

export const mapTierLabel = (tier) => {
    if (!tier) return "Tier 2";
    const code = tier.toString().toLowerCase();
    if (code.includes("3")) return "Tier 3";
    if (code.includes("1")) return "Tier 1";
    return "Tier 2";
};

export const normalizeTierCode = (value) => {
    if (!value) return null;
    const normalized = value.toString().toLowerCase();
    if (normalized.includes("3")) return "tier3";
    if (normalized.includes("2")) return "tier2";
    if (normalized.includes("1")) return "tier1";
    return null;
};

export const deriveFocus = (assignment) => {
    if (assignment?.focusAreas?.length) return assignment.focusAreas[0];
    if (assignment?.tier === "tier3") return "Intensive Support";
    return "Literacy & SEL";
};

export const inferProgressUnit = (assignment, student) => {
    const pool = [assignment?.metricLabel, assignment?.notes, assignment?.focusAreas?.join(" "), student?.type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    if (/attendance|present|absen/.test(pool)) return "%";
    if (/reading|fluency|literacy|wpm/.test(pool)) return "wpm";
    if (/math|numeracy|accuracy|score/.test(pool)) return "score";
    if (/behavior|sel|conduct|check-in|checkin/.test(pool)) return "pts";
    return "score";
};

export const isUpdateDue = (assignment) => {
    if (assignment?.status !== "active") return false;
    const lastCheckIn = assignment?.checkIns?.slice(-1)[0]?.date;
    if (!lastCheckIn) return true;
    const diffDays = (Date.now() - new Date(lastCheckIn).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 7;
};

export const formatDuration = (start, end) => {
    if (!start) return "Ongoing";
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffWeeks = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24 * 7)));
    return `${diffWeeks} wk${diffWeeks > 1 ? "s" : ""}`;
};

export const inferNextUpdate = (assignment) => {
    const sourceDate = assignment?.checkIns?.slice(-1)[0]?.date || assignment?.startDate;
    if (!sourceDate) return "Awaiting update";
    const date = new Date(sourceDate);
    date.setDate(date.getDate() + 7);
    return formatDate(date);
};
