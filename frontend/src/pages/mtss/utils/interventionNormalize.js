import { TIER_LABELS, STATUS_LABELS, INTERVENTION_TYPES, TYPE_LOOKUP, FOCUS_TYPE_MATCHERS } from "./interventionConstants";

export const normalizeTierCode = (value) => {
    if (!value) return "tier1";
    const normalized = value.toString().trim().toLowerCase();
    if (TIER_LABELS[normalized]) return normalized;
    const cleaned = normalized.replace(/\s+/g, "");
    return TIER_LABELS[cleaned] ? cleaned : "tier1";
};

export const normalizeStatus = (value) => {
    if (!value) return "monitoring";
    const normalized = value.toString().trim().toLowerCase();
    return STATUS_LABELS[normalized] ? normalized : "monitoring";
};

export const resolveTypeKey = (value) => {
    if (!value) return null;
    const cleaned = value.toString().trim();
    const upper = cleaned.toUpperCase();
    if (TYPE_LOOKUP.has(upper)) return upper;
    const lower = cleaned.toLowerCase();
    const byLabel = INTERVENTION_TYPES.find((entry) => entry.label.toLowerCase() === lower);
    if (byLabel) return byLabel.key;
    const match = FOCUS_TYPE_MATCHERS.find((entry) => entry.pattern.test(lower));
    return match ? match.key : null;
};
