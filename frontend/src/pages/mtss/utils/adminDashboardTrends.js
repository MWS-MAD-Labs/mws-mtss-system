import { isAssignmentTargetMet } from "./adminDashboardStats";
import { getAssignmentSupportUnitCount } from "./supportUnitUtils";

export const formatDateLabel = (value) => {
    if (!value) return "-";
    try {
        return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
    } catch {
        return "-";
    }
};

const getWeekKey = (date) => {
    const current = new Date(date);
    const firstDayOfYear = new Date(current.getFullYear(), 0, 1);
    const pastDays = Math.floor((current - firstDayOfYear) / 86400000);
    const weekNumber = Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7);
    return `${current.getFullYear()}-${weekNumber}`;
};

const safeNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(value)));

const getProgressRatio = (assignment = {}, value) => {
    const latestValue = safeNumber(value);
    const baselineValue = safeNumber(assignment.baselineScore?.value);
    const targetValue = safeNumber(assignment.targetScore?.value);

    if (latestValue == null) return null;
    if (targetValue == null || baselineValue == null || targetValue === baselineValue) {
        return latestValue > 0 ? 1 : 0;
    }

    const rawRatio = (latestValue - baselineValue) / (targetValue - baselineValue);
    return Math.max(0, rawRatio);
};

const buildTrendPaths = (trendData = []) => {
    if (!trendData.length) {
        return { met: "", support: "" };
    }
    const width = 600;
    const height = 200;
    const maxIndex = Math.max(trendData.length - 1, 1);

    const createPath = (key) =>
        trendData
            .map((point, index) => {
                const x = (index / maxIndex) * width;
                const y = height - ((point[key] || 0) / 100) * height;
                return `${index === 0 ? "M" : "L"}${x},${y}`;
            })
            .join(" ");

    return {
        met: createPath("met"),
        support: createPath("support"),
    };
};

const collectAssignmentSnapshots = (assignment = {}) => {
    const checkIns = Array.isArray(assignment.checkIns) ? assignment.checkIns : [];
    if (checkIns.length) {
        return checkIns
            .filter((checkIn) => checkIn?.date)
            .map((checkIn) => {
                const ratio = getProgressRatio(assignment, checkIn.value);
                const onTrack = ratio != null ? ratio >= 0.6 : isAssignmentTargetMet(assignment);
                return {
                    date: checkIn.date,
                    onTrack,
                };
            });
    }

    const fallbackDate = assignment.updatedAt || assignment.startDate || assignment.createdAt;
    if (!fallbackDate) return [];

    return [
        {
            date: fallbackDate,
            onTrack: isAssignmentTargetMet(assignment),
        },
    ];
};

export const buildTrendData = (assignments = []) => {
    const buckets = new Map();

    assignments.forEach((assignment) => {
        const supportUnitCount = getAssignmentSupportUnitCount(assignment);
        collectAssignmentSnapshots(assignment).forEach((snapshot) => {
            const date = new Date(snapshot.date);
            const key = getWeekKey(date);
            if (!buckets.has(key)) {
                buckets.set(key, { total: 0, met: 0, support: 0, date });
            }

            const bucket = buckets.get(key);
            bucket.total += supportUnitCount;
            if (snapshot.onTrack) {
                bucket.met += supportUnitCount;
            } else {
                bucket.support += supportUnitCount;
            }
        });
    });

    const sorted = Array.from(buckets.values())
        .sort((left, right) => left.date - right.date)
        .slice(-6);

    const trendData = sorted.map((bucket) => ({
        label: formatDateLabel(bucket.date),
        met: bucket.total ? clampPercent((bucket.met / bucket.total) * 100) : 0,
        support: bucket.total ? clampPercent((bucket.support / bucket.total) * 100) : 0,
        total: bucket.total,
    }));

    return {
        trendData,
        trendPaths: buildTrendPaths(trendData),
    };
};
