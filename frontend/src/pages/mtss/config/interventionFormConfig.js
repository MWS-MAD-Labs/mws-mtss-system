/**
 * Intervention Form Configuration Constants
 */

export const INTERVENTION_TYPES = [
    { label: "English", value: "english" },
    { label: "Math", value: "math" },
    { label: "Behavior", value: "behavior" },
    { label: "SEL", value: "sel" },
    { label: "Attendance", value: "attendance" },
    { label: "Bahasa Indonesia", value: "indonesian" },
    { label: "Universal Supports", value: "universal" },
];

export const STRATEGY_TYPE_ALIASES = {
    english: ["english", "bahasa inggris", "ela", "literacy", "reading", "ela/reading", "ela & reading", "sight words"],
    math: ["math", "mathematics", "numeracy", "stem"],
    behavior: ["behavior", "behaviour", "conduct", "regulation", "sel"],
    sel: ["sel", "social emotional", "social-emotional", "behavior", "wellness"],
    attendance: ["attendance", "present", "absent", "absences", "engagement"],
    indonesian: ["indonesian", "bahasa indonesia", "bahasa", "bi", "indonesian language"],
    universal: ["universal", "schoolwide", "all", "tier 1"],
};

export const TIERS = [
    { label: "Tier 1", value: "tier1" },
    { label: "Tier 2", value: "tier2" },
    { label: "Tier 3", value: "tier3" },
];

export const DURATIONS = ["2 weeks", "4 weeks", "6 weeks", "8 weeks", "Custom"];

export const FREQUENCIES = ["Daily", "Weekly", "Bi-weekly", "Custom"];

export const WEEKDAYS = [
    { label: "Mon", value: "Monday" },
    { label: "Tue", value: "Tuesday" },
    { label: "Wed", value: "Wednesday" },
    { label: "Thu", value: "Thursday" },
    { label: "Fri", value: "Friday" },
];

export const METHODS = [
    "Option 1 - Direct Observation",
    "Option 2 - Student Self-Report",
    "Option 3 - Assessment Data",
];

export const SKIP_REASONS = [
    { label: "Teacher Rescheduled", value: "teacher_rescheduled" },
    { label: "Student Didn't Come", value: "student_absent" },
    { label: "School Holiday", value: "school_holiday" },
    { label: "Schedule Conflict", value: "schedule_conflict" },
    { label: "Other", value: "other" },
];

export const SCORE_UNITS = ["wpm", "%", "pts", "score"];

export const filterStrategiesByType = (strategies, type) => {
    if (!type) return strategies;
    const typeKey = type.toLowerCase();
    const aliasList = STRATEGY_TYPE_ALIASES[typeKey] || [typeKey];
    const aliasSet = new Set(aliasList.map((token) => token.toLowerCase()));

    const matchesAlias = (value = "") => {
        const normalized = value.toString().toLowerCase();
        if (!normalized) return false;
        return Array.from(aliasSet).some((alias) => normalized === alias || normalized.includes(alias));
    };

    return strategies.filter((strategy) => {
        const bestForMatches = Array.isArray(strategy.bestFor)
            ? strategy.bestFor.some((area) => matchesAlias(area))
            : false;
        const tagMatches = Array.isArray(strategy.tags)
            ? strategy.tags.some((tag) => matchesAlias(tag))
            : false;
        return bestForMatches || tagMatches;
    });
};

export const GOAL_NOTES_MAX_LENGTH = 100;
// % / pts / score are genuinely bounded 0-100. wpm (reading fluency) is
// not - a fluent upper-grade reader can clear 100+ words per minute, so
// capping it would reject real data, not catch a typo.
const CAPPED_SCORE_UNITS = new Set(["%", "pts", "score"]);
export const MAX_CAPPED_SCORE = 100;

export const getInterventionFormErrors = (formState = {}) => {
    const errors = {};

    if (!formState.studentId) errors.studentId = "Select a student";
    if (!formState.type) errors.type = "Select a subject or focus area";
    if (!formState.tier) errors.tier = "Select a tier";
    if (!formState.startDate) errors.startDate = "Select a start date";
    if (!formState.monitorFrequency) errors.monitorFrequency = "Select a monitoring frequency";
    if (!formState.monitorMethod) errors.monitorMethod = "Select a monitoring method";

    if ((formState.goal || "").length > GOAL_NOTES_MAX_LENGTH) {
        errors.goal = `Goal must be ${GOAL_NOTES_MAX_LENGTH} characters or fewer`;
    }
    if ((formState.notes || "").length > GOAL_NOTES_MAX_LENGTH) {
        errors.notes = `Notes must be ${GOAL_NOTES_MAX_LENGTH} characters or fewer`;
    }

    const scoreCapped = CAPPED_SCORE_UNITS.has(formState.baselineUnit);
    const baseline = formState.baselineValue === "" || formState.baselineValue == null ? null : Number(formState.baselineValue);
    const target = formState.targetValue === "" || formState.targetValue == null ? null : Number(formState.targetValue);

    if (baseline != null) {
        if (baseline < 0) errors.baselineValue = "Baseline can't be negative";
        else if (scoreCapped && baseline > MAX_CAPPED_SCORE) errors.baselineValue = `Baseline can't be above ${MAX_CAPPED_SCORE} for this unit`;
    }
    if (target != null) {
        if (target < 0) errors.targetValue = "Target can't be negative";
        else if (scoreCapped && target > MAX_CAPPED_SCORE) errors.targetValue = `Target can't be above ${MAX_CAPPED_SCORE} for this unit`;
    }
    // Not "baseline must be below target" - a reduction-style goal (fewer
    // behavior incidents, fewer absences) legitimately has target < baseline.
    // The progress-percentage formula (DashboardOverviewSpotlightDetails)
    // only breaks when they're exactly equal (divide by zero).
    if (baseline != null && target != null && baseline === target) {
        errors.targetValue = "Target can't be the same as baseline";
    }

    return errors;
};

export const validateInterventionForm = (formState) => Object.keys(getInterventionFormErrors(formState)).length === 0;
