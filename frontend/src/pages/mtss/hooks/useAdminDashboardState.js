import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { TYPE_LOOKUP, ensureStudentInterventions, normalizeTierCode, pickPrimaryIntervention, resolveTypeKey } from "../utils/interventionUtils";
import useMtssPersistentState from "./useMtssPersistentState";

const buildOptions = (students = [], key) => {
    const values = new Set();
    students.forEach((student) => {
        const value = student[key];
        if (value) values.add(value);
    });
    return ["all", ...Array.from(values)];
};

const DEFAULT_FILTERS = {
    grade: "all",
    tier: "all",
    type: "all",
    mentor: "all",
    query: "",
};

const DEFAULT_VISIBLE_COUNT = 10;
const DEFAULT_VIEW_STATE = {
    activeTab: "overview",
    filters: DEFAULT_FILTERS,
    visibleCount: DEFAULT_VISIBLE_COUNT,
};

const toTitleCase = (value = "") =>
    value
        .split(" ")
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
        .join(" ");

const normalizeTypeOption = (value) => {
    if (!value) return null;

    const cleaned = value.toString().trim().replace(/\s+/g, " ");
    if (!cleaned) return null;

    const typeKey = resolveTypeKey(cleaned);
    if (typeKey && TYPE_LOOKUP.has(typeKey)) {
        const match = TYPE_LOOKUP.get(typeKey);
        return { value: match.key, label: match.label };
    }

    return {
        value: cleaned.toLowerCase(),
        label: toTitleCase(cleaned),
    };
};

const normalizeTypeFilterValue = (value) => {
    if (!value || value === "all") return "all";
    return normalizeTypeOption(value)?.value || value;
};

const normalizeText = (value = "") => String(value || "").trim();

const addNormalizedOption = (values, rawValue) => {
    const normalized = normalizeTypeOption(rawValue);
    if (normalized) values.set(normalized.value, normalized);
};

const isVisibleIntervention = (entry = {}) =>
    Boolean(entry.hasData || entry.tierCode === "tier2" || entry.tierCode === "tier3");

const normalizeTierFilterValue = (value = "") => {
    const normalized = normalizeText(value).toLowerCase().replace(/\s+/g, "");
    if (!normalized) return "";
    if (normalized.includes("3")) return "Tier 3";
    if (normalized.includes("2")) return "Tier 2";
    if (normalized.includes("1")) return "Tier 1";
    return normalizeText(value);
};

const getNormalizedSubjectValues = (candidates = []) =>
    new Set(
        candidates
            .map((candidate) => normalizeTypeOption(candidate)?.value)
            .filter(Boolean),
    );

const getAssignmentSubjectCandidates = (assignment = {}) => [
    assignment.subject,
    assignment.type,
    assignment.focus,
    assignment.focusArea,
    assignment.label,
    assignment.interventionType,
    assignment.strategyName,
    assignment.metricLabel,
    assignment.lastUpdateSubject,
    ...(Array.isArray(assignment.focusAreas) ? assignment.focusAreas : []),
    ...(Array.isArray(assignment.interventionTypes) ? assignment.interventionTypes : []),
];

const getInterventionSubjectCandidates = (intervention = {}) => [
    intervention.label,
    intervention.type,
    intervention.subject,
    intervention.focus,
    intervention.focusArea,
    intervention.interventionType,
    ...(Array.isArray(intervention.focusAreas) ? intervention.focusAreas : []),
    ...(Array.isArray(intervention.interventionTypes) ? intervention.interventionTypes : []),
];

const candidateMatchesType = (candidates = [], typeFilter = "all") =>
    typeFilter === "all" || getNormalizedSubjectValues(candidates).has(typeFilter);

const assignmentMatchesType = (assignment = {}, typeFilter = "all") =>
    candidateMatchesType(getAssignmentSubjectCandidates(assignment), typeFilter);

const interventionMatchesType = (intervention = {}, typeFilter = "all") =>
    candidateMatchesType(getInterventionSubjectCandidates(intervention), typeFilter);

const getScopedAssignmentOptions = (student = {}, typeFilter = "all") => {
    const assignmentOptions = Array.isArray(student.assignmentOptions) ? student.assignmentOptions : [];
    if (typeFilter === "all") return assignmentOptions;
    return assignmentOptions.filter((assignment) => assignmentMatchesType(assignment, typeFilter));
};

