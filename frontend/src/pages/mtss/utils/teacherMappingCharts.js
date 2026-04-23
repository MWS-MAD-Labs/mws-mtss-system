import { formatDate } from "./teacherCommonUtils";

export const buildChartSeries = (assignment = {}) => {
    const checkIns = assignment.checkIns || [];
    const targetVal = assignment.targetScore?.value != null ? Number(assignment.targetScore.value) : null;

    if (checkIns.length) {
        return checkIns.map((entry) => {
            const label = formatDate(entry.date);
            const reading = entry.value != null ? Number(entry.value) : null;
            return { label, date: label, reading, goal: targetVal, value: reading };
        });
    }
    const goals = assignment.goals || [];
    if (goals.length) {
        const total = goals.length;
        let completed = 0;
        return goals.map((goal, index) => {
            if (goal.completed) completed += 1;
            const value = Math.round((completed / total) * 100);
            const label = goal.description || `Goal ${index + 1}`;
            return { label, date: label, reading: value, goal: 100, value };
        });
    }
    const value = assignment.status === "completed" ? 100 : 0;
    const label = formatDate(assignment.startDate);
    return [{ label, date: label, reading: value, goal: targetVal ?? 100, value }];
};

export const buildHistory = (assignment = {}) =>
    (assignment.checkIns || [])
        .slice(-6)
        .reverse()
        .map((entry) => ({
            date: formatDate(entry.date, { month: "short", day: "numeric", year: "numeric" }),
            timestamp: entry.date || null,
            score: entry.value ?? "-",
            unit: entry.unit || assignment.targetScore?.unit || assignment.baselineScore?.unit || assignment.metricLabel || null,
            notes: entry.summary || entry.nextSteps || "Check-in recorded",
            performed: entry.performed !== false,
            skipReason: entry.skipReason || null,
            skipReasonNote: entry.skipReasonNote || null,
            celebration: entry.celebration || null,
            evidence: entry.evidence || [],
            signal: entry.signal || null,
            tags: entry.tags || [],
            context: entry.context || null,
            observation: entry.observation || null,
            response: entry.response || null,
            nextStep: entry.nextStep || null,
            weeklyFocus: entry.weeklyFocus || null,
        }));
