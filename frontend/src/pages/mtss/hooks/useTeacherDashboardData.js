import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMentorAssignments, fetchMtssStudents } from "@/services/mtssService";
import socketService from "@/services/socketService";
import {
    buildStaffGreeting,
    formatStaffDisplayName,
    resolveStaffGender,
} from "@/utils/staffIdentity";
import {
    MTSS_REALTIME_ADMIN_ROLES,
    resolveMtssRealtimeScope,
} from "../utils/mtssRealtimeScope";
import {
    buildStatCards,
    buildGradeQueryValues,
    buildClassQueryValues,
    deriveTeacherSegments,
    getStoredUser,
    mapAssignmentsToStudents,
    mergeRosterWithAssignments,
} from "../utils/teacherDashboardUtils";
import { mapTierLabel } from "../utils/teacherMappingHelpers";
import { expandStudentsBySupportUnit } from "../utils/supportUnitUtils";

const SUBJECT_ALIAS_MAP = {
    english: ["english", "bahasa inggris", "ela", "reading", "literacy", "ela/reading"],
    math: ["math", "mathematics", "numeracy"],
    behavior: ["behavior", "behaviour", "conduct"],
    sel: ["sel", "social emotional", "social-emotional"],
    attendance: ["attendance", "engagement", "present", "absence", "absent"],
    indonesian: ["indonesian", "bahasa indonesia", "bahasa", "bi"],
};

const TIER_PRIORITY = {
    tier3: 3,
    tier2: 2,
    tier1: 1,
};

const normalizeText = (value = "") =>
    value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

const resolveKnownSubjectKey = (value = "") => {
    const normalized = normalizeText(value);
    if (!normalized) return null;

    for (const [canonical, aliases] of Object.entries(SUBJECT_ALIAS_MAP)) {
        if (normalized === canonical) return canonical;
        if (aliases.some((alias) => normalized === alias || normalized.includes(alias) || alias.includes(normalized))) {
            return canonical;
        }
    }

    return null;
};

const buildIdentityKeys = (profile = {}) =>
    new Set(
        [
            profile?.id,
            profile?._id,
            profile?.email ? normalizeText(profile.email) : null,
            profile?.username ? normalizeText(profile.username) : null,
            profile?.nickname ? normalizeText(profile.nickname) : null,
            profile?.name ? normalizeText(profile.name) : null,
        ]
            .filter(Boolean)
            .map((value) => value.toString()),
    );

const resolvePrimaryFocusText = (assignment = {}) =>
    [
        ...(Array.isArray(assignment?.focusAreas) ? assignment.focusAreas : []),
        assignment?.strategyName,
        assignment?.metricLabel,
    ].find((value) => typeof value === "string" && value.trim()) || null;

const buildViewerSubjectKeys = (user = {}) => {
    const keys = new Set();

    (Array.isArray(user?.classes) ? user.classes : []).forEach((entry) => {
        const key = resolveKnownSubjectKey(entry?.subject);
        if (key) keys.add(key);
    });

    const jobPositionKey = resolveKnownSubjectKey(user?.jobPosition);
    if (jobPositionKey) keys.add(jobPositionKey);

    return keys;
};

const buildAssignmentSubjectKeys = (assignment = {}) =>
    new Set(
        [
            ...(Array.isArray(assignment?.focusAreas) ? assignment.focusAreas : []),
            assignment?.strategyName,
            assignment?.metricLabel,
        ]
            .map((value) => resolveKnownSubjectKey(value))
            .filter(Boolean),
    );

const isAssignmentOwnedByViewer = (assignment = {}, viewer = {}) => {
    const viewerKeys = buildIdentityKeys(viewer);
    if (!viewerKeys.size) return false;

    const mentorKeys = buildIdentityKeys(assignment?.mentorId || {});
    for (const key of mentorKeys) {
        if (viewerKeys.has(key)) return true;
    }

    return false;
};

const doesAssignmentMatchViewerSubject = (assignment = {}, viewer = {}) => {
    const viewerSubjectKeys = buildViewerSubjectKeys(viewer);
    if (!viewerSubjectKeys.size) return false;

    const assignmentSubjectKeys = buildAssignmentSubjectKeys(assignment);
    for (const key of assignmentSubjectKeys) {
        if (viewerSubjectKeys.has(key)) return true;
    }

    return false;
};