const getScopedInterventions = (student = {}, typeFilter = "all") => {
    const interventions = Array.isArray(student.interventions) ? student.interventions : [];
    if (typeFilter === "all") return interventions;
    return interventions.filter((intervention) => interventionMatchesType(intervention, typeFilter));
};

const getTierLabelsForScope = (student = {}, typeFilter = "all") => {
    const scopedAssignments = getScopedAssignmentOptions(student, typeFilter);
    const scopedInterventions = getScopedInterventions(student, typeFilter);
    const labels = new Set();

    scopedAssignments.forEach((assignment = {}) => {
        [
            assignment.tier,
            assignment.tierLabel,
            assignment.tierValue,
            assignment.tierCode,
        ].forEach((value) => {
            const label = normalizeTierFilterValue(value);
            if (label) labels.add(label);
        });
    });

    ensureStudentInterventions(scopedInterventions).forEach((intervention = {}) => {
        if (!intervention.hasData && intervention.tierCode === "tier1") return;
        [
            intervention.tier,
            intervention.tierCode,
        ].forEach((value) => {
            const label = normalizeTierFilterValue(value);
            if (label) labels.add(label);
        });
    });

    return Array.from(labels);
};

const buildInterventionFromAssignment = (assignment = {}) => {
    const focus = normalizeText(assignment.focus || assignment.subject || assignment.focusArea || assignment.focusAreas?.[0] || assignment.strategyName) || "Focused Support";
    const tierCode = normalizeTierCode(assignment.tierCode || assignment.tierValue || assignment.tier);
    return {
        id: assignment.assignmentId,
        type: resolveTypeKey(focus) || resolveTypeKey(assignment.subject) || resolveTypeKey(assignment.type) || "SEL",
        label: focus,
        tier: normalizeTierFilterValue(tierCode) || assignment.tierLabel || assignment.tier || "Tier 2",
        tierCode,
        status: assignment.statusKey || assignment.status || "active",
        strategies: [assignment.strategyName].filter(Boolean),
        hasData: true,
    };
};

const buildSubjectScopedStudent = (student = {}, typeFilter = "all") => {
    if (typeFilter === "all") return student;

    const scopedAssignments = getScopedAssignmentOptions(student, typeFilter);
    const scopedInterventions = getScopedInterventions(student, typeFilter);
    const visibleScopedInterventions = ensureStudentInterventions(scopedInterventions).filter(isVisibleIntervention);
    const primaryAssignment = scopedAssignments[0] || null;
    const nextStudent = {
        ...student,
        activeSubjectFilter: typeFilter,
    };

    if (scopedAssignments.length) {
        nextStudent.assignmentOptions = scopedAssignments;
        nextStudent.assignmentId = primaryAssignment?.assignmentId || student.assignmentId;
        nextStudent.mentor = primaryAssignment?.mentor || student.mentor;
        nextStudent.type = primaryAssignment?.focus || primaryAssignment?.subject || student.type;
        nextStudent.progress = primaryAssignment?.statusLabel || student.progress;
        nextStudent.nextUpdate = primaryAssignment?.nextUpdate || student.nextUpdate;
        nextStudent.profile = {
            ...(student.profile || {}),
            mentor: primaryAssignment?.mentor || student.profile?.mentor,
            type: primaryAssignment?.focus || primaryAssignment?.subject || student.profile?.type,
        };
        if (primaryAssignment?.lastUpdateAt) {
            nextStudent.lastUpdate = {
                at: primaryAssignment.lastUpdateAt,
                subject: primaryAssignment.lastUpdateSubject || primaryAssignment.focus || primaryAssignment.subject,
            };
        }
    }

    nextStudent.interventions = visibleScopedInterventions.length
        ? visibleScopedInterventions
        : scopedAssignments.map(buildInterventionFromAssignment);

    return nextStudent;
};

const getStudentSubjectOptions = (student = {}) => {
    const values = new Map();
    [
        student.type,
        student.subject,
        student.focusArea,
        student.latestUpdate?.subject,
        student.lastUpdate?.subject,
    ].forEach((value) => addNormalizedOption(values, value));

    ensureStudentInterventions(student.interventions).filter(isVisibleIntervention).forEach((entry) => {
        [
            entry.label,
            entry.type,
            entry.subject,
            entry.focus,
            entry.focusArea,
            ...(Array.isArray(entry.focusAreas) ? entry.focusAreas : []),
        ].forEach((value) => addNormalizedOption(values, value));
    });

    (Array.isArray(student.assignmentOptions) ? student.assignmentOptions : []).forEach((assignment) => {
        getAssignmentSubjectCandidates(assignment).forEach((value) => addNormalizedOption(values, value));
    });

    return Array.from(values.values());
};

