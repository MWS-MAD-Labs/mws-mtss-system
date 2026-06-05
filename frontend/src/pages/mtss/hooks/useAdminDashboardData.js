import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import socketService from "@/services/socketService";
import {
    fetchMentorAssignments,
    fetchMtssStudents,
    fetchMtssMentors,
} from "@/services/mtssService";
import {
    buildAdminStatCards,
    buildSystemSnapshot,
    buildSuccessByType,
    buildTrendData,
    buildMentorSpotlights,
    buildMentorRoster,
    buildStrategyHighlights,
    buildTierMovement,
    buildRecentActivity,
    buildMentorSubjectCoverageRows,
    calculateSuccessRate,
    buildSummaryFromStudents,
    buildAnalyticsSummary,
    buildAnalyticsNarrative,
} from "../utils/adminDashboardUtils";
import { expandStudentsBySupportUnit } from "../utils/supportUnitUtils";
import { resolveTypeKey } from "../utils/interventionNormalize";
import useAdminDashboardSegments from "./useAdminDashboardSegments";

const STUDENT_LIMIT = 650;
const STATUS_LABELS = {
    active: "On Track",
    paused: "Needs Attention",
    completed: "Completed",
    closed: "Closed",
};

const normalizeText = (value = "") => String(value || "").trim();

const getStudentKey = (student = {}) =>
    student?._id?.toString?.() ||
    student?.id?.toString?.() ||
    student?.toString?.() ||
    "";

const normalizeTierCode = (tier = "") => {
    const normalized = normalizeText(tier).toLowerCase().replace(/\s+/g, "");
    if (normalized.includes("3")) return "tier3";
    if (normalized.includes("1")) return "tier1";
    return "tier2";
};

const mapTierLabel = (tier = "") => {
    const code = normalizeTierCode(tier);
    if (code === "tier3") return "Tier 3";
    if (code === "tier1") return "Tier 1";
    return "Tier 2";
};

const getFocusLabel = (assignment = {}) => {
    if (Array.isArray(assignment.focusAreas)) {
        const focus = assignment.focusAreas.find((entry) => normalizeText(entry));
        if (focus) return normalizeText(focus);
    }
    return normalizeText(assignment.strategyName || assignment.metricLabel || assignment.monitoringMethod) || "Focused Support";
};

const getGoalLabel = (assignment = {}) => {
    if (!Array.isArray(assignment.goals)) return "";
    const goal = assignment.goals.find(Boolean);
    if (!goal) return "";
    if (typeof goal === "string") return normalizeText(goal);
    return normalizeText(goal.description || goal.goal || goal.title || goal.name);
};

const getMentorLabel = (assignment = {}) =>
    normalizeText(assignment.mentorId?.name || assignment.mentorName || assignment.mentor || assignment.owner) || "Unassigned";

const buildPairingLabel = (studentName = "", subject = "", mentor = "") =>
    [studentName, subject, mentor].map(normalizeText).filter(Boolean).join(" - ");

const getSupportSubjectLabel = (unit = {}) =>
    normalizeText(unit.supportUnit?.subject || unit.profile?.type || unit.type) || "Focused Support";

const getSupportOwnerLabel = (unit = {}) =>
    normalizeText(
        unit.supportUnit?.owner ||
        unit.studentSubjectMentorPair?.mentorName ||
        unit.profile?.studentSubjectMentorPair?.mentorName ||
        unit.mentor ||
        unit.profile?.mentor,
    ) || "Unassigned";

