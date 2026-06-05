import { ensureStudentInterventions, pickPrimaryIntervention } from "./interventionUtils";
import { formatDate } from "./teacherCommonUtils";
import { formatMentorDisplay } from "./mentorNameUtils";

const hasValue = (value) => value !== null && value !== undefined && value !== "";

const resolveGoalLabel = (intervention) => {
    if (!intervention) return null;
    if (hasValue(intervention.goal)) return intervention.goal;

    const goals = intervention.goals;
    if (typeof goals === "string") return goals;
    if (!Array.isArray(goals) || goals.length === 0) return null;

    const entry = goals.find((goal) => goal);
    if (!entry) return null;
    if (typeof entry === "string") return entry;
    return entry.description || entry.goal || entry.title || entry.name || null;
};

const buildMergedInterventions = (student) => {
    const { interventionDetails = [] } = student;
    const allInterventions = ensureStudentInterventions(student.interventions);

    const merged = allInterventions.map((intervention) => {
        const detail = interventionDetails.find((item) =>
            item.type?.toUpperCase() === intervention.type?.toUpperCase(),
        );

        if (detail) {
            return { ...detail, hasRealData: true, type: intervention.type };
        }

        return {
            id: `default-${intervention.type}`,
            type: intervention.type,
            label: intervention.label,
            tier: intervention.tierCode || "tier1",
            tierLabel: intervention.tier || "Tier 1",
            status: intervention.status || "monitoring",
            strategyName: intervention.strategies?.[0] || null,
            baseline: null,
            current: null,
            target: null,
            progressUnit: "pts",
            progress: 0,
            checkInsCount: 0,
            chart: [],
            history: [],
            hasRealData: false,
        };
    });
    const mergedDetailIds = new Set(merged.map((intervention) => intervention.id).filter(Boolean));
    const detailOnlyInterventions = interventionDetails
        .filter((detail) => detail?.id && !mergedDetailIds.has(detail.id))
        .map((detail) => ({ ...detail, hasRealData: true }));

    return [...merged, ...detailOnlyInterventions];
};

const buildAttendanceContext = (interventions = []) => {
    const histories = interventions.flatMap((intervention) =>
        (Array.isArray(intervention.history) ? intervention.history : []).map((entry) => ({
            ...entry,
            interventionLabel: intervention.label || intervention.focusArea || intervention.type,
        })),
    );
    const absenceEntries = histories
        .filter((entry) => entry.performed === false && entry.skipReason === "student_absent")
        .sort((left, right) => new Date(right.timestamp || right.date || 0) - new Date(left.timestamp || left.date || 0));
    const attendanceIntervention = interventions.find((intervention) =>
        /attendance|absence|present/i.test(`${intervention.label || ""} ${intervention.focusArea || ""} ${intervention.type || ""}`),
    );
    const rateValue = attendanceIntervention?.current ?? attendanceIntervention?.baseline;
    const unit = attendanceIntervention?.progressUnit || "%";
    const lastAbsenceRaw = absenceEntries[0]?.timestamp || absenceEntries[0]?.date || null;
    const lastAbsenceDate = lastAbsenceRaw
        ? formatDate(lastAbsenceRaw, { month: "short", day: "numeric", year: "numeric" })
        : "No absence logged";

    return {
        rate: hasValue(rateValue) ? `${rateValue}${unit === "%" ? "%" : ` ${unit}`}` : "Not recorded",
        missedMtssSessions: absenceEntries.length,
        lastAbsenceDate,
        lastAbsenceSubject: absenceEntries[0]?.interventionLabel || null,
    };
};

export const buildStudentProfileView = (student, selectedIntervention) => {
    if (!student) {
        return {
            profile: {},
            highlight: null,
            sortedInterventions: [],
            currentIntervention: null,
            strategyLabel: null,
            durationLabel: null,
            frequencyLabel: null,
            mentorLabel: null,
            pairingLabel: null,
            studentSubjectMentorPair: null,
            goalLabel: null,
            monitoringMethodLabel: null,
            startDateLabel: null,
            notesLabel: null,
            isKindergartenQualitative: false,
        };
    }

    const { profile = {} } = student;
    const mergedInterventions = buildMergedInterventions(student);
    const attendanceContext = buildAttendanceContext(mergedInterventions);

    const sortedInterventions = [...mergedInterventions].sort((a, b) => {
        const tierOrder = { tier3: 0, tier2: 1, tier1: 2 };
        const aTier = a.tier?.toLowerCase() || "tier1";
        const bTier = b.tier?.toLowerCase() || "tier1";
        return (tierOrder[aTier] ?? 2) - (tierOrder[bTier] ?? 2);
    });

    const allInterventions = ensureStudentInterventions(student.interventions);
    const escalatedInterventions = sortedInterventions.filter((item) => item.tier === "tier2" || item.tier === "tier3");
    const defaultSelected = escalatedInterventions[0] || sortedInterventions[0] || null;
    const currentIntervention = selectedIntervention || defaultSelected;
    const highlight = pickPrimaryIntervention(allInterventions);

    const strategyLabel = currentIntervention?.strategyName || currentIntervention?.focusArea || null;
    const durationLabel = currentIntervention?.duration || null;
    let frequencyLabel = currentIntervention?.monitoringFrequency || null;
    if (frequencyLabel === "Custom" && Array.isArray(currentIntervention?.customFrequencyDays) && currentIntervention.customFrequencyDays.length > 0) {
        const dayAbbr = currentIntervention.customFrequencyDays.map((d) => d.slice(0, 3));
        frequencyLabel = `Custom — ${dayAbbr.join(", ")}`;
    }
    const mentorLabel = formatMentorDisplay({
        name: currentIntervention?.mentor || profile?.mentor || student.mentor,
        nickname: currentIntervention?.mentorNickname || profile?.mentorNickname || student.mentorNickname,
        username: currentIntervention?.mentorUsername || profile?.mentorUsername || student.mentorUsername,
        gender: currentIntervention?.mentorGender || profile?.mentorGender || student.mentorGender,
    });
    const pairingSubject = currentIntervention?.studentSubjectMentorPair?.subject
        || currentIntervention?.focusArea
        || currentIntervention?.label
        || currentIntervention?.type
        || null;
    const pairingLabel = currentIntervention?.pairingLabel
        || currentIntervention?.studentSubjectMentorPair?.pairingLabel
        || [student.name, pairingSubject, mentorLabel].filter(Boolean).join(" - ");
    const goalLabel = resolveGoalLabel(currentIntervention) || null;
    const monitoringMethodLabel = currentIntervention?.monitoringMethod || currentIntervention?.monitorMethod || null;
    const startDateLabel = currentIntervention?.startDate
        ? formatDate(currentIntervention.startDate, { month: "short", day: "numeric", year: "numeric" })
        : null;
    const notesLabel = hasValue(currentIntervention?.notes) ? currentIntervention.notes : null;

    return {
            profile: {
                ...profile,
                attendanceContext,
            },
        highlight,
        sortedInterventions,
        currentIntervention,
        strategyLabel,
        durationLabel,
        frequencyLabel,
        mentorLabel,
        pairingLabel,
        studentSubjectMentorPair: currentIntervention?.studentSubjectMentorPair || null,
        goalLabel,
        monitoringMethodLabel,
        startDateLabel,
        notesLabel,
        isKindergartenQualitative: false,
    };
};
