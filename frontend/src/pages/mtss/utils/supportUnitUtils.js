import { resolveTypeKey } from "./interventionNormalize";

const TIER_CODE_MAP = {
    "tier 3": "tier3",
    tier3: "tier3",
    "3": "tier3",
    "tier 2": "tier2",
    tier2: "tier2",
    "2": "tier2",
    "tier 1": "tier1",
    tier1: "tier1",
    "1": "tier1",
};

const normalizeText = (value = "") => String(value || "").trim();
const normalizeKey = (value = "") => normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const buildPairingLabel = (studentName = "", subject = "", mentor = "") =>
    [studentName, subject, mentor].map(normalizeText).filter(Boolean).join(" - ");

const normalizeTierCode = (value = "") => {
    const normalized = normalizeText(value).toLowerCase().replace(/\s+/g, " ");
    return TIER_CODE_MAP[normalized] || normalized.replace(/\s+/g, "");
};

const getFocusLabel = (assignment = {}) =>
    normalizeText(assignment.focus)
    || normalizeText(assignment.subject)
    || (Array.isArray(assignment.focusAreas) ? normalizeText(assignment.focusAreas.find(Boolean)) : "")
    || normalizeText(assignment.focusArea)
    || normalizeText(assignment.label)
    || normalizeText(assignment.strategyName)
    || "Focused Support";

const getFocusLabels = (assignment = {}) => {
    const labels = Array.isArray(assignment.focusLabels) && assignment.focusLabels.length
        ? assignment.focusLabels.map(normalizeText).filter(Boolean)
        : Array.isArray(assignment.focusAreas)
        ? assignment.focusAreas.map(normalizeText).filter(Boolean)
        : [];
    if (!labels.length) labels.push(getFocusLabel(assignment));
    return Array.from(new Set(labels));
};

export const getAssignmentStudentKeys = (assignment = {}) =>
    (assignment.studentIds || [])
        .map((student) => student?._id || student?.id || student)
        .filter(Boolean)
        .map(String);

export const getAssignmentFocusLabels = (assignment = {}) => getFocusLabels(assignment);

export const getAssignmentSupportUnitCount = (assignment = {}) =>
    Math.max(getAssignmentStudentKeys(assignment).length, 1) * Math.max(getAssignmentFocusLabels(assignment).length, 1);

export const getAssignmentSupportUnitKeys = (assignment = {}) => {
    const assignmentId = String(assignment._id || assignment.id || assignment.assignmentId || assignment.createdAt || assignment.strategyName || "assignment");
    const studentKeys = getAssignmentStudentKeys(assignment);
    const focusLabels = getAssignmentFocusLabels(assignment);
    const scopedStudentKeys = studentKeys.length ? studentKeys : ["unassigned"];

    return scopedStudentKeys.flatMap((studentKey) =>
        focusLabels.map((focus, focusIndex) => {
            const focusKey = normalizeKey(focus) || `focus-${focusIndex}`;
            return `${studentKey}:${assignmentId}:${focusKey}`;
        }),
    );
};

const getOwnerLabel = (assignment = {}, student = {}) =>
    normalizeText(assignment.studentSubjectMentorPair?.mentorName)
    || normalizeText(assignment.mentor)
    || normalizeText(assignment.mentorName)
    || normalizeText(assignment.owner)
    || normalizeText(student.mentor)
    || normalizeText(student.profile?.mentor)
    || "Unassigned";

const getStudentKey = (student = {}) =>
    normalizeText(student.baseStudentId || student._id || student.id || student.studentId);

const findAssignmentPairing = (assignment = {}, student = {}, focus = "") => {
    const pairings = Array.isArray(assignment.pairings) ? assignment.pairings : [];
    if (!pairings.length) return assignment.studentSubjectMentorPair || null;

    const studentKey = getStudentKey(student);
    const focusKey = normalizeKey(focus);
    return pairings.find((pairing = {}) => {
        const pairingStudentKey = normalizeText(pairing.studentId || pairing.student?._id || pairing.student?.id);
        const pairingFocusKey = normalizeKey(pairing.subject || pairing.focusArea);
        return (!studentKey || !pairingStudentKey || pairingStudentKey === studentKey)
            && (!focusKey || !pairingFocusKey || pairingFocusKey === focusKey);
    }) || null;
};

const getScoreLabel = (score, fallbackUnit = "") => {
    if (score === null || score === undefined || score === "") return "Not set";
    if (typeof score === "number" || typeof score === "string") {
        const value = normalizeText(score);
        return value ? `${value}${fallbackUnit ? ` ${fallbackUnit}` : ""}` : "Not set";
    }
    const value = score.value ?? score.score ?? score.amount;
    if (value === null || value === undefined || value === "") return "Not set";
    const unit = score.unit || fallbackUnit;
    return `${value}${unit ? ` ${unit}` : ""}`;
};

const getGoalLabel = (assignment = {}) => {
    if (normalizeText(assignment.goal)) return normalizeText(assignment.goal);
    if (normalizeText(assignment.goals)) return normalizeText(assignment.goals);
    if (!Array.isArray(assignment.goals)) return "Not set";

    const goalEntry = assignment.goals.find(Boolean);
    if (!goalEntry) return "Not set";
    if (typeof goalEntry === "string") return normalizeText(goalEntry) || "Not set";
    return normalizeText(goalEntry.description || goalEntry.goal || goalEntry.title || goalEntry.name) || "Not set";
};

