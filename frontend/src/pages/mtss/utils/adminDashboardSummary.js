import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { INTERVENTION_TYPES, TIER_LABELS, TIER_PRIORITY, TYPE_LOOKUP } from "./interventionConstants";
import { resolveTypeKey, normalizeTierCode } from "./interventionNormalize";
import { ensureStudentInterventions, pickPrimaryIntervention } from "./interventionSelection";
import { isAssignmentTargetMet } from "./adminDashboardStats";

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

const getAssignmentTypeMeta = (assignment = {}) => {
    const focusLabel = Array.isArray(assignment.focusAreas)
        ? assignment.focusAreas.find(Boolean)
        : assignment.focusAreas;
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
        : [{ label: "Tier 1", count: fallbackTotal, description: `${fallbackTotal} students` }];

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
            description: `${count} students`,
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
        const { label } = getAssignmentTypeMeta(assignment);
        const bucket = grouped[label] || { total: 0, success: 0 };
        bucket.total += 1;
        if (isAssignmentTargetMet(assignment)) {
            bucket.success += 1;
        }
        grouped[label] = bucket;
    });

    return Object.entries(grouped)
        .map(([label, value], index) => ({
            label,
            value: value.total ? Math.round((value.success / value.total) * 100) : 0,
            detail: `${value.success}/${value.total} plans on track or completed`,
            gradient: gradients[index % gradients.length],
        }))
        .sort((left, right) => right.value - left.value);
};

export const buildStrategyHighlights = (assignments = []) => {
    const counts = {};
    getTrackedAssignments(assignments).forEach((assignment) => {
        (assignment.focusAreas || []).forEach((area) => {
            counts[area] = (counts[area] || 0) + 1;
        });
    });

    return Object.entries(counts)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 4)
        .map(([label, count]) => ({
            label,
            value: `${count} active`,
        }));
};

export const buildTierMovement = (students = [], assignments = []) => {
    if (!students.length) {
        return [
            { label: "Improved", detail: "0 students", accent: "text-emerald-500", icon: ArrowUpRight },
            { label: "Needs Support", detail: "0 students", accent: "text-rose-500", icon: ArrowDownRight },
            { label: "Stable", detail: "0 students", accent: "text-sky-500", icon: Minus },
        ];
    }

    const movementByStudent = new Map(
        students.map((student) => [student.id || student._id, "stable"]),
    );

    getTrackedAssignments(assignments).forEach((assignment) => {
        const signal = getAssignmentProgressSignal(assignment);
        (assignment.studentIds || []).forEach((student) => {
            const key = student?._id || student?.id || student;
            if (!key) return;
            const previous = movementByStudent.get(key) || "stable";
            if (signal === "needs-support") {
                movementByStudent.set(key, "needs-support");
                return;
            }
            if (signal === "improved" && previous !== "needs-support") {
                movementByStudent.set(key, "improved");
            }
        });
    });

    let improved = 0;
    let needsSupport = 0;
    let stable = 0;

    movementByStudent.forEach((value) => {
        if (value === "improved") {
            improved += 1;
        } else if (value === "needs-support") {
            needsSupport += 1;
        } else {
            stable += 1;
        }
    });

    return [
        { label: "Improved", detail: `${improved} students`, accent: "text-emerald-500", icon: ArrowUpRight },
        { label: "Needs Support", detail: `${needsSupport} students`, accent: "text-rose-500", icon: ArrowDownRight },
        { label: "Stable", detail: `${stable} students`, accent: "text-sky-500", icon: Minus },
    ];
};

export const buildAnalyticsSummary = (assignments = []) => {
    const trackedAssignments = getTrackedAssignments(assignments);
    const recentCutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
    let recentUpdates = 0;
    const studentsWithProgress = new Set();
    const recentlyUpdatedStudents = new Set();

    trackedAssignments.forEach((assignment) => {
        const studentKeys = (assignment.studentIds || [])
            .map((student) => student?._id || student?.id || student)
            .filter(Boolean);

        (assignment.checkIns || []).forEach((checkIn) => {
            if (checkIn?.date) {
                studentKeys.forEach((key) => studentsWithProgress.add(String(key)));
                if (new Date(checkIn.date).getTime() >= recentCutoff) {
                    recentUpdates += 1;
                    studentKeys.forEach((key) => recentlyUpdatedStudents.add(String(key)));
                }
            }
        });
    });

    const goalHits = trackedAssignments.filter(isAssignmentTargetMet).length;

    return [
        {
            key: "active-plans",
            label: "Active plans",
            value: trackedAssignments.length,
            helper: trackedAssignments.length ? "Tier 2 / Tier 3 plans in scope" : "No active plans in this segment",
        },
        {
            key: "students-with-progress",
            label: "Students with progress",
            value: studentsWithProgress.size,
            helper: studentsWithProgress.size ? "Students with at least one recorded update" : "No progress updates recorded yet",
        },
        {
            key: "recent-updates",
            label: "Updates in last 30 days",
            value: recentUpdates,
            helper: recentUpdates ? `${recentlyUpdatedStudents.size} students updated recently` : "No recent progress captured",
        },
        {
            key: "goals-met",
            label: "Goals met",
            value: goalHits,
            helper: goalHits ? "Assignments already meeting target" : "No plans have hit the target yet",
        },
    ];
};

export const buildAnalyticsNarrative = (students = [], assignments = []) => {
    const trackedAssignments = getTrackedAssignments(assignments);
    if (!trackedAssignments.length) {
        return {
            title: "All visible students are currently on universal support",
            body: "No Tier 2 or Tier 3 intervention plans are active in this view, so intervention analytics stay empty until a support plan is created.",
        };
    }

    const highestTier = students
        .map(getStudentTierCode)
        .sort((left, right) => (TIER_PRIORITY[right] || 0) - (TIER_PRIORITY[left] || 0))[0] || "tier1";

    const uniqueTypes = new Set(
        trackedAssignments.map((assignment) => getAssignmentTypeMeta(assignment).label),
    );

    return {
        title: `${trackedAssignments.length} active intervention plans across ${uniqueTypes.size} focus areas`,
        body: `The current segment includes intervention activity up to ${TIER_LABELS[highestTier] || "Tier 1"}, with analytics based on live progress updates and assignment outcomes.`,
    };
};

export const hasActiveInterventionData = (assignments = []) => getTrackedAssignments(assignments).length > 0;

export const getActiveInterventionTypes = () => INTERVENTION_TYPES.map((type) => type.label);