const getStudentMentorRoster = (student = {}) => {
    const values = new Set();
    const add = (value) => {
        const text = normalizeText(value);
        if (text) values.add(text);
    };

    (Array.isArray(student.teachers) ? student.teachers : []).forEach(add);
    (Array.isArray(student.profile?.teacherRoster) ? student.profile.teacherRoster : []).forEach(add);
    add(student.mentor);
    add(student.profile?.mentor);
    (Array.isArray(student.assignmentOptions) ? student.assignmentOptions : []).forEach((assignment) => {
        add(assignment.mentor);
        add(assignment.mentorName);
        add(assignment.owner);
        add(assignment.ownerName);
    });

    return Array.from(values);
};

const getStudentRowId = (student = {}) =>
    student.id || student._id || student.supportUnit?.assignmentId || student.baseStudentId || student.slug || student.name;

export const useAdminDashboardState = (students = [], availableTabs = ["overview", "students", "mentors", "analytics"]) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const dashboardTabs = useMemo(() => {
        const unique = Array.from(new Set((availableTabs || []).filter(Boolean)));
        return unique.length ? unique : ["overview"];
    }, [availableTabs]);
    const dashboardTabSet = useMemo(() => new Set(dashboardTabs), [dashboardTabs]);
    const requestedTab = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        return tab && dashboardTabSet.has(tab) ? tab : null;
    }, [dashboardTabSet, location.search]);
    const storageKey = useMemo(() => `mtss:dashboard-view:${location.pathname}`, [location.pathname]);
    const [viewState, setViewState] = useMtssPersistentState(storageKey, DEFAULT_VIEW_STATE);

    const activeTab = dashboardTabSet.has(viewState?.activeTab) ? viewState.activeTab : dashboardTabs[0];
    const filters = useMemo(() => ({
        ...DEFAULT_FILTERS,
        ...(viewState?.filters || {}),
        type: normalizeTypeFilterValue(viewState?.filters?.type),
    }), [viewState?.filters]);
    const visibleCount = Math.max(Number(viewState?.visibleCount) || DEFAULT_VISIBLE_COUNT, DEFAULT_VISIBLE_COUNT);
    const [selectedIds, setSelectedIds] = useState([]);
    const rosterStudents = useMemo(() => (Array.isArray(students) ? students : []), [students]);

    useEffect(() => {
        if (requestedTab && requestedTab !== activeTab) {
            setViewState((prev) => ({
                ...(prev || {}),
                activeTab: requestedTab,
            }));
        }
    }, [activeTab, requestedTab, setViewState]);

    const filteredStudents = useMemo(() => {
        const query = filters.query.trim().toLowerCase();
        return rosterStudents.reduce((matches, student) => {
            const scopedStudent = buildSubjectScopedStudent(student, filters.type);
            const interventions = ensureStudentInterventions(scopedStudent.interventions);
            const visibleInterventions = interventions.filter(isVisibleIntervention);
            const primarySupport = pickPrimaryIntervention(visibleInterventions.length ? visibleInterventions : interventions);
            const subjectOptions = getStudentSubjectOptions(student);
            const subjectValues = subjectOptions.map((entry) => entry.value);
            const subjectLabels = subjectOptions.map((entry) => entry.label.toLowerCase());
            const matchesGrade = filters.grade === "all" || student.grade === filters.grade;
            const scopedTierLabels = filters.type === "all"
                ? [primarySupport?.tier || student.tier].filter(Boolean)
                : getTierLabelsForScope(student, filters.type);
            const matchesTier = filters.tier === "all" || scopedTierLabels.includes(filters.tier);
            const matchesType =
                filters.type === "all" ||
                subjectValues.includes(filters.type);
            const mentorLabel = scopedStudent.mentor || scopedStudent.profile?.mentor;
            const pairingLabel = scopedStudent.supportUnit?.pairingLabel || scopedStudent.pairingLabel || scopedStudent.profile?.pairingLabel;
            const teacherRoster = getStudentMentorRoster(scopedStudent);
            const matchesMentor = filters.mentor === "all" || teacherRoster.includes(filters.mentor);
            const matchesQuery =
                !query ||
                student.name?.toLowerCase().includes(query) ||
                scopedStudent.type?.toLowerCase().includes(query) ||
                visibleInterventions.some((entry) => entry.label.toLowerCase().includes(query)) ||
                subjectLabels.some((label) => label.includes(query)) ||
                (student.className || "").toLowerCase().includes(query) ||
                mentorLabel?.toLowerCase().includes(query) ||
                pairingLabel?.toLowerCase().includes(query) ||
                teacherRoster.some((teacher) => teacher.toLowerCase().includes(query));

            if (matchesGrade && matchesTier && matchesType && matchesMentor && matchesQuery) {
                matches.push(scopedStudent);
            }

            return matches;
        }, []);
    }, [rosterStudents, filters]);

    const gradeOptions = useMemo(() => buildOptions(rosterStudents, "grade"), [rosterStudents]);
    const tierOptions = useMemo(() => {
        const normalized = rosterStudents.map((student) => {
            const interventions = ensureStudentInterventions(student.interventions);
            const primary = pickPrimaryIntervention(interventions);
            return {
                ...student,
                tier: primary?.tier || student.tier,
            };
        });
        return buildOptions(normalized, "tier");
    }, [rosterStudents]);
    const typeOptions = useMemo(() => {
        const values = new Map([["all", { value: "all", label: "All Subjects / Focus Areas" }]]);
        rosterStudents.forEach((student) => {
            getStudentSubjectOptions(student).forEach((option) => values.set(option.value, option));
        });
        return Array.from(values.values());
    }, [rosterStudents]);
    const mentorOptions = useMemo(() => {
        const values = new Set();
        rosterStudents.forEach((student) => {
            getStudentMentorRoster(student).forEach((mentor) => values.add(mentor));
        });
        return ["all", ...Array.from(values)];
    }, [rosterStudents]);

    const setActiveTab = useCallback((value) => {
        if (!dashboardTabSet.has(value)) return;
        setViewState((prev) => ({
            ...(prev || {}),
            activeTab: value,
        }));
    }, [dashboardTabSet, setViewState]);

    const handleFilterChange = useCallback((field, value) => {
        const nextValue = field === "type" ? normalizeTypeFilterValue(value) : value;
        setViewState((prev) => ({
            ...(prev || {}),
            filters: {
                ...DEFAULT_FILTERS,
                ...((prev && prev.filters) || {}),
                [field]: nextValue,
            },
            visibleCount: DEFAULT_VISIBLE_COUNT,
        }));
    }, [setViewState]);

    const setVisibleCount = useCallback((updater) => {
        setViewState((prev) => {
            const currentValue = Math.max(Number(prev?.visibleCount) || DEFAULT_VISIBLE_COUNT, DEFAULT_VISIBLE_COUNT);
            const nextValue = typeof updater === "function" ? updater(currentValue) : updater;
            return {
                ...(prev || {}),
                visibleCount: Math.max(Number(nextValue) || DEFAULT_VISIBLE_COUNT, DEFAULT_VISIBLE_COUNT),
            };
        });
    }, [setViewState]);

    const clearFilters = useCallback(() => {
        setViewState((prev) => ({
            ...(prev || {}),
            filters: DEFAULT_FILTERS,
            visibleCount: DEFAULT_VISIBLE_COUNT,
        }));
    }, [setViewState]);

    const toggleSelection = useCallback((student) => {
        const id = getStudentRowId(student);
        if (!id) return;
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    }, []);

    const resetSelection = useCallback(() => setSelectedIds([]), []);

    useEffect(() => {
        setSelectedIds((prev) => prev.filter((id) => students.some((student) => getStudentRowId(student) === id)));
    }, [students]);

    const handleViewStudent = useCallback(
        (student) => {
            if (!student?.slug) return;
            navigate(`/mtss/student/${student.slug}`, {
                state: {
                    from: {
                        pathname: location.pathname,
                        search: location.search,
                    },
                },
            });
        },
        [location.pathname, location.search, navigate],
    );

    const handleQuickUpdate = useCallback(
        (student) => {
            toast({
                title: "Mentor nudged",
                description: `Flagged ${student.name}'s plan for a system review.`,
            });
        },
        [toast],
    );

    return {
        activeTab,
        setActiveTab,
        filters,
        visibleCount,
        setVisibleCount,
        handleFilterChange,
        clearFilters,
        filteredStudents,
        gradeOptions,
        tierOptions,
        typeOptions,
        mentorOptions,
        selectedIds,
        toggleSelection,
        resetSelection,
        handleViewStudent,
        handleQuickUpdate,
    };
};
