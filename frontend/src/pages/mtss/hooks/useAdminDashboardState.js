import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { TYPE_LOOKUP, ensureStudentInterventions, pickPrimaryIntervention, resolveTypeKey } from "../utils/interventionUtils";
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
        return students.filter((student) => {
            const interventions = ensureStudentInterventions(student.interventions);
            const primarySupport = pickPrimaryIntervention(interventions);
            const studentType = normalizeTypeOption(student.type)?.value;
            const interventionTypes = interventions
                .map((entry) => normalizeTypeOption(entry.label || entry.type)?.value)
                .filter(Boolean);
            const matchesGrade = filters.grade === "all" || student.grade === filters.grade;
            const matchesTier = filters.tier === "all" || (primarySupport?.tier || student.tier) === filters.tier;
            const matchesType =
                filters.type === "all" ||
                studentType === filters.type ||
                interventionTypes.includes(filters.type);
            const mentorLabel = student.mentor || student.profile?.mentor;
            const teacherRoster =
                Array.isArray(student.teachers) && student.teachers.length
                    ? student.teachers
                    : Array.isArray(student.profile?.teacherRoster) && student.profile.teacherRoster.length
                        ? student.profile.teacherRoster
                        : mentorLabel
                            ? [mentorLabel]
                            : [];
            const matchesMentor = filters.mentor === "all" || teacherRoster.includes(filters.mentor);
            const matchesQuery =
                !query ||
                student.name?.toLowerCase().includes(query) ||
                student.type?.toLowerCase().includes(query) ||
                interventions.some((entry) => entry.label.toLowerCase().includes(query)) ||
                (student.className || "").toLowerCase().includes(query) ||
                mentorLabel?.toLowerCase().includes(query) ||
                teacherRoster.some((teacher) => teacher.toLowerCase().includes(query));

            return matchesGrade && matchesTier && matchesType && matchesMentor && matchesQuery;
        });
    }, [students, filters]);

    const gradeOptions = useMemo(() => buildOptions(students, "grade"), [students]);
    const tierOptions = useMemo(() => {
        const normalized = students.map((student) => {
            const interventions = ensureStudentInterventions(student.interventions);
            const primary = pickPrimaryIntervention(interventions);
            return {
                ...student,
                tier: primary?.tier || student.tier,
            };
        });
        return buildOptions(normalized, "tier");
    }, [students]);
    const typeOptions = useMemo(() => {
        const values = new Map([["all", { value: "all", label: "All Types" }]]);
        students.forEach((student) => {
            const primaryType = normalizeTypeOption(student.type);
            if (primaryType) {
                values.set(primaryType.value, primaryType);
            }
            ensureStudentInterventions(student.interventions).forEach((entry) => {
                const normalizedType = normalizeTypeOption(entry.label || entry.type);
                if (normalizedType) {
                    values.set(normalizedType.value, normalizedType);
                }
            });
        });
        return Array.from(values.values());
    }, [students]);
    const mentorOptions = useMemo(() => {
        const values = new Set();
        students.forEach((student) => {
            const roster =
                Array.isArray(student.teachers) && student.teachers.length
                    ? student.teachers
                    : Array.isArray(student.profile?.teacherRoster) && student.profile.teacherRoster.length
                        ? student.profile.teacherRoster
                        : [];
            if (roster.length) {
                roster.forEach((teacher) => values.add(teacher));
                return;
            }
            const mentor = student.mentor || student.profile?.mentor;
            if (mentor) {
                values.add(mentor);
            }
        });
        return ["all", ...Array.from(values)];
    }, [students]);

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

    const toggleSelection = useCallback((student) => {
        const id = student.id || student._id;
        if (!id) return;
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    }, []);

    const resetSelection = useCallback(() => setSelectedIds([]), []);

    useEffect(() => {
        setSelectedIds((prev) => prev.filter((id) => students.some((student) => (student.id || student._id) === id)));
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
