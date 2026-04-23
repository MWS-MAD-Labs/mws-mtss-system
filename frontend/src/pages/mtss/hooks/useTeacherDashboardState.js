import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useToast } from "@/components/ui/use-toast";
import { createDefaultInterventionForm, createDefaultProgressForm } from "../data/teacherDashboardContent";
import { createMentorAssignment, updateMentorAssignment } from "@/services/mtssService";
import { resolveEditableAssignmentOption } from "../utils/editPlanAccess";
import useMtssPersistentState from "./useMtssPersistentState";

const TYPE_ALIAS_MAP = {
    english: ["english", "bahasa inggris", "ela", "reading", "literacy"],
    math: ["math", "mathematics", "numeracy"],
    behavior: ["behavior", "behaviour", "conduct"],
    sel: ["sel", "social emotional", "social-emotional"],
    attendance: ["attendance", "present", "absence", "absent"],
    indonesian: ["indonesian", "bahasa", "bahasa indonesia", "bi"],
    universal: ["universal", "all", "schoolwide", "tier 1"],
};

const normalizeText = (value = "") =>
    value
        .toString()
        .trim()
        .toLowerCase();

const resolveTypeValue = (option = {}) => {
    const candidates = [
        option?.focus,
        option?.focusAreas?.[0],
        option?.strategyName,
    ].filter(Boolean);

    for (const raw of candidates) {
        const normalized = normalizeText(raw);
        if (!normalized) continue;
        const direct = Object.keys(TYPE_ALIAS_MAP).find((key) => key === normalized);
        if (direct) return direct;

        for (const [type, aliases] of Object.entries(TYPE_ALIAS_MAP)) {
            if (aliases.some((alias) => normalized === alias || normalized.includes(alias) || alias.includes(normalized))) {
                return type;
            }
        }
    }

    return "universal";
};

const resolveTierValue = (value = "tier2") => {
    const normalized = normalizeText(value).replace(/\s+/g, "");
    if (!normalized) return "tier2";
    if (normalized.includes("tier3") || normalized === "3") return "tier3";
    if (normalized.includes("tier1") || normalized === "1") return "tier1";
    return "tier2";
};

const resolveDurationValue = (value = "") => {
    const normalized = normalizeText(value);
    return /^\d+\s+weeks?$/.test(normalized) ? normalized.replace(/weeks?$/, "weeks") : "";
};

const toDateInputValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
};

const resolveScoreValue = (score) => {
    if (score == null) return "";
    if (typeof score === "number" || typeof score === "string") {
        return `${score}`.trim();
    }
    if (score?.value == null) return "";
    return `${score.value}`.trim();
};

const resolveScoreUnit = (score, fallback = "score") => {
    if (typeof score === "string") return score || fallback;
    return score?.unit || fallback;
};

const resolveGoalValue = (option = {}) => {
    if (typeof option.goal === "string" && option.goal.trim()) return option.goal.trim();
    if (typeof option.goals === "string" && option.goals.trim()) return option.goals.trim();
    if (Array.isArray(option.goals) && option.goals.length) {
        const goalEntry = option.goals.find(Boolean);
        if (typeof goalEntry === "string") return goalEntry.trim();
        if (goalEntry?.description) return goalEntry.description.trim();
    }
    return "";
};

const buildInterventionFormFromAssignment = (student, option = {}) => {
    const fallbackUnit = option.metricLabel || "score";
    const baselineUnit = resolveScoreUnit(option.baselineScore, fallbackUnit);

    return {
        ...createDefaultInterventionForm(),
        studentId: student?.id || student?._id || "",
        studentName: student?.name || "",
        grade: student?.grade || student?.currentGrade || "",
        className: student?.className || "",
        mode: "quantitative",
        type: resolveTypeValue(option),
        strategyId: option?.strategyId || "",
        strategyName: option?.strategyName || "",
        tier: resolveTierValue(option?.tierValue || option?.tierCode || option?.tier),
        goal: resolveGoalValue(option),
        notes: option?.notes || "",
        startDate: toDateInputValue(option?.startDate),
        duration: resolveDurationValue(option?.duration),
        monitorFrequency: option?.monitoringFrequency || "",
        customFrequencyDays: Array.isArray(option?.customFrequencyDays) ? option.customFrequencyDays : [],
        customFrequencyNote: option?.customFrequencyNote || "",
        monitorMethod: option?.monitoringMethod || "",
        baselineValue: resolveScoreValue(option?.baselineScore),
        baselineUnit: baselineUnit,
        targetValue: resolveScoreValue(option?.targetScore),
        targetUnit: resolveScoreUnit(option?.targetScore, baselineUnit),
    };
};