const buildSupportIntervention = (assignment = {}, focusOverride = "") => {
    const focus = normalizeText(focusOverride) || getFocusLabel(assignment);
    const typeKey = resolveTypeKey(focus) || "SEL";
    const tierCode = normalizeTierCode(assignment.tierCode || assignment.tierValue || assignment.tier) || "tier2";
    return {
        id: assignment.assignmentId,
        type: typeKey,
        label: focus,
        tier: assignment.tier || (tierCode === "tier3" ? "Tier 3" : tierCode === "tier2" ? "Tier 2" : "Tier 1"),
        tierCode,
        status: assignment.statusLabel || assignment.statusKey || assignment.status || "active",
        hasData: true,
        strategies: [assignment.strategyName].filter(Boolean),
    };
};

export const buildStudentSupportUnit = (student = {}, assignment = {}, index = 0, focusOverride = "", focusIndex = 0) => {
    const baseId = student.baseStudentId || student.id || student._id || student.slug || student.name;
    const assignmentId = assignment.assignmentId || assignment.id || `unit-${index}`;
    const focus = normalizeText(focusOverride) || getFocusLabel(assignment);
    const focusKey = normalizeKey(focus) || `focus-${focusIndex}`;
    const scopedAssignment = {
        ...assignment,
        focus,
        subject: focus,
        focusArea: focus,
        focusAreas: [focus],
    };
    const pairing = findAssignmentPairing(assignment, student, focus);
    const owner = normalizeText(pairing?.mentorName) || getOwnerLabel(scopedAssignment, student);
    const pairingLabel = normalizeText(pairing?.pairingLabel)
        || buildPairingLabel(student.name, focus, owner);
    const studentSubjectMentorPair = {
        ...(pairing || {}),
        studentId: pairing?.studentId || student._id || student.id || student.baseStudentId || null,
        studentName: pairing?.studentName || student.name || "Student",
        subject: pairing?.subject || focus,
        focusArea: pairing?.focusArea || focus,
        mentorName: owner,
        pairingLabel,
    };
    const scopedPairingAssignment = {
        ...scopedAssignment,
        mentor: owner,
        mentorName: owner,
        pairingLabel,
        studentSubjectMentorPair,
        pairings: [studentSubjectMentorPair],
    };
    const metricUnit = assignment.metricLabel || student.profile?.progressUnit || "score";
    const intervention = buildSupportIntervention(scopedPairingAssignment, focus);

    return {
        ...student,
        id: `${baseId}:${assignmentId}:${focusKey}`,
        baseStudentId: baseId,
        assignmentId,
        assignmentOptions: [scopedPairingAssignment],
        supportUnit: {
            assignmentId,
            subject: focus,
            focusKey,
            owner,
            pairingLabel,
            studentSubjectMentorPair,
            tier: intervention.tier,
            tierCode: intervention.tierCode,
            status: scopedPairingAssignment.statusLabel || scopedPairingAssignment.statusKey || scopedPairingAssignment.status || "active",
            goal: getGoalLabel(scopedPairingAssignment),
            baseline: getScoreLabel(scopedPairingAssignment.baselineScore, metricUnit),
        },
        pairingLabel,
        studentSubjectMentorPair,
        type: focus,
        tier: intervention.tier,
        progress: scopedPairingAssignment.statusLabel || student.progress,
        mentor: owner,
        nextUpdate: scopedPairingAssignment.nextUpdate || student.nextUpdate,
        lastUpdate: scopedPairingAssignment.lastUpdateAt
            ? {
                at: scopedPairingAssignment.lastUpdateAt,
                subject: scopedPairingAssignment.lastUpdateSubject || focus,
            }
            : student.lastUpdate,
        interventions: [intervention],
        profile: {
            ...(student.profile || {}),
            type: focus,
            mentor: owner,
            pairingLabel,
            studentSubjectMentorPair,
            strategy: scopedPairingAssignment.strategyName || student.profile?.strategy,
            baseline: scopedPairingAssignment.baselineScore?.value ?? student.profile?.baseline,
            target: scopedPairingAssignment.targetScore?.value ?? student.profile?.target,
            progressUnit: metricUnit,
            chart: scopedPairingAssignment.chart || student.profile?.chart,
            history: scopedPairingAssignment.history || student.profile?.history,
        },
    };
};

export const expandStudentsBySupportUnit = (students = []) =>
    (Array.isArray(students) ? students : []).flatMap((student) => {
        const assignmentOptions = Array.isArray(student.assignmentOptions)
            ? student.assignmentOptions.filter((assignment) => assignment?.assignmentId)
            : [];

        if (!assignmentOptions.length) return [student];
        return assignmentOptions.flatMap((assignment, index) =>
            getFocusLabels(assignment).map((focus, focusIndex) =>
                buildStudentSupportUnit(student, assignment, index, focus, focusIndex),
            ),
        );
    });
