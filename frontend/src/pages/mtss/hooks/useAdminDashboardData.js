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
    calculateSuccessRate,
    buildSummaryFromStudents,
    buildAnalyticsSummary,
    buildAnalyticsNarrative,
} from "../utils/adminDashboardUtils";
import useAdminDashboardSegments from "./useAdminDashboardSegments";

const STUDENT_LIMIT = 650;

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

    const statCards = useMemo(
        () => buildAdminStatCards(students.length, mentorCount, successRate),
        [students.length, mentorCount, successRate],
    );

    const summary = useMemo(() => buildSummaryFromStudents(students), [students]);
    const systemSnapshot = useMemo(() => buildSystemSnapshot(summary, students), [summary, students]);
    const successByType = useMemo(() => buildSuccessByType(assignments), [assignments]);
    const { trendData, trendPaths } = useMemo(() => buildTrendData(assignments), [assignments]);
    const mentorSpotlights = useMemo(() => buildMentorSpotlights(assignments), [assignments]);
    const mentorRoster = useMemo(() => buildMentorRoster(assignments), [assignments]);
    const strategyHighlights = useMemo(() => buildStrategyHighlights(assignments), [assignments]);
    const tierMovement = useMemo(() => buildTierMovement(students, assignments), [students, assignments]);
    const analyticsSummary = useMemo(() => buildAnalyticsSummary(assignments), [assignments]);
    const analyticsNarrative = useMemo(() => buildAnalyticsNarrative(students, assignments), [students, assignments]);
    const recentActivity = useMemo(() => buildRecentActivity(assignments), [assignments]);

    return {
        students,
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
        strategyHighlights,
        tierMovement,
        recentActivity,
        loading,
        error,
        refresh: loadDashboard,
    };
};

export default useAdminDashboardData;