const rankAssignmentPriority = (assignment = {}) => {
    const tierRank = TIER_PRIORITY[String(assignment?.tier || "").toLowerCase()] || 0;
    const activeRank = String(assignment?.status || "").toLowerCase() === "active" ? 1 : 0;
    const recencyRank = new Date(
        assignment?.updatedAt || assignment?.lastPlanUpdatedAt || assignment?.createdAt || assignment?.startDate || 0,
    ).getTime();

    return (tierRank * 1_000_000_000) + (activeRank * 1_000_000) + recencyRank;
};

const resolveRelevantFocusLabel = (assignments = [], viewer = {}) => {
    const candidates = Array.isArray(assignments) ? assignments : [];
    const ownedAssignments = candidates.filter((assignment) => isAssignmentOwnedByViewer(assignment, viewer));
    const subjectMatchedAssignments = candidates.filter((assignment) => doesAssignmentMatchViewerSubject(assignment, viewer));
    const prioritizedAssignments = ownedAssignments.length ? ownedAssignments : subjectMatchedAssignments;

    if (!prioritizedAssignments.length) return null;

    const selected = [...prioritizedAssignments]
        .filter((assignment) => resolvePrimaryFocusText(assignment))
        .sort((a, b) => rankAssignmentPriority(b) - rankAssignmentPriority(a))[0];

    if (!selected) return null;

    const focusText = resolvePrimaryFocusText(selected);
    return focusText ? `${mapTierLabel(selected.tier)} ${focusText}` : null;
};

const formatHeroDateLabel = (value = new Date()) =>
    new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
    }).format(value);

const buildGreeting = (name) =>
    buildStaffGreeting(name, {
        morning: [
            "Good morning %NAME%, ready to spark joyful wins?",
            "Morning %NAME%, let's light up today's boosts.",
            "%NAME%, today's plan is set. Let's uplift every student.",
        ],
        afternoon: [
            "Good afternoon %NAME%, ready to keep the momentum strong?",
            "%NAME%, let's keep this afternoon focused and joyful.",
            "Afternoon %NAME%, your boost studio is in full flow.",
        ],
        evening: [
            "Good evening %NAME%, let's close today with strong progress.",
            "Evening %NAME%, time for a calm and focused MTSS wrap-up.",
            "%NAME%, this evening is perfect for one last student win.",
        ],
    });

const normalizeHeroBadge = (user) => {
    const nameWithTitle = formatStaffDisplayName({
        nickname: user?.nickname,
        username: user?.username,
        name: user?.name,
        gender: resolveStaffGender(user),
        fallback: "MTSS Mentor",
    });
    return {
        teacher: nameWithTitle,
        school: user?.jobPosition || user?.unit || "Millennia21 Schools",
        tierFocus: null,
        greeting: buildGreeting(nameWithTitle),
        gradeLabel: user?.unit || "All Grades",
        dateLabel: formatHeroDateLabel(),
    };
};

