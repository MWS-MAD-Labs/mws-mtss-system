import { getDirectionalProgress } from "./directionalProgress";
import { TYPE_LOOKUP } from "./interventionConstants";
import { resolveTypeKey } from "./interventionNormalize";

const DAY_MS = 24 * 60 * 60 * 1000;

const toNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const toStartOfDay = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
};

const formatShortDate = (value) => {
    const date = toStartOfDay(value);
    if (!date) return null;
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date);
};

export const formatCrewRosterSupportLabel = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "Focused Support";
    const typeKey = resolveTypeKey(raw);
    if (typeKey && TYPE_LOOKUP.has(typeKey)) return TYPE_LOOKUP.get(typeKey).label;
    return raw
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getLatestCheckIn = (assignment = {}) => {
    const checkIns = Array.isArray(assignment.checkIns) ? assignment.checkIns : [];
    return [...checkIns]
        .filter((entry) => entry?.date)
        .sort((left, right) => new Date(right.date) - new Date(left.date))[0] || null;
};

export const getCrewRosterSummary = (assignment = {}) => {
    const mode = assignment.mode || "quantitative";
    const latestCheckIn = getLatestCheckIn(assignment);
    const baseline = toNumber(assignment.baselineScore?.value);
    const target = toNumber(assignment.targetScore?.value);
    const current = toNumber(latestCheckIn?.value);
    const progress = getDirectionalProgress({ baseline, current, target });
    const unit = assignment.metricLabel || assignment.targetScore?.unit || assignment.baselineScore?.unit || "score";
    const mentor = String(assignment.mentor || assignment.studentSubjectMentorPair?.mentorName || "").trim();

    let progressLabel = "Awaiting baseline";
    let progressDetail = "No check-in data";
    if (mode === "qualitative") {
        progressLabel = latestCheckIn?.signal
            ? latestCheckIn.signal.replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase())
            : "Awaiting observation";
        progressDetail = latestCheckIn?.weeklyFocus
            ? latestCheckIn.weeklyFocus.replace(/_/g, " ")
            : "Qualitative support";
    } else if (baseline !== null && target !== null && current !== null) {
        progressLabel = `${progress.percent ?? 0}%`;
        progressDetail = progress.targetMet ? "Target reached" : `${current} ${unit}`;
    } else if (current !== null) {
        progressLabel = `${current} ${unit}`;
        progressDetail = target === null ? "Set a target" : "Set a baseline";
    } else if (baseline !== null && target !== null) {
        progressDetail = "Awaiting first check-in";
    }

    const status = String(assignment.statusKey || assignment.status || "active").toLowerCase();
    let nextActionLabel = "Open student";
    let nextActionTone = "neutral";
    if (["closed", "completed"].includes(status)) {
        nextActionLabel = status === "closed" ? "Plan closed" : "Plan completed";
    } else if (!mentor || /unassigned/i.test(mentor)) {
        nextActionLabel = "Assign mentor";
        nextActionTone = "warning";
    } else if (mode !== "qualitative" && baseline === null) {
        nextActionLabel = "Set baseline";
        nextActionTone = "warning";
    } else if (mode !== "qualitative" && target === null) {
        nextActionLabel = "Set target";
        nextActionTone = "warning";
    } else if (!latestCheckIn) {
        nextActionLabel = "Log first check-in";
        nextActionTone = "warning";
    } else {
        const dueDate = toStartOfDay(assignment.nextUpdate);
        const today = toStartOfDay(new Date());
        if (dueDate && today) {
            const days = Math.round((dueDate - today) / DAY_MS);
            if (days < 0) {
                nextActionLabel = `${Math.abs(days)}d overdue`;
                nextActionTone = "danger";
            } else if (days === 0) {
                nextActionLabel = "Check-in due today";
                nextActionTone = "warning";
            } else {
                nextActionLabel = `Due ${formatShortDate(dueDate)}`;
            }
        }
    }

    return { progressLabel, progressDetail, nextActionLabel, nextActionTone };
};
