/**
 * Assignment to Student mapping utilities
 */

import { normalizeGradeLabel } from "./teacherGradeUtils";
import { formatDate, slugify } from "./teacherCommonUtils";
import { STATUS_LABELS, STATUS_PRIORITY, TIER_PRIORITY } from "./teacherMappingConstants";
import {
    mapTierLabel,
    normalizeTierCode,
    deriveFocus,
    inferProgressUnit,
    formatDuration,
    inferNextUpdate,
    isUpdateDue,
} from "./teacherMappingHelpers";
import { buildChartSeries, buildHistory } from "./teacherMappingCharts";
import { mergeRosterWithAssignments } from "./teacherRosterMerge";

const normalizeText = (value = "") => String(value || "").trim();
const buildPairingLabel = (studentName = "", subject = "", mentorName = "") =>
    [studentName, subject, mentorName].map(normalizeText).filter(Boolean).join(" - ");

export const mapAssignmentsToStudents = (assignments = [], teacherName = "MTSS Mentor") => {
    const map = new Map();
    const assignmentOptionsMap = new Map();
    assignments.forEach((assignment) => {
        const focus = deriveFocus(assignment);
        const tier = mapTierLabel(assignment.tier);
        const tierCode = normalizeTierCode(assignment.tier) || "tier2";
        const statusKey = assignment.status || "active";
        const nextUpdate = inferNextUpdate(assignment);
        const chart = buildChartSeries(assignment);
        const history = buildHistory(assignment);
        const goals = Array.isArray(assignment.goals) ? assignment.goals : [];
        const completedGoals = goals.filter((goal) => goal?.completed).length;
        const goalEntry = goals.find((goal) => goal);
        const goalDescription =
            assignment.goal ||
            (typeof assignment.goals === "string" ? assignment.goals : null) ||
            (typeof goalEntry === "string" ? goalEntry : null) ||
            goalEntry?.description ||
            goalEntry?.goal ||
            goalEntry?.title ||
            goalEntry?.name ||
            null;
        const strategyName =
            assignment.strategyName ||
            assignment.strategy?.name ||
            assignment.strategy?.label ||
            assignment.strategy?.title ||
            null;
        const lastUpdateAt = assignment.updatedAt || assignment.lastPlanUpdatedAt || assignment.createdAt || assignment.startDate || null;
        const duration = assignment.duration || formatDuration(assignment.startDate, assignment.endDate);
        const monitoringFrequency = assignment.monitoringFrequency || assignment.monitorFrequency || null;
        const monitoringMethod = assignment.monitoringMethod || assignment.monitorMethod || null;
        const assignmentId = assignment._id?.toString?.() || assignment.id || assignment.assignmentId || null;
        const mentorName = assignment.mentorId?.name || assignment.mentorName || teacherName;

        (assignment.studentIds || []).forEach((student) => {
            const id = student?._id?.toString?.() || student?.id || student;
            if (!id) return;
            const studentPairings = Array.isArray(assignment.pairings)
                ? assignment.pairings.filter((pairing = {}) => {
                    const pairingStudentId = pairing.studentId?.toString?.() || pairing.studentId || null;
                    return !pairingStudentId || pairingStudentId === id;
                })
                : [];
            const primaryPairing = studentPairings[0] || null;
            const pairingLabel = primaryPairing?.pairingLabel || buildPairingLabel(student?.name || "Student", focus, mentorName);
            if (assignmentId) {
                const existingOptions = assignmentOptionsMap.get(id) || [];
                if (!existingOptions.some((option) => option.assignmentId === assignmentId)) {
                    assignmentOptionsMap.set(id, [
                        ...existingOptions,
                        {
                            assignmentId,
                            focus,
                            focusAreas: Array.isArray(assignment.focusAreas) ? assignment.focusAreas : [],
                            tier,
                            tierCode,
                            tierValue: assignment.tier || tierCode,
                            statusKey,
                            statusLabel: STATUS_LABELS[statusKey] || "On Track",
                            startDate: assignment.startDate || null,
                            endDate: assignment.endDate || null,
                            nextUpdate,
                            metricLabel: assignment.metricLabel || null,
                            strategyId: assignment.strategyId?.toString?.() || assignment.strategyId || null,
                            strategyName,
                            mode: "quantitative",
                            duration,
                            monitoringFrequency,
                            monitoringMethod,
                            customFrequencyDays: Array.isArray(assignment.customFrequencyDays) ? assignment.customFrequencyDays : [],
                            customFrequencyNote: assignment.customFrequencyNote || null,
                            goal: goalDescription,
                            goals: Array.isArray(assignment.goals) ? assignment.goals : [],
                            history,
                            chart,
                            weeklyFocusOverview: assignment.weeklyFocusOverview || null,
                            baselineScore: assignment.baselineScore || null,
                            targetScore: assignment.targetScore || null,
                            notes: assignment.notes || null,
                            mentor: mentorName,
                            mentorNickname: assignment.mentorId?.username || null,
                            mentorEmail: assignment.mentorId?.email || assignment.mentorEmail || null,
                            pairings: studentPairings.length ? studentPairings : assignment.pairings || [],
                            pairingLabel,
                            studentSubjectMentorPair: primaryPairing || {
                                studentId: id,
                                studentName: student?.name || "Student",
                                subject: focus,
                                focusArea: focus,
                                mentorName,
                                pairingLabel,
                            },
                            createdAt: assignment.createdAt || assignment.startDate || null,
                            updatedAt: assignment.updatedAt || null,
                            lastUpdateAt,
                            lastUpdateSubject: focus || strategyName || null,
                            planChangeLog: Array.isArray(assignment.planChangeLog)
                                ? assignment.planChangeLog.map((entry) => ({
                                    ...entry,
                                    changedByName: entry?.changedByName || entry?.changedBy?.name || entry?.changedBy?.username || null,
                                    changedByEmail: entry?.changedByEmail || entry?.changedBy?.email || null,
                                }))
                                : [],
                            viewerPermissions: assignment.viewerPermissions || null,
                            viewerCanEditPlan:
                                typeof assignment.viewerCanEditPlan === "boolean"
                                    ? assignment.viewerCanEditPlan
                                    : undefined,
                            viewerCanSubmitProgress:
                                typeof assignment.viewerCanSubmitProgress === "boolean"
                                    ? assignment.viewerCanSubmitProgress
                                    : undefined,
                            lastPlanUpdatedAt: assignment.lastPlanUpdatedAt || assignment.updatedAt || null,
                            lastPlanUpdatedByName:
                                assignment.lastPlanUpdatedBy?.name ||
                                assignment.lastPlanUpdatedBy?.username ||
                                assignment.createdBy?.name ||
                                assignment.mentorId?.name ||
                                assignment.mentorName ||
                                null,
                        },
                    ]);
                }
            }
            const grade = normalizeGradeLabel(
                student?.currentGrade || student?.classes?.[0]?.grade || student?.unit || student?.class || "-",
            );
            const progressUnit = inferProgressUnit(assignment, student);
            const record = {
                id,
                assignmentId,
                slug: student?.slug || slugify(student?.name),
                name: student?.name || "Student",
                grade,
                type: focus,
                tier,
                progress: STATUS_LABELS[statusKey] || "On Track",
                nextUpdate,
                statusKey,
                profile: {
                    teacher: teacherName,
                    mentor: mentorName,
                    pairingLabel,
                    studentSubjectMentorPair: primaryPairing || {
                        studentId: id,
                        studentName: student?.name || "Student",
                        subject: focus,
                        focusArea: focus,
                        mentorName,
                        pairingLabel,
                    },
                    type: focus,
                    strategy: strategyName || assignment.focusAreas?.join(", ") || `Support focus - ${tier}`,
                    started: formatDate(assignment.startDate),
                    duration: formatDuration(assignment.startDate, assignment.endDate),
                    baseline: (() => {
                        const bs = assignment.baselineScore?.value;
                        if (bs != null) return Number(bs);
                        return goals.length ? 0 : null;
                    })(),
                    current: (() => {
                        const lastCi = assignment.checkIns?.slice(-1)[0];
                        if (lastCi?.value != null) return Number(lastCi.value);
                        return goals.length ? completedGoals : (assignment.checkIns?.length || (statusKey === "completed" ? 1 : 0));
                    })(),
                    target: (() => {
                        const ts = assignment.targetScore?.value;
                        if (ts != null) return Number(ts);
                        return goals.length ? goals.length : Math.max(assignment.checkIns?.length || 1, 1);
                    })(),
                    progressUnit,
                    mode: "quantitative",
                    weeklyFocusOverview: assignment.weeklyFocusOverview || null,
                    chart,
                    history,
                },
            };

            const current = map.get(id);
            if (!current || STATUS_PRIORITY[statusKey] > STATUS_PRIORITY[current.statusKey]) {
                map.set(id, record);
            }
        });
    });

    const students = Array.from(map.values()).map((student) => {
        const options = assignmentOptionsMap.get(student.id) || [];
        const sortedOptions = [...options].sort((a, b) => {
            const tierDiff = (TIER_PRIORITY[b.tierCode] || 0) - (TIER_PRIORITY[a.tierCode] || 0);
            if (tierDiff !== 0) return tierDiff;
            return (STATUS_PRIORITY[b.statusKey] || 0) - (STATUS_PRIORITY[a.statusKey] || 0);
        });
        const latestUpdate = [...options]
            .filter((option) => option?.lastUpdateAt)
            .sort((a, b) => new Date(b.lastUpdateAt).getTime() - new Date(a.lastUpdateAt).getTime())[0] || null;
        return {
            ...student,
            assignmentOptions: sortedOptions,
            lastUpdate: latestUpdate
                ? {
                    at: latestUpdate.lastUpdateAt,
                    subject: latestUpdate.lastUpdateSubject || latestUpdate.focus || null,
                }
                : null,
        };
    });
    const sorted = students.sort((a, b) => STATUS_PRIORITY[b.statusKey] - STATUS_PRIORITY[a.statusKey]);
    const spotlightChart = sorted[0]?.profile?.chart || [];
    const focusLabel = sorted[0] ? `${sorted[0].tier} ${sorted[0].type}` : null;

    return {
        students: sorted.map((student) => {
            const clone = { ...student };
            delete clone.statusKey;
            return clone;
        }),
        spotlightChart,
        focusLabel,
    };
};

export { mergeRosterWithAssignments, STATUS_LABELS, STATUS_PRIORITY, isUpdateDue, buildChartSeries, buildHistory };
