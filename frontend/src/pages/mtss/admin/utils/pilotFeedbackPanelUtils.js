export const STATUS_LABELS = {
    in_progress: "In progress",
    completed: "Completed",
};

export const READINESS_LABELS = {
    yes: "Ready",
    almost: "Almost ready",
    "not-yet": "Not ready",
    draft: "Draft only",
};

export const COMPLETION_STATUS_LABELS = {
    yes: "Complete",
    partial: "Partial",
    no: "Not complete",
};

export const BUG_SEVERITY_LABELS = {
    low: "Low",
    medium: "Medium",
    high: "High",
};

const BUG_SEVERITY_ORDER = {
    low: 1,
    medium: 2,
    high: 3,
};

export const formatDateTime = (value) => {
    if (!value) return "Not yet";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Not yet";
    return parsed.toLocaleString();
};

export const formatRelativeTime = (value) => {
    if (!value) return "No live updates yet";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "No live updates yet";
    const diffMinutes = Math.round((Date.now() - parsed.getTime()) / 60000);

    if (diffMinutes <= 1) return "Updated just now";
    if (diffMinutes < 60) return `Updated ${diffMinutes} min ago`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `Updated ${diffHours} hr ago`;

    return formatDateTime(value);
};

export const formatPilotRouteLabel = (value = "") => {
    const route = String(value || "").trim();
    if (!route) return "Not captured yet";

    return route
        .replace(/\?.*$/, (query) => {
            if (!query) return "";
            return query
                .replace(/\?/g, " ? ")
                .replace(/&/g, " · ")
                .replace(/=/g, "=");
        });
};

export const getPilotLiveStatus = (session = {}) => {
    const modal = String(session?.liveContext?.currentModal || "").trim();
    const action = String(session?.liveContext?.currentAction || "").trim();
    const currentStepTitle = String(session?.liveContext?.currentStepTitle || "").trim();

    if (modal === "final-feedback") {
        return "Writing final feedback";
    }
    if (modal === "step-feedback") {
        return currentStepTitle ? `Writing feedback for ${currentStepTitle}` : "Writing step feedback";
    }
    if (action) {
        return action.charAt(0).toUpperCase() + action.slice(1);
    }
    if (currentStepTitle) {
        return `Working on ${currentStepTitle}`;
    }
    return "Pilot session open";
};

export const buildStepCoverage = (sessions = []) => {
    const map = new Map();

    sessions.forEach((session) => {
        (session.stepFeedback || []).forEach((step) => {
            const key = step.stepId || step.id;
            if (!key) return;

            const current = map.get(key) || {
                stepId: key,
                title: step.title || key,
                order: step.order || 0,
                completed: 0,
                total: 0,
            };

            current.total += 1;
            if (step.completedInHub) {
                current.completed += 1;
            }

            map.set(key, current);
        });
    });

    return Array.from(map.values())
        .sort((left, right) => left.order - right.order)
        .map((entry) => ({
            ...entry,
            completionRate: entry.total ? Math.round((entry.completed / entry.total) * 100) : 0,
        }));
};

export const getSessionReadinessKey = (session = {}) =>
    session?.finalFeedbackSavedAt ? String(session?.finalFeedback?.readiness || "") || "not-yet" : "draft";

export const getSessionReadinessLabel = (session = {}) =>
    READINESS_LABELS[getSessionReadinessKey(session)] || "Draft only";

export const buildBugSeveritySummary = (session = {}) => {
    const counts = {
        low: 0,
        medium: 0,
        high: 0,
    };

    (session?.stepFeedback || []).forEach((step) => {
        if (!step?.bugFound) return;
        const severity = BUG_SEVERITY_ORDER[step?.bugSeverity] ? step.bugSeverity : "medium";
        counts[severity] += 1;
    });

    const highestSeverity = ["high", "medium", "low"].find((severity) => counts[severity] > 0) || null;
    const total = counts.low + counts.medium + counts.high;

    return {
        counts,
        highestSeverity,
        total,
    };
};

export const buildReadinessTrendData = (sessions = [], limit = 8) =>
    [...sessions]
        .filter((entry) => entry?.finalFeedbackSavedAt)
        .sort((left, right) => {
            const leftTime = new Date(left?.updatedAt || left?.clientUpdatedAt || left?.finalFeedbackSavedAt || 0).getTime();
            const rightTime = new Date(right?.updatedAt || right?.clientUpdatedAt || right?.finalFeedbackSavedAt || 0).getTime();
            return leftTime - rightTime;
        })
        .slice(-limit)
        .map((entry, index) => {
            const testerName = String(entry?.tester?.name || "").trim();
            const shortLabel = testerName
                ? testerName
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() || "")
                    .join("")
                    .slice(0, 3)
                : `P${index + 1}`;

            return {
                sessionKey: entry?.sessionKey || `${shortLabel}-${index}`,
                label: shortLabel || `P${index + 1}`,
                name: testerName || "Unnamed principal",
                confidence: Number(entry?.finalFeedback?.overallConfidence || 0),
                readiness: getSessionReadinessKey(entry),
                updatedAt: entry?.updatedAt || entry?.clientUpdatedAt || entry?.finalFeedbackSavedAt || null,
            };
        });

export const buildReadinessDistribution = (sessions = []) =>
    sessions.reduce(
        (accumulator, session) => {
            const readinessKey = getSessionReadinessKey(session);
            accumulator[readinessKey] = Number(accumulator[readinessKey] || 0) + 1;
            return accumulator;
        },
        {
            yes: 0,
            almost: 0,
            "not-yet": 0,
            draft: 0,
        },
    );