const useTeacherDashboardData = (viewerUser = null) => {
    const storedUser = useMemo(() => viewerUser || getStoredUser(), [viewerUser]);
    const baseHero = useMemo(() => normalizeHeroBadge(storedUser), [storedUser]);

    const segments = useMemo(() => deriveTeacherSegments(storedUser), [storedUser]);
    const [statCards, setStatCards] = useState(() => buildStatCards());
    const [students, setStudents] = useState([]);
    const [progressData, setProgressData] = useState([]);
    const [heroBadge, setHeroBadge] = useState(baseHero);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadDashboard = useCallback(async ({ signal, silent = false } = {}) => {
        if (!silent) {
            setLoading(true);
        }
        setError(null);
        try {
            const gradeQueryValues = buildGradeQueryValues(segments);
            const classQueryValues = buildClassQueryValues(segments);
            const shouldSendGradeParam =
                gradeQueryValues.length && (segments.shouldFilterServer || segments.unit !== "Junior High");

            const studentParams = {
                limit: segments.unit === "Junior High" ? 500 : 200,
            };
            if (shouldSendGradeParam) {
                studentParams.grade = gradeQueryValues.join(",");
            }
            if (classQueryValues.length) {
                studentParams.className = classQueryValues.join(",");
            }

            const [assignmentPayload, rosterPayload] = await Promise.all([
                fetchMentorAssignments({ limit: 150 }, signal ? { signal } : {}),
                fetchMtssStudents(studentParams, signal ? { signal } : {}),
            ]);

            const assignments = assignmentPayload.assignments || assignmentPayload || [];
            const primaryGender = resolveStaffGender(storedUser);
            const primaryName = storedUser?.nickname || storedUser?.username || storedUser?.name || baseHero.teacher;
            const rosterStudents = rosterPayload?.students || [];
            const studentIdSet = new Set(
                rosterStudents
                    .map((student) => student?._id?.toString?.() || student?.id?.toString?.())
                    .filter(Boolean),
            );
            const scopedAssignments = studentIdSet.size
                ? assignments.filter((assignment) =>
                    (assignment.studentIds || []).some((student) => {
                        const studentKey = student?._id?.toString?.() || student?.id?.toString?.() || student?.toString?.();
                        return Boolean(studentKey && studentIdSet.has(studentKey));
                    }))
                : assignments;
            const cards = buildStatCards(scopedAssignments);
            const assignmentSummary = mapAssignmentsToStudents(scopedAssignments, primaryName);
            const mergedStudents = mergeRosterWithAssignments(rosterStudents, assignmentSummary.students, segments);
            const teacherWithTitle = formatStaffDisplayName({
                name: primaryName,
                gender: primaryGender,
                fallback: baseHero.teacher || "MTSS Mentor",
            });

            setStatCards(cards);
            const finalStudents = mergedStudents.length ? mergedStudents : assignmentSummary.students;
            const supportUnitStudents = expandStudentsBySupportUnit(finalStudents);
            setStudents(supportUnitStudents.length ? supportUnitStudents : finalStudents);
            setProgressData(
                assignmentSummary.spotlightChart.length
                    ? assignmentSummary.spotlightChart
                    : [{ label: "Start", date: "Start", reading: 0, goal: 100, value: 0 }],
            );
            setHeroBadge((prev) => ({
                ...prev,
                ...baseHero,
                teacher: teacherWithTitle || baseHero.teacher,
                greeting: buildGreeting(teacherWithTitle || baseHero.teacher),
                tierFocus: resolveRelevantFocusLabel(scopedAssignments, storedUser),
                gradeLabel: segments.label,
                dateLabel: formatHeroDateLabel(),
            }));
        } catch (err) {
            if (err?.name !== "CanceledError" && err?.name !== "AbortError") {
                setError(err?.response?.data?.message || err?.message || "Failed to load MTSS data");
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [baseHero, segments, storedUser]);

    useEffect(() => {
        const controller = new AbortController();
        loadDashboard({ signal: controller.signal });
        return () => controller.abort();
    }, [loadDashboard]);

    useEffect(() => {
        const userId = storedUser?.id || storedUser?._id;
        const role = String(storedUser?.role || "").trim().toLowerCase();
        const liveScope = resolveMtssRealtimeScope(storedUser);
        if (!userId || !role) return;

        socketService.connect();
        socketService.joinMtssLive(liveScope);
        if (MTSS_REALTIME_ADMIN_ROLES.has(role)) {
            socketService.joinMtssAdmin();
        } else {
            socketService.joinMtssMentor(userId);
        }

        const handleMtssRefresh = () => {
            loadDashboard({ silent: true });
        };

        socketService.onMtssRefresh(handleMtssRefresh);

        return () => {
            socketService.offMtssRefresh(handleMtssRefresh);
            socketService.leaveMtssLive(liveScope);
            if (MTSS_REALTIME_ADMIN_ROLES.has(role)) {
                socketService.leaveMtssAdmin();
            } else {
                socketService.leaveMtssMentor(userId);
            }
        };
    }, [loadDashboard, storedUser]);

    return {
        statCards,
        students,
        progressData: progressData.length ? progressData : [{ label: "Start", date: "Start", reading: 0, goal: 100, value: 0 }],
        heroBadge,
        loading,
        error,
        refresh: () => loadDashboard(),
    };
};

export default useTeacherDashboardData;
