import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { INTERVENTION_TYPES, TIER_LABELS, TIER_PRIORITY, TYPE_LOOKUP } from "./interventionConstants";
import { resolveTypeKey, normalizeTierCode } from "./interventionNormalize";
import { ensureStudentInterventions, pickPrimaryIntervention } from "./interventionSelection";
import { isAssignmentTargetMet } from "./adminDashboardStats";
import {
    getAssignmentFocusLabels,
    getAssignmentStudentKeys,
    getAssignmentSupportUnitCount,
    getAssignmentSupportUnitKeys,
} from "./supportUnitUtils";

const ASSIGNMENT_STATUSES = new Set(["active", "paused", "completed"]);

const gradients = [
    "from-[#a78bfa] to-[#6366f1]",
    "from-[#f472b6] to-[#fb7185]",
    "from-[#34d399] to-[#10b981]",
    "from-[#22d3ee] to-[#3b82f6]",
    "from-[#fcd34d] to-[#f97316]",
];

const safeNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const getTrackedAssignments = (assignments = []) =>
    assignments.filter((assignment) => ASSIGNMENT_STATUSES.has(String(assignment?.status || "").toLowerCase()));

const isTieredIntervention = (entry = {}) => {
    const tierCode = normalizeTierCode(entry?.tierCode || entry?.tier);
    return tierCode === "tier2" || tierCode === "tier3";
};

const getAssignmentTypeMeta = (assignment = {}, focusOverride = "") => {
    const focusLabel = focusOverride || (Array.isArray(assignment.focusAreas)
        ? assignment.focusAreas.find(Boolean)
        : assignment.focusAreas);
    const typeKey = resolveTypeKey(focusLabel || assignment.strategyName || assignment.metricLabel);
    const meta = typeKey ? TYPE_LOOKUP.get(typeKey) : null;

    return {
        key: typeKey || "GENERAL",
        label: meta?.label || focusLabel || "General Support",
    };
};

const getStudentTierCode = (student = {}) => {
    const interventions = ensureStudentInterventions(student.interventions);
    const primary = pickPrimaryIntervention(interventions);
    if (primary?.tierCode) {
        return primary.tierCode;
    }
    return normalizeTierCode(student.tier || student.profile?.tier);
};

const getAssignmentLatestCheckIn = (assignment = {}) =>
    (assignment.checkIns || [])
        .filter((entry) => entry?.date)
        .sort((left, right) => new Date(left.date) - new Date(right.date))
        .slice(-1)[0] || null;

const getAssignmentProgressRatio = (assignment = {}, checkIn = getAssignmentLatestCheckIn(assignment)) => {
    const latestValue = safeNumber(checkIn?.value);
    const baselineValue = safeNumber(assignment.baselineScore?.value);
    const targetValue = safeNumber(assignment.targetScore?.value);

    if (latestValue == null) return null;
    if (targetValue == null || baselineValue == null || targetValue === baselineValue) {
        return latestValue > 0 ? 1 : 0;
    }

    const rawRatio = (latestValue - baselineValue) / (targetValue - baselineValue);
    return Math.max(0, Math.min(rawRatio, 1.25));
};

const getAssignmentProgressSignal = (assignment = {}) => {
    if (isAssignmentTargetMet(assignment)) {
        return "improved";
    }

    const latestCheckIn = getAssignmentLatestCheckIn(assignment);
    const ratio = getAssignmentProgressRatio(assignment, latestCheckIn);
    if (ratio == null) {
        return "needs-support";
    }
    if (ratio >= 0.55) {
        return "stable";
    }
    return "needs-support";
};

export const buildSystemSnapshot = (summary, students = []) => {
    const fallbackTotal = students.length;
    const tierBreakdown = summary?.tierBreakdown?.length
        ? summary.tierBreakdown
        : [{ label: "Tier 1", count: fallbackTotal, description: `${fallbackTotal} support units` }];

    return {
        totalStudents: summary?.total || fallbackTotal,
        tierBreakdown,
        interventions: summary?.interventions?.length ? summary.interventions.slice(0, 5) : [],
        activeInterventionCount: summary?.activeInterventionCount || 0,
    };
};

