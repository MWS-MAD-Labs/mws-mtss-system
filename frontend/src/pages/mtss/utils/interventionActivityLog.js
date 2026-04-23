const STATUS_LABELS = {
    active: "Active",
    paused: "Paused",
    completed: "Completed",
    closed: "Closed",
};

const formatDateLabel = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(parsed);
};

const parseEventTime = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
};

const hasValue = (value) => value !== null && value !== undefined && `${value}`.trim() !== "";

const formatComparableValue = (value) => {
    if (!hasValue(value)) return "Not set";
    return String(value).trim();
};

const formatScoreValue = (value, unit) => {
    if (!hasValue(value)) return null;
    return unit ? `${value} ${unit}` : `${value}`;
};

const formatStatusLabel = (status) => {
    const key = String(status || "").trim().toLowerCase();
    return STATUS_LABELS[key] || formatComparableValue(status);
};

const resolveGoalValue = (intervention = {}) => {
    if (hasValue(intervention?.goal)) return intervention.goal;
    if (Array.isArray(intervention?.goals) && intervention.goals.length > 0) {
        const firstGoal = intervention.goals.find(Boolean);
        if (typeof firstGoal === "string") return firstGoal;
        if (firstGoal) return firstGoal.description || firstGoal.goal || firstGoal.title || firstGoal.name || null;
    }
    return null;
};

const buildScoreSnapshotDetails = (intervention = {}) => {
    const baselineValue = intervention?.baselineScore?.value ?? intervention?.baseline ?? null;
    const targetValue = intervention?.targetScore?.value ?? intervention?.target ?? null;
    const currentValue = intervention?.current ?? null;
    const unit =
        intervention?.baselineScore?.unit
        || intervention?.targetScore?.unit
        || intervention?.progressUnit
        || intervention?.metricLabel
        || null;

    return [
        formatScoreValue(baselineValue, unit) ? `Baseline: ${formatScoreValue(baselineValue, unit)}` : null,
        formatScoreValue(targetValue, unit) ? `Target: ${formatScoreValue(targetValue, unit)}` : null,
        formatScoreValue(currentValue, unit) ? `Current result: ${formatScoreValue(currentValue, unit)}` : null,
    ].filter(Boolean);
};

const groupPlanChangeEntries = (entries = []) => {
    const groups = new Map();

    entries.forEach((entry = {}, index) => {
        const changedAt = entry.changedAt || entry.updatedAt || null;
        const actor = entry.changedByName || entry.changedBy?.name || entry.changedBy?.username || null;
        const mergeKey = `${changedAt || `unknown-${index}`}::${actor || "unknown"}`;

        if (!groups.has(mergeKey)) {
            groups.set(mergeKey, {
                changedAt,
                actor,
                changes: [],
            });
        }

        groups.get(mergeKey).changes.push(entry);
    });

    return Array.from(groups.values());
};

const buildStartedEvent = (intervention = {}) => {
    const occurredAt = intervention.startDate || intervention.createdAt || null;
    if (!occurredAt) return null;

    const details = [
        intervention?.tierLabel || intervention?.tier ? `Tier: ${intervention.tierLabel || intervention.tier}` : null,
        intervention?.status || intervention?.statusLabel ? `Status: ${formatStatusLabel(intervention.status || intervention.statusLabel)}` : null,
        intervention?.strategyName ? `Strategy: ${intervention.strategyName}` : null,
        resolveGoalValue(intervention) ? `Goal: ${resolveGoalValue(intervention)}` : null,
        intervention?.monitoringMethod ? `Monitoring: ${intervention.monitoringMethod}` : null,
        intervention?.monitoringFrequency ? `Frequency: ${intervention.monitoringFrequency}` : null,
        ...buildScoreSnapshotDetails(intervention),
    ].filter(Boolean);

    if (intervention?.endDate) {
        details.push(`Window: ${formatDateLabel(occurredAt)} to ${formatDateLabel(intervention.endDate)}`);
    }

    return {
        id: `started-${intervention.id || intervention.assignmentId || occurredAt}`,
        type: "started",
        occurredAt,
        occurredLabel: formatDateLabel(occurredAt),
        title: "Intervention started",
        actor: intervention?.mentor || intervention?.mentorLabel || null,
        details,
        evidence: [],
    };
};

const buildProgressEvents = (intervention = {}) => {
    const unit = intervention?.progressUnit || intervention?.metricLabel || intervention?.baselineScore?.unit || intervention?.targetScore?.unit || null;
    const historyEntries = Array.isArray(intervention?.history) ? intervention.history : [];

    return historyEntries.map((entry = {}, index) => {
        const occurredAt = entry.timestamp || entry.date || null;
        const scoreLabel =
            hasValue(entry.score) && entry.score !== "-"
                ? formatScoreValue(entry.score, entry.unit || unit)
                : null;
        const title = entry.performed === false
            ? "Progress update skipped"
            : entry.signal
                ? "Observation update"
                : "Progress update";
        const details = [
            entry.notes || null,
            entry.skipReason ? `Reason: ${formatComparableValue(entry.skipReason).replace(/_/g, " ")}` : null,
            entry.skipReasonNote ? `Note: ${entry.skipReasonNote}` : null,
            entry.response ? `Response: ${entry.response}` : null,
            entry.nextStep ? `Next step: ${entry.nextStep}` : null,
            entry.weeklyFocus ? `Weekly focus: ${formatComparableValue(entry.weeklyFocus).replace(/_/g, " ")}` : null,
            entry.context ? `Context: ${entry.context}` : null,
        ].filter(Boolean);

        return {
            id: `progress-${intervention.id || intervention.assignmentId || "item"}-${index}`,
            type: "progress",
            occurredAt,
            occurredLabel: formatDateLabel(occurredAt || entry.date),
            title,
            actor: intervention?.mentor || intervention?.mentorLabel || null,
            scoreLabel,
            details,
            celebration: entry.celebration || null,
            evidence: Array.isArray(entry.evidence) ? entry.evidence : [],
            signal: entry.signal || null,
            tags: Array.isArray(entry.tags) ? entry.tags : [],
            observation: entry.observation || null,
        };
    });
};

const buildPlanEvents = (intervention = {}) => {
    const groups = groupPlanChangeEntries(intervention?.planChangeLog || []);

    return groups.map((group, index) => ({
        id: `plan-${intervention.id || intervention.assignmentId || "item"}-${group.changedAt || index}`,
        type: "plan",
        occurredAt: group.changedAt,
        occurredLabel: formatDateLabel(group.changedAt),
        title: "Intervention revised",
        actor: group.actor || null,
        details: group.changes.map((entry = {}) => {
            const label = entry.label || entry.field || "Update";
            return `${label}: ${formatComparableValue(entry.fromValue)} -> ${formatComparableValue(entry.toValue)}`;
        }),
        evidence: [],
    }));
};

export const buildInterventionActivityEntries = (intervention = {}) => {
    const entries = [
        buildStartedEvent(intervention),
        ...buildPlanEvents(intervention),
        ...buildProgressEvents(intervention),
    ]
        .filter(Boolean)
        .sort((left, right) => {
            const leftTime = parseEventTime(left.occurredAt)?.getTime?.() || 0;
            const rightTime = parseEventTime(right.occurredAt)?.getTime?.() || 0;
            return rightTime - leftTime;
        });

    return entries;
};