const buildScorePayload = (value, unit = "score", allowClear = false) => {
    if (value === "" || value === null || value === undefined) {
        return allowClear ? { value: null, unit } : undefined;
    }

    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) {
        return allowClear ? { value: null, unit } : undefined;
    }

    return {
        value: parsedValue,
        unit,
    };
};

export const useTeacherDashboardState = (tabs, { onSaveSuccess, viewerUser } = {}) => {
    const { toast } = useToast();
    const location = useLocation();
    const tabStorageKey = useMemo(() => `mtss:teacher-tab:${location.pathname}`, [location.pathname]);
    const requestedTab = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        return tab && tabs.some((entry) => entry.key === tab) ? tab : null;
    }, [location.search, tabs]);
    const [activeTab, setStoredActiveTab] = useMtssPersistentState(tabStorageKey, requestedTab || "dashboard");
    const [interventionForm, setInterventionForm] = useState(() => createDefaultInterventionForm());
    const [progressForm, setProgressForm] = useState(() => createDefaultProgressForm());
    const [editingPlan, setEditingPlan] = useState(null);
    const [submittingPlan, setSubmittingPlan] = useState(false);
    const [submittingProgress, setSubmittingProgress] = useState(false);

    const authUser = useSelector((state) => state.auth?.user);
    const actingUser = viewerUser || authUser;

    useEffect(() => {
        if (requestedTab && requestedTab !== activeTab) {
            setStoredActiveTab(requestedTab);
        }
    }, [activeTab, requestedTab, setStoredActiveTab]);

    const setActiveTab = useCallback((value) => {
        setStoredActiveTab(value);
    }, [setStoredActiveTab]);

    const handleInterventionChange = useCallback((field, value) => {
        setInterventionForm((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleProgressChange = useCallback((field, value) => {
        setProgressForm((prev) => ({ ...prev, [field]: value }));
    }, []);

    const startEditingPlan = useCallback((student, assignmentOption) => {
        const selectedOption = assignmentOption || resolveEditableAssignmentOption(student);
        if (!selectedOption?.assignmentId) return false;

        setEditingPlan({
            assignmentId: selectedOption.assignmentId,
            studentName: student?.name || "Student",
            focusLabel: selectedOption.focus || selectedOption.strategyName || "Intervention",
        });
        setInterventionForm(buildInterventionFormFromAssignment(student, selectedOption));
        setActiveTab("edit");
        return true;
    }, [setActiveTab]);

    const cancelEditingPlan = useCallback(() => {
        setEditingPlan(null);
        setInterventionForm(createDefaultInterventionForm());
    }, []);

    const handleSavePlan = useCallback(
        async (event, form) => {
            event.preventDefault();
            if (submittingPlan) return;

            const currentForm = form || interventionForm;
            const requiredKeys = ["studentId", "type", "tier", "startDate", "monitorFrequency", "monitorMethod"];
            const missing = requiredKeys.filter((key) => !currentForm[key]);
            if (missing.length) {
                toast({
                    title: "Complete the required fields",
                    description: "Student, type, tier, start date, frequency, and method are required.",
                    variant: "destructive",
                });
                return;
            }

            try {
                setSubmittingPlan(true);

                const isEditing = Boolean(editingPlan?.assignmentId);
                const goalText = currentForm.goal?.trim() || "";
                const metricUnit = currentForm.baselineUnit || currentForm.targetUnit || "score";
                const baselineScore = buildScorePayload(currentForm.baselineValue, metricUnit, isEditing);
                const targetScore = buildScorePayload(currentForm.targetValue, metricUnit, isEditing);

                const payload = {
                    tier: currentForm.tier,
                    focusAreas: currentForm.type ? [currentForm.type] : ["Universal Supports"],
                    startDate: currentForm.startDate || undefined,
                    duration: currentForm.duration || undefined,
                    strategyId: currentForm.strategyId || undefined,
                    strategyName: currentForm.strategyName || undefined,
                    monitoringMethod: currentForm.monitorMethod || undefined,
                    monitoringFrequency: currentForm.monitorFrequency || undefined,
                    metricLabel: metricUnit,
                    ...(baselineScore !== undefined ? { baselineScore } : {}),
                    ...(targetScore !== undefined ? { targetScore } : {}),
                    notes: isEditing ? (currentForm.notes || "") : (currentForm.notes || undefined),
                    goals: goalText
                        ? [{ description: goalText }]
                        : (isEditing ? [] : undefined),
                };

                if (currentForm.monitorFrequency === "Custom") {
                    payload.customFrequencyDays = currentForm.customFrequencyDays?.length ? currentForm.customFrequencyDays : [];
                    payload.customFrequencyNote = currentForm.customFrequencyNote || "";
                } else if (isEditing) {
                    payload.customFrequencyDays = [];
                    payload.customFrequencyNote = "";
                }

                if (isEditing) {
                    await updateMentorAssignment(editingPlan.assignmentId, payload);
                } else {
                    const mentorId = actingUser?.id || actingUser?._id || authUser?.id || authUser?._id;
                    await createMentorAssignment({
                        ...payload,
                        mentorId,
                        studentIds: [currentForm.studentId],
                    });
                }

                toast({
                    title: isEditing ? "Intervention updated" : "Intervention saved",
                    description: isEditing
                        ? "Plan changes are now live on the MTSS dashboard."
                        : "Student plan created successfully. Track their progress!",
                });

                setInterventionForm(createDefaultInterventionForm());
                setEditingPlan(null);
                setActiveTab("students");
                onSaveSuccess?.();
            } catch (error) {
                console.error("Failed to save intervention plan:", error);
                toast({
                    title: "Failed to save plan",
                    description: error?.response?.data?.message || error?.message || "Please try again.",
                    variant: "destructive",
                });
            } finally {
                setSubmittingPlan(false);
            }
        },
        [actingUser, authUser, editingPlan, interventionForm, onSaveSuccess, setActiveTab, submittingPlan, toast],
    );

    const handleSubmitProgress = useCallback(
        async (event) => {
            event.preventDefault();
            if (submittingProgress) return;

            if (!progressForm.assignmentId || !progressForm.notes) {
                toast({
                    title: "Complete the required fields",
                    description: "Please select a student and provide progress notes.",
                    variant: "destructive",
                });
                return;
            }

            try {
                setSubmittingProgress(true);

                const payload = {
                    checkIns: [{
                        date: progressForm.date || new Date().toISOString(),
                        summary: progressForm.notes || "Progress update",
                        value: progressForm.scoreValue ? Number(progressForm.scoreValue) : undefined,
                        unit: progressForm.scoreUnit || "score",
                        performed: progressForm.performed === "yes" || progressForm.performed === true,
                        skipReason: progressForm.performed === "no" ? (progressForm.skipReason || undefined) : undefined,
                        skipReasonNote: progressForm.performed === "no" && progressForm.skipReason === "other" ? (progressForm.skipReasonNote || undefined) : undefined,
                        celebration: progressForm.badge || undefined,
                    }],
                };

                await updateMentorAssignment(progressForm.assignmentId, payload);

                toast({
                    title: "Progress submitted",
                    description: "Your monitoring update is live on the MTSS dashboard.",
                });

                setProgressForm(createDefaultProgressForm());
            } catch (error) {
                console.error("Failed to submit progress:", error);
                toast({
                    title: "Failed to submit progress",
                    description: error?.response?.data?.message || error?.message || "Please try again.",
                    variant: "destructive",
                });
            } finally {
                setSubmittingProgress(false);
            }
        },
        [progressForm, submittingProgress, toast],
    );

    const resetInterventionForm = useCallback(() => {
        setEditingPlan(null);
        setInterventionForm(createDefaultInterventionForm());
    }, []);

    const resetProgressForm = useCallback(() => {
        setProgressForm(createDefaultProgressForm());
    }, []);

    return {
        activeTab,
        setActiveTab,
        interventionForm,
        progressForm,
        editingPlan,
        isEditingPlan: Boolean(editingPlan?.assignmentId),
        handleInterventionChange,
        handleProgressChange,
        handleSavePlan,
        handleSubmitProgress,
        startEditingPlan,
        cancelEditingPlan,
        resetInterventionForm,
        resetProgressForm,
        submittingPlan,
        setSubmittingPlan,
        submittingProgress,
        setSubmittingProgress,
    };
};