export const buildSummaryFromStudents = (students = []) => {
    const tierCounts = {
        [TIER_LABELS.tier1]: 0,
        [TIER_LABELS.tier2]: 0,
        [TIER_LABELS.tier3]: 0,
    };
    const interventionCounts = {};
    let activeInterventionCount = 0;

    students.forEach((student) => {
        const interventions = ensureStudentInterventions(student.interventions);
        const primary = pickPrimaryIntervention(interventions);
        const tierCode = getStudentTierCode(student);
        const tierLabel = TIER_LABELS[tierCode] || TIER_LABELS.tier1;
        tierCounts[tierLabel] = (tierCounts[tierLabel] || 0) + 1;

        if (primary && isTieredIntervention(primary)) {
            interventionCounts[primary.label] = (interventionCounts[primary.label] || 0) + 1;
            activeInterventionCount += 1;
        }
    });

    const tierBreakdown = Object.entries(tierCounts)
        .map(([label, count]) => ({
            label,
            count,
            description: `${count} support units`,
        }))
        .sort((left, right) => (TIER_PRIORITY[normalizeTierCode(left.label)] || 99) - (TIER_PRIORITY[normalizeTierCode(right.label)] || 99));

    const interventions = Object.entries(interventionCounts)
        .map(([label, count]) => ({ label, count }))
        .sort((left, right) => right.count - left.count);

    return {
        total: students.length,
        tierBreakdown,
        interventions,
        activeInterventionCount,
    };
};

export const buildSuccessByType = (assignments = []) => {
    const grouped = {};

    getTrackedAssignments(assignments).forEach((assignment) => {
        const unitCountPerFocus = Math.max(getAssignmentStudentKeys(assignment).length, 1);
        getAssignmentFocusLabels(assignment).forEach((focus) => {
            const { label } = getAssignmentTypeMeta(assignment, focus);
            const bucket = grouped[label] || { total: 0, success: 0 };
            bucket.total += unitCountPerFocus;
            if (isAssignmentTargetMet(assignment)) {
                bucket.success += unitCountPerFocus;
            }
            grouped[label] = bucket;
        });
    });

    return Object.entries(grouped)
        .map(([label, value], index) => ({
            label,
            value: value.total ? Math.round((value.success / value.total) * 100) : 0,
            detail: `${value.success}/${value.total} support units on track or completed`,
            gradient: gradients[index % gradients.length],
        }))
        .sort((left, right) => right.value - left.value);
};

export const buildStrategyHighlights = (assignments = []) => {
    const counts = {};
    getTrackedAssignments(assignments).forEach((assignment) => {
        const unitCount = Math.max(getAssignmentStudentKeys(assignment).length, 1);
        getAssignmentFocusLabels(assignment).forEach((area) => {
            counts[area] = (counts[area] || 0) + unitCount;
        });
    });

    return Object.entries(counts)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 4)
        .map(([label, count]) => ({
            label,
            value: `${count} active units`,
        }));
};

export const buildTierMovement = (students = [], assignments = []) => {
    if (!students.length) {
        return [
            { label: "Improved", detail: "0 support units", accent: "text-emerald-500", icon: ArrowUpRight },
            { label: "Needs Support", detail: "0 support units", accent: "text-rose-500", icon: ArrowDownRight },
            { label: "Stable", detail: "0 support units", accent: "text-sky-500", icon: Minus },
        ];
    }

    const movementBySupportUnit = new Map(
        students.map((student) => {
            const baseId = student.baseStudentId || student._id || student.id;
            const assignmentId = student.supportUnit?.assignmentId || student.assignmentId || student.id || student._id;
            return [student.supportUnit ? student.id : `${baseId}:${assignmentId}`, "stable"];
        }),
    );

    getTrackedAssignments(assignments).forEach((assignment) => {
        const signal = getAssignmentProgressSignal(assignment);
        getAssignmentSupportUnitKeys(assignment).forEach((key) => {
            const previous = movementBySupportUnit.get(key) || "stable";
            if (signal === "needs-support") {
                movementBySupportUnit.set(key, "needs-support");
                return;
            }
            if (signal === "improved" && previous !== "needs-support") {
                movementBySupportUnit.set(key, "improved");
            }
        });
    });

    let improved = 0;
    let needsSupport = 0;
    let stable = 0;

    movementBySupportUnit.forEach((value) => {
        if (value === "improved") {
            improved += 1;
        } else if (value === "needs-support") {
            needsSupport += 1;
        } else {
            stable += 1;
        }
    });

    return [
        { label: "Improved", detail: `${improved} support units`, accent: "text-emerald-500", icon: ArrowUpRight },
        { label: "Needs Support", detail: `${needsSupport} support units`, accent: "text-rose-500", icon: ArrowDownRight },
        { label: "Stable", detail: `${stable} support units`, accent: "text-sky-500", icon: Minus },
    ];
};