const buildSubjectStudentBreakdown = (supportUnits = []) => {
    const map = new Map();

    supportUnits.forEach((unit = {}) => {
        const subject = getSupportSubjectLabel(unit);
        const owner = getSupportOwnerLabel(unit);
        const studentId = normalizeText(unit.baseStudentId || unit._id || unit.id || unit.slug || unit.name);
        const studentName = normalizeText(unit.name) || "Student";
        const key = subject.toLowerCase();
        const entry = map.get(key) || {
            subject,
            supportUnitCount: 0,
            students: new Map(),
            owners: new Set(),
            tierCodes: new Set(),
        };

        entry.supportUnitCount += 1;
        entry.students.set(studentId || studentName, {
            id: studentId || studentName,
            name: studentName,
            owner,
            tier: unit.supportUnit?.tier || unit.tier || "Tier 1",
            pairingLabel: unit.supportUnit?.pairingLabel || buildPairingLabel(studentName, subject, owner),
        });
        entry.owners.add(owner);
        entry.tierCodes.add(normalizeTierCode(unit.supportUnit?.tierCode || unit.tier));
        map.set(key, entry);
    });

    return Array.from(map.values())
        .map((entry) => ({
            subject: entry.subject,
            supportUnitCount: entry.supportUnitCount,
            studentCount: entry.students.size,
            owners: Array.from(entry.owners).filter(Boolean).sort((a, b) => a.localeCompare(b)),
            tierCodes: Array.from(entry.tierCodes),
            students: Array.from(entry.students.values()).sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .sort((a, b) => b.supportUnitCount - a.supportUnitCount || a.subject.localeCompare(b.subject));
};

const getLatestCheckIn = (assignment = {}) =>
    Array.isArray(assignment.checkIns) && assignment.checkIns.length
        ? assignment.checkIns[assignment.checkIns.length - 1]
        : null;

const buildAssignmentOptionsByStudent = (assignments = []) => {
    const map = new Map();

    assignments.forEach((assignment = {}) => {
        const assignmentId = assignment._id?.toString?.() || assignment.id || assignment.assignmentId;
        if (!assignmentId) return;

        const focus = getFocusLabel(assignment);
        const focusAreas = Array.isArray(assignment.focusLabels) && assignment.focusLabels.length
            ? assignment.focusLabels
            : (Array.isArray(assignment.focusAreas) && assignment.focusAreas.length ? assignment.focusAreas : [focus]);
        const tierCode = normalizeTierCode(assignment.tier);
        const latestCheckIn = getLatestCheckIn(assignment);
        const lastUpdateAt = latestCheckIn?.date || assignment.updatedAt || assignment.lastPlanUpdatedAt || assignment.createdAt || assignment.startDate;
        const option = {
            assignmentId,
            focus,
            subject: focus,
            type: focus,
            focusArea: focus,
            focusAreas,
            interventionType: focus,
            interventionTypes: focusAreas,
            tier: assignment.tier,
            tierCode,
            tierValue: tierCode,
            tierLabel: mapTierLabel(assignment.tier),
            statusKey: assignment.status || "active",
            status: assignment.status || "active",
            statusLabel: STATUS_LABELS[assignment.status] || assignment.status || "Active",
            strategyId: assignment.strategyId || "",
            strategyName: assignment.strategyName || "",
            metricLabel: assignment.metricLabel || "score",
            mentor: getMentorLabel(assignment),
            mentorName: getMentorLabel(assignment),
            mentorEmail: assignment.mentorId?.email || assignment.mentorEmail || "",
            startDate: assignment.startDate,
            endDate: assignment.endDate,
            duration: assignment.duration,
            monitoringMethod: assignment.monitoringMethod,
            monitoringFrequency: assignment.monitoringFrequency,
            customFrequencyDays: Array.isArray(assignment.customFrequencyDays) ? assignment.customFrequencyDays : [],
            customFrequencyNote: assignment.customFrequencyNote || "",
            baselineScore: assignment.baselineScore,
            targetScore: assignment.targetScore,
            goals: assignment.goals || [],
            goal: getGoalLabel(assignment),
            notes: assignment.notes || "",
            checkIns: assignment.checkIns || [],
            lastUpdateAt,
            lastUpdateSubject: focus,
            nextUpdate: assignment.nextUpdate,
            pairings: Array.isArray(assignment.pairings) ? assignment.pairings : [],
        };

        (assignment.studentIds || []).forEach((student) => {
            const key = getStudentKey(student);
            if (!key) return;
            const existing = map.get(key) || [];
            const studentPairings = option.pairings.filter((pairing = {}) => {
                const pairingStudentKey = getStudentKey(pairing.studentId || pairing.student || pairing.studentId);
                return !pairingStudentKey || pairingStudentKey === key;
            });
            const primaryPairing = studentPairings[0] || null;
            const studentOption = {
                ...option,
                studentName: student?.name || primaryPairing?.studentName || "Student",
                pairings: studentPairings.length ? studentPairings : option.pairings,
                pairingLabel: primaryPairing?.pairingLabel || buildPairingLabel(student?.name, focus, option.mentor),
                studentSubjectMentorPair: primaryPairing || {
                    studentId: key,
                    studentName: student?.name || "Student",
                    subject: focus,
                    focusArea: focus,
                    mentorName: option.mentor,
                    pairingLabel: buildPairingLabel(student?.name, focus, option.mentor),
                },
            };
            existing.push(studentOption);
            map.set(key, existing);
        });
    });

    return map;
};

const attachAssignmentOptionsToStudents = (students = [], assignments = []) => {
    const optionsByStudent = buildAssignmentOptionsByStudent(assignments);

    return students.map((student) => {
        const key = getStudentKey(student);
        const assignmentOptions = (optionsByStudent.get(key) || student.assignmentOptions || [])
            .slice()
            .sort((a, b) => {
                const tierRank = { tier3: 3, tier2: 2, tier1: 1 };
                const rankDiff = (tierRank[b.tierCode] || 0) - (tierRank[a.tierCode] || 0);
                if (rankDiff) return rankDiff;
                return new Date(b.lastUpdateAt || 0) - new Date(a.lastUpdateAt || 0);
            });
        const primary = assignmentOptions[0] || null;
        const assignmentInterventions = assignmentOptions
            .filter((option) => option?.assignmentId)
            .map((option) => {
                const focus = option.focus || option.focusAreas?.[0] || option.strategyName || "Focused Support";
                const tierCode = option.tierCode || normalizeTierCode(option.tierValue || option.tier);
                return {
                    id: option.assignmentId,
                    type: resolveTypeKey(focus) || "SEL",
                    label: focus,
                    tier: option.tier || mapTierLabel(tierCode),
                    tierCode,
                    status: option.statusKey || option.status || "active",
                    strategies: [option.strategyName].filter(Boolean),
                    history: option.history || [],
                    hasData: true,
                };
            });

        return {
            ...student,
            assignmentOptions,
            assignmentId: primary?.assignmentId || student.assignmentId,
            mentor: primary?.mentor || student.mentor,
            profile: {
                ...(student.profile || {}),
                mentor: primary?.mentor || student.profile?.mentor,
            },
            lastUpdate: primary?.lastUpdateAt
                ? {
                    at: primary.lastUpdateAt,
                    subject: primary.lastUpdateSubject || primary.focus,
                }
                : student.lastUpdate,
            interventions: assignmentInterventions.length ? assignmentInterventions : student.interventions,
        };
    });
};

const useAdminDashboardData = () => {
    const { user } = useSelector((state) => state.auth);
    const [students, setStudents] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const {
        effectiveSegments,
        gradeQueryValues,
        classQueryValues,
        withinSegments,
        transformStudent,
        mentorMatchesSegments,
    } = useAdminDashboardSegments(user);
    const mergeStudents = useCallback(
        (incoming = []) => {
            if (!incoming.length) return;
            setStudents((prev) => {
                const map = new Map(prev.map((student) => [student.id || student._id, student]));
                incoming.forEach((student) => {
                    if (!withinSegments(student)) return;
                    const key = student.id || student._id;
                    if (!key) return;
                    const existing = map.get(key) || {};
                    map.set(key, { ...existing, ...transformStudent(student) });
                });
                return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
            });
        },
        [transformStudent, withinSegments],
    );
    const mergeAssignment = useCallback((action, assignment) => {
        if (!assignment?._id) return;
        setAssignments((prev) => {
            const scopedAssignment = (() => {
                const studentList = assignment.studentIds || [];
                if (!studentList.length) return assignment;
                const allowed = studentList.filter((student) => withinSegments(student));
                if (!allowed.length) return null;
                return { ...assignment, studentIds: allowed };
            })();
            if (!scopedAssignment) {
                if (action === "deleted") {
                    return prev.filter((item) => item._id !== assignment._id);
                }
                return prev;
            }
            const index = prev.findIndex((item) => item._id === assignment._id);
            if (action === "deleted") {
                if (index === -1) return prev;
                const clone = [...prev];
                clone.splice(index, 1);
                return clone;
            }
            if (index === -1) {
                return [...prev, scopedAssignment];
            }
            const clone = [...prev];
            clone[index] = scopedAssignment;
            return clone;
        });
    }, [withinSegments]);
    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const mentorParams = {};
            if (effectiveSegments.unit) {
                mentorParams.unit = effectiveSegments.unit;
            }

            const studentParams = { limit: STUDENT_LIMIT };
            if (effectiveSegments.unit) {
                studentParams.unit = effectiveSegments.unit;
            }
            if (gradeQueryValues.length) {
                studentParams.grade = gradeQueryValues.join(",");
            }
            if (classQueryValues.length) {
                studentParams.className = classQueryValues.join(",");
            }
            const [studentResponse, assignmentResponse, mentorResponse] = await Promise.all([
                fetchMtssStudents(studentParams),
                fetchMentorAssignments(),
                fetchMtssMentors(mentorParams),
            ]);

            const roster = studentResponse.students || [];
            const scopedRoster = roster.filter(withinSegments);
            const normalizedRoster = scopedRoster.map(transformStudent);
            const studentIdSet = new Set(
                normalizedRoster
                    .map((student) => student.id?.toString?.() || student._id?.toString?.())
                    .filter(Boolean),
            );

            const scopedAssignments = (assignmentResponse.assignments || []).filter((assignment) => {
                if (!studentIdSet.size) return true;
                return (assignment.studentIds || []).some((student) => {
                    const key = student?._id?.toString?.() || student?.id?.toString?.();
                    return key ? studentIdSet.has(key) : false;
                });
            });

            const allMentors = mentorResponse.mentors || [];
            const scopedMentors = allMentors.filter(mentorMatchesSegments);

            setStudents(normalizedRoster);
            setAssignments(scopedAssignments);
            setMentors(scopedMentors);
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to load MTSS dashboard data");
        } finally {
            setLoading(false);
        }
    }, [classQueryValues, effectiveSegments, gradeQueryValues, mentorMatchesSegments, transformStudent, withinSegments]);
    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);
    useEffect(() => {
        if (!user?.id && !user?._id) return;

        socketService.connect();
        socketService.joinMtssAdmin();

        const handleStudentsChanged = (payload) => {
            mergeStudents(payload?.students || []);
        };

        const handleAssignmentsChanged = ({ action, assignment }) => {
            mergeAssignment(action || "updated", assignment);
        };

        socketService.onMtssStudentsChanged(handleStudentsChanged);
        socketService.onMtssAssignment(handleAssignmentsChanged);

        return () => {
            socketService.offMtssStudentsChanged(handleStudentsChanged);
            socketService.offMtssAssignment(handleAssignmentsChanged);
            socketService.leaveMtssAdmin();
        };
    }, [user, mergeStudents, mergeAssignment]);
    const mentorCount = useMemo(() => {
        if (mentors?.length) return mentors.length;
        const uniqueMentors = new Set(assignments.map((assignment) => assignment.mentorId?._id || assignment.mentorId));
        return uniqueMentors.size;
    }, [mentors, assignments]);

    const successRate = useMemo(() => calculateSuccessRate(assignments), [assignments]);
    const enrichedStudents = useMemo(
        () => attachAssignmentOptionsToStudents(students, assignments),
        [students, assignments],
    );
    const supportUnits = useMemo(() => expandStudentsBySupportUnit(enrichedStudents), [enrichedStudents]);
    const supportUnitCount = useMemo(
        () => supportUnits.length,
        [supportUnits.length],
    );

    const statCards = useMemo(
        () => buildAdminStatCards(supportUnitCount, mentorCount, successRate),
        [supportUnitCount, mentorCount, successRate],
    );

    const summary = useMemo(() => buildSummaryFromStudents(supportUnits), [supportUnits]);
    const systemSnapshot = useMemo(() => buildSystemSnapshot(summary, supportUnits), [summary, supportUnits]);
    const successByType = useMemo(() => buildSuccessByType(assignments), [assignments]);
    const { trendData, trendPaths } = useMemo(() => buildTrendData(assignments), [assignments]);
    const mentorSpotlights = useMemo(() => buildMentorSpotlights(assignments), [assignments]);
    const mentorRoster = useMemo(() => buildMentorRoster(assignments), [assignments]);
    const mentorSubjectCoverageRows = useMemo(() => buildMentorSubjectCoverageRows(assignments), [assignments]);
    const subjectStudentBreakdown = useMemo(() => buildSubjectStudentBreakdown(supportUnits), [supportUnits]);
    const strategyHighlights = useMemo(() => buildStrategyHighlights(assignments), [assignments]);
    const tierMovement = useMemo(() => buildTierMovement(supportUnits, assignments), [supportUnits, assignments]);
    const analyticsSummary = useMemo(() => buildAnalyticsSummary(assignments), [assignments]);
    const analyticsNarrative = useMemo(() => buildAnalyticsNarrative(supportUnits, assignments), [supportUnits, assignments]);
    const recentActivity = useMemo(() => buildRecentActivity(assignments), [assignments]);

    return {
        students: enrichedStudents,
        supportUnits,
        assignments,
        mentors,
        statCards,
        systemSnapshot,
        successByType,
        trendData,
        trendPaths,
        analyticsSummary,
        analyticsNarrative,
        mentorSpotlights,
        mentorRoster,
        mentorSubjectCoverageRows,
        subjectStudentBreakdown,
        strategyHighlights,
        tierMovement,
        recentActivity,
        loading,
        error,
        refresh: loadDashboard,
    };
};

export default useAdminDashboardData;
