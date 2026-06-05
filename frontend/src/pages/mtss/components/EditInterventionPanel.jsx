import { memo, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, PencilLine, Save, ShieldAlert } from "lucide-react";
import { fetchStrategies } from "@/services/mtssService";
import { filterStrategiesByType, validateInterventionForm } from "../config/interventionFormConfig";
import InterventionFormFields from "./InterventionFormFields";

const EditInterventionPanel = memo(({
    formState,
    onChange,
    onSubmit,
    baseFieldClass,
    textareaClass,
    students = [],
    submitting = false,
    editingPlan = null,
    onCancelEdit,
}) => {
    const [strategies, setStrategies] = useState([]);
    const [loadingStrategies, setLoadingStrategies] = useState(false);

    useEffect(() => {
        let mounted = true;
        setLoadingStrategies(true);
        fetchStrategies()
            .then((response) => {
                if (!mounted) return;
                setStrategies(response?.strategies || []);
            })
            .catch(() => {
                if (!mounted) return;
                setStrategies([]);
            })
            .finally(() => {
                if (mounted) setLoadingStrategies(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const strategyMatchesType = useMemo(
        () => filterStrategiesByType(strategies, formState.type),
        [formState.type, strategies],
    );

    const strategyFallbackActive = Boolean(formState.type && strategies.length && strategyMatchesType.length === 0);
    const filteredStrategies = strategyFallbackActive ? strategies : strategyMatchesType;

    const selectedStudent = useMemo(
        () => students.find((student) => student.id === formState.studentId || student._id === formState.studentId),
        [students, formState.studentId],
    );

    const handleStudentChange = (event) => {
        const value = event.target.value;
        const student = students.find((candidate) => candidate.id === value || candidate._id === value);
        onChange("studentId", value);
        onChange("studentName", student?.name || "");
        onChange("grade", student?.grade || student?.currentGrade || "");
        onChange("className", student?.className || "");
        onChange("mode", "quantitative");
    };

    const handleStrategyChange = (event) => {
        const strategyId = event.target.value;
        const strategy = strategies.find((item) => item._id === strategyId);
        onChange("strategyId", strategyId);
        onChange("strategyName", strategy?.name || "");
    };

    const isValid = validateInterventionForm(formState);
    const contextItems = useMemo(() => [
        { label: "Subject", value: editingPlan?.subject || editingPlan?.focusLabel || "Focused Support" },
        { label: "Owner", value: editingPlan?.owner || "Unassigned" },
        { label: "Goal", value: editingPlan?.goal || "Not set" },
        { label: "Baseline", value: editingPlan?.baseline || "Not set" },
        { label: "Target", value: editingPlan?.target || "Not set" },
        { label: "Last Progress", value: editingPlan?.lastProgressUpdate || "No progress yet" },
        { label: "Status", value: editingPlan?.status || "Active" },
    ], [editingPlan]);

    if (!editingPlan?.assignmentId) {
        return (
            <section className="mtss-theme relative overflow-hidden rounded-[36px] border border-white/50 dark:border-white/10 bg-white/75 dark:bg-slate-900/50 shadow-[0_30px_90px_rgba(15,23,42,0.18)] p-6 sm:p-8 space-y-5 backdrop-blur-2xl">
                <header className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-50/80 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-700/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-amber-700 dark:text-amber-300">
                        <ShieldAlert className="w-4 h-4" />
                        Edit Workspace
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black leading-tight text-slate-800 dark:text-white">
                        Select an intervention to edit
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-200 max-w-2xl">
                        Use the <span className="font-semibold">Edit Plan</span> action from Dashboard or My Students to open a specific intervention here.
                    </p>
                </header>
                <button
                    type="button"
                    onClick={onCancelEdit}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/10 border border-white/60 dark:border-white/15 text-slate-700 dark:text-slate-200 font-semibold transition hover:-translate-y-0.5"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Students
                </button>
            </section>
        );
    }

    return (
        <section
            className="mtss-theme relative overflow-hidden rounded-[36px] border border-cyan-200/60 dark:border-cyan-500/30 bg-gradient-to-br from-cyan-50/85 via-white/85 to-blue-50/80 dark:from-cyan-950/30 dark:via-slate-900/55 dark:to-blue-950/25 shadow-[0_30px_90px_rgba(8,145,178,0.18)] p-6 sm:p-8 space-y-6 backdrop-blur-2xl"
            data-aos="fade-up"
            data-aos-duration="700"
        >
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-16 -left-10 h-56 w-56 bg-gradient-to-br from-cyan-300/25 via-blue-300/20 to-transparent blur-[110px]" />
                <div className="absolute -bottom-14 right-0 h-64 w-64 bg-gradient-to-br from-sky-300/20 via-cyan-200/15 to-transparent blur-[130px]" />
            </div>
            <div className="relative space-y-6">
                <header className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-cyan-100/80 dark:bg-cyan-900/35 border border-cyan-200/70 dark:border-cyan-500/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700 dark:text-cyan-200">
                        <PencilLine className="w-4 h-4" />
                        Edit Intervention
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black leading-tight text-slate-800 dark:text-white">
                        Update active intervention plan
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-200 max-w-2xl">
                        This workspace is dedicated for plan updates only, separate from create flow to avoid confusion.
                    </p>
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-50/80 px-3 py-1 text-xs font-semibold text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-900/30 dark:text-cyan-200">
                            Editing: {editingPlan?.studentName || "Student"} {editingPlan?.focusLabel ? `(${editingPlan.focusLabel})` : ""}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {contextItems.map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-2xl border border-cyan-200/70 bg-white/80 px-3 py-3 shadow-sm dark:border-cyan-500/25 dark:bg-white/5"
                                >
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-700/70 dark:text-cyan-200/70">
                                        {item.label}
                                    </p>
                                    <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white" title={item.value}>
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </header>

                <form className="space-y-5" onSubmit={onSubmit}>
                    <InterventionFormFields
                        formState={formState}
                        onChange={onChange}
                        students={students}
                        selectedStudent={selectedStudent}
                        filteredStrategies={filteredStrategies}
                        strategyFallbackActive={strategyFallbackActive}
                        loadingStrategies={loadingStrategies}
                        baseFieldClass={baseFieldClass}
                        textareaClass={textareaClass}
                        onStudentChange={handleStudentChange}
                        onStrategyChange={handleStrategyChange}
                        isEditing
                    />

                    <div className="flex flex-wrap gap-3 pt-3">
                        <button
                            type="submit"
                            disabled={!isValid || submitting}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white font-semibold shadow-[0_18px_45px_rgba(14,116,214,0.28)] transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {submitting ? "Saving..." : "Save Plan Changes"}
                        </button>
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            disabled={submitting}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/85 dark:bg-white/10 border border-white/60 dark:border-white/15 text-slate-700 dark:text-slate-200 font-semibold transition hover:-translate-y-0.5 disabled:opacity-60"
                        >
                            Cancel Edit
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
});

EditInterventionPanel.displayName = "EditInterventionPanel";
export default EditInterventionPanel;