export const buildAnalyticsSummary = (assignments = []) => {
    const trackedAssignments = getTrackedAssignments(assignments);
    const recentCutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
    let recentUpdates = 0;
    const supportUnitsWithProgress = new Set();
    const recentlyUpdatedSupportUnits = new Set();
    const activeSupportUnitCount = trackedAssignments.reduce(
        (total, assignment) => total + getAssignmentSupportUnitCount(assignment),
        0,
    );

    trackedAssignments.forEach((assignment) => {
        const supportUnitKeys = getAssignmentSupportUnitKeys(assignment);

        (assignment.checkIns || []).forEach((checkIn) => {
            if (checkIn?.date) {
                supportUnitKeys.forEach((key) => supportUnitsWithProgress.add(String(key)));
                if (new Date(checkIn.date).getTime() >= recentCutoff) {
                    recentUpdates += supportUnitKeys.length;
                    supportUnitKeys.forEach((key) => recentlyUpdatedSupportUnits.add(String(key)));
                }
            }
        });
    });

    const goalHits = trackedAssignments.reduce(
        (total, assignment) => total + (isAssignmentTargetMet(assignment) ? getAssignmentSupportUnitCount(assignment) : 0),
        0,
    );

    return [
        {
            key: "active-support-units",
            label: "Active support units",
            value: activeSupportUnitCount,
            helper: activeSupportUnitCount ? "Student + subject pairings in scope" : "No active support units in this segment",
        },
        {
            key: "support-units-with-progress",
            label: "Support units with progress",
            value: supportUnitsWithProgress.size,
            helper: supportUnitsWithProgress.size ? "Student-subject units with at least one recorded update" : "No progress updates recorded yet",
        },
        {
            key: "recent-updates",
            label: "Updates in last 30 days",
            value: recentUpdates,
            helper: recentUpdates ? `${recentlyUpdatedSupportUnits.size} support units updated recently` : "No recent progress captured",
        },
        {
            key: "goals-met",
            label: "Goals met",
            value: goalHits,
            helper: goalHits ? "Support units already meeting target" : "No support units have hit the target yet",
        },
    ];
};

export const buildAnalyticsNarrative = (students = [], assignments = []) => {
    const trackedAssignments = getTrackedAssignments(assignments);
    if (!trackedAssignments.length) {
        return {
            title: "All visible support units are currently on universal support",
            body: "No Tier 2 or Tier 3 intervention plans are active in this view, so intervention analytics stay empty until a support plan is created.",
        };
    }

    const highestTier = students
        .map(getStudentTierCode)
        .sort((left, right) => (TIER_PRIORITY[right] || 0) - (TIER_PRIORITY[left] || 0))[0] || "tier1";

    const uniqueTypes = new Set(
        trackedAssignments.flatMap((assignment) =>
            getAssignmentFocusLabels(assignment).map((focus) => getAssignmentTypeMeta(assignment, focus).label),
        ),
    );
    const activeSupportUnitCount = trackedAssignments.reduce(
        (total, assignment) => total + getAssignmentSupportUnitCount(assignment),
        0,
    );

    return {
        title: `${activeSupportUnitCount} active support units across ${uniqueTypes.size} focus areas`,
        body: `The current segment includes intervention activity up to ${TIER_LABELS[highestTier] || "Tier 1"}, with analytics based on live progress updates and assignment outcomes.`,
    };
};

export const hasActiveInterventionData = (assignments = []) => getTrackedAssignments(assignments).length > 0;

export const getActiveInterventionTypes = () => INTERVENTION_TYPES.map((type) => type.label);
