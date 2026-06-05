import { memo, useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { fetchStrategies } from "@/services/mtssService";
import { filterStrategiesByType, validateInterventionForm } from "../config/interventionFormConfig";
import { resolveAllowedSubjectKeys } from "../utils/editPlanAccess";
import InterventionFormFields from "./InterventionFormFields";
import PilotTaskHintBanner from "./PilotTaskHintBanner";

const InterventionFormPanel = memo(({
    formState,
    pilotGuide = null,
    onChange,
    onSubmit,
    baseFieldClass,
    textareaClass,
    students = [],
    submitting = false,
    isEditing = false,
    editingPlan = null,
    user = null,
}) => {
    const [strategies, setStrategies] = useState([]);
    const [loadingStrategies, setLoadingStrategies] = useState(false);
    const [confirmPending, setConfirmPending] = useState(false);

    const handleFormSubmit = (e) => {
        if (isEditing && !confirmPending) {
            e.preventDefault();
            setConfirmPending(true);
            return;
        }
        setConfirmPending(false);
        onSubmit(e);
    };

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

    const allowedSubjectKeys = useMemo(
        () => resolveAllowedSubjectKeys(user, selectedStudent),
        [user, selectedStudent],
    );

    const handleStudentChange = (event) => {
        const value = event.target.value;
        const student = students.find((candidate) => candidate.id === value || candidate._id === value);
        const nextAllowed = resolveAllowedSubjectKeys(user, student || null);
        onChange("studentId", value);
        onChange("studentName", student?.name || "");
        onChange("grade", student?.grade || student?.currentGrade || "");
        onChange("className", student?.className || "");
        onChange("mode", "quantitative");
        // Reset type if it's no longer allowed for the newly selected student
        if (nextAllowed && formState.type && !nextAllowed.has(formState.type)) {
            onChange("type", "");
        }
    };

    const handleStrategyChange = (event) => {
        const strategyId = event.target.value;
        const strategy = strategies.find((item) => item._id === strategyId);
        onChange("strategyId", strategyId);
        onChange("strategyName", strategy?.name || "");
        if (strategy?.name && !formState.goal) {
            onChange("goal", strategy.overview || "");
        }
    };

    const isValid = validateInterventionForm(formState);

    return (
        <section
            className="mtss-theme relative overflow-hidden rounded-[36px] border border-white/50 dark:border-white/10 bg-white/75 dark:bg-slate-900/50 shadow-[0_30px_90px_rgba(15,23,42,0.18)] p-6 sm:p-8 space-y-6 backdrop-blur-2xl"
            data-aos="fade-up"
            data-aos-duration="700"
        >
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 -left-10 h-56 w-56 bg-gradient-to-br from-[var(--mtss-glow-pink)]/25 via-[var(--mtss-glow-blue)]/20 to-transparent blur-[120px]" />
                <div className="absolute -bottom-16 right-0 h-64 w-64 bg-gradient-to-br from-[var(--mtss-glow-cyan)]/20 via-[var(--mtss-glow-purple)]/15 to-transparent blur-[140px]" />
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_transparent_60%)] dark:opacity-20" />
            </div>
            <div className="relative space-y-6">
                {pilotGuide && (
                    <PilotTaskHintBanner guide={pilotGuide} actionLabel="Complete this form in order" />
                )}

                <header className="space-y-2" data-aos="fade-up" data-aos-delay="60">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-white/10 border border-white/60 dark:border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-slate-600 dark:text-slate-200">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Plan Builder
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black leading-tight bg-gradient-to-r from-[var(--mtss-heading-light-from)] via-[var(--mtss-heading-light-via)] to-[var(--mtss-heading-light-to)] dark:from-white dark:via-[var(--mtss-heading-dark-via)] dark:to-[var(--mtss-heading-dark-to)] text-transparent bg-clip-text">
                        {isEditing ? "Adjust the active intervention" : "Set up a focused MTSS intervention"}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-200 max-w-2xl">
                        {isEditing
                            ? "Refine method, frequency, strategy, and notes when the current plan needs a better fit."
                            : "Create a structured intervention with measurable baseline, target, and monitoring cadence."}
                    </p>
                    {isEditing && (
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-50/70 px-3 py-1 text-xs font-semibold text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-900/30 dark:text-cyan-200">
                            Editing: {editingPlan?.studentName || "Student"} {editingPlan?.focusLabel ? `(${editingPlan.focusLabel})` : ""}
                        </div>
                    )}
                    {isEditing && (
                        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-200">
                            <strong>What changes:</strong> strategy, goal, frequency, and monitoring method are updated on the active plan. <strong>What stays:</strong> all progress logs already recorded for this student are preserved and unaffected.
                        </div>
                    )}
                </header>

                <form className="space-y-5" onSubmit={handleFormSubmit}>
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
                        isEditing={isEditing}
                        allowedSubjectKeys={allowedSubjectKeys}
                    />

                    <div className="flex flex-wrap gap-3 pt-2">
                        {!confirmPending ? (
                            <button
                                type="submit"
                                disabled={!isValid || submitting}
                                className={`relative inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 text-white font-semibold shadow-[0_18px_45px_rgba(14,116,214,0.28)] transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    pilotGuide?.formAction === "save-plan" ? "ring-2 ring-amber-400/90 ring-offset-2 ring-offset-white dark:ring-amber-300 dark:ring-offset-slate-900 animate-pulse" : ""
                                }`}
                            >
                                {pilotGuide?.formAction === "save-plan" && (
                                    <span className="pointer-events-none absolute -top-3 right-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-lg animate-bounce">
                                        Save here
                                    </span>
                                )}
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {submitting ? "Saving..." : "Save Intervention Plan"}
                            </button>
                        ) : (
                            <div className="w-full rounded-2xl border border-rose-200/60 bg-rose-50/70 px-4 py-4 dark:border-rose-500/30 dark:bg-rose-900/20">
                                <p className="text-sm font-semibold text-rose-800 dark:text-rose-200 mb-3">
                                    Save changes to this active plan? Strategy, goal, and frequency will be updated. Existing progress logs are unaffected.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition"
                                    >
                                        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                        Yes, save changes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmPending(false)}
                                        className="inline-flex items-center px-4 py-2 rounded-full border border-rose-300/60 text-rose-700 dark:text-rose-200 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/30 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </section>
    );
});

InterventionFormPanel.displayName = "InterventionFormPanel";
export default InterventionFormPanel;
