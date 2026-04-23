import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { getProgressAssignmentOptions } from "../utils/editPlanAccess";
import { SKIP_REASONS } from "../config/interventionFormConfig";

const readonlyField =
    "px-4 py-3 rounded-2xl bg-white/70 dark:bg-white/10 border border-primary/10 text-sm text-muted-foreground";
const hasValue = (value) => value !== null && value !== undefined && value !== "";

const resolveGoalValue = (option) => {
    if (!option) return null;
    if (hasValue(option.goal)) return option.goal;
    const goals = option.goals;
    if (typeof goals === "string") return goals;
    if (!Array.isArray(goals) || goals.length === 0) return null;
    const entry = goals.find((goal) => goal);
    if (!entry) return null;
    if (typeof entry === "string") return entry;
    return entry.description || entry.goal || entry.title || entry.name || null;
};

const formatScoreValue = (score, fallbackUnit) => {
    if (score === null || score === undefined || score === "") return null;
    if (typeof score === "number" || typeof score === "string") {
        const text = `${score}`.trim();
        if (!text) return null;
        return `${text}${fallbackUnit ? ` ${fallbackUnit}` : ""}`;
    }
    const value = score?.value ?? score?.score ?? score?.amount;
    if (value === null || value === undefined || value === "") return null;
    const unit = score?.unit || fallbackUnit;
    return `${value}${unit ? ` ${unit}` : ""}`;
};

const buildMonitoringLabel = (option) => {
    const parts = [option?.monitoringMethod, option?.monitoringFrequency].filter((part) => hasValue(part));
    return parts.length ? parts.join(" / ") : "Not set";
};

const buildBaselineTargetLabel = (option) => {
    const baseline = formatScoreValue(option?.baselineScore, option?.metricLabel);
    const target = formatScoreValue(option?.targetScore, option?.metricLabel);
    if (!baseline && !target) return "Not set";
    return `${baseline || "Not set"} to ${target || "Not set"}`;
};

const getAssignmentOptions = (student) => {
    if (!student) return [];
    const raw = getProgressAssignmentOptions(student);
    if (raw.length) return raw;
    return [];
};

const getEscalatedOptions = (options = []) => {
    const escalated = options.filter((o) => o.tierCode && o.tierCode !== "tier1");
    return escalated.length ? escalated : options;
};

const formatSubjectLabel = (option) => {
    const focus = option.focus || option.label || "Focused Support";
    const tier = option.tier || "Tier 1";
    return `${focus} - ${tier}`;
};

const ProgressFormPanel = memo(
    ({ formState, onChange, onSubmit, baseFieldClass, textareaClass, students = [], submitting = false }) => {
        const selectedStudent = useMemo(
            () => students.find((student) => student.id === formState.studentId),
            [students, formState.studentId],
        );

        const assignmentOptions = useMemo(
            () => getEscalatedOptions(getAssignmentOptions(selectedStudent)),
            [selectedStudent],
        );

        const selectedOption = useMemo(
            () => assignmentOptions.find((o) => o.assignmentId === formState.assignmentId) || assignmentOptions[0],
            [assignmentOptions, formState.assignmentId],
        );

        const lockedUnit = selectedOption?.metricLabel || "score";
        const strategyDetail = selectedOption?.strategyName || selectedOption?.strategy || selectedOption?.focus || "Not set";
        const goalDetail = resolveGoalValue(selectedOption) || "Not set";
        const durationDetail = selectedOption?.duration || "Ongoing";
        const monitoringDetail = buildMonitoringLabel(selectedOption);
        const baselineTargetDetail = buildBaselineTargetLabel(selectedOption);

        const handleStudentChange = (event) => {
            const value = event.target.value;
            const student = students.find((candidate) => candidate.id === value);
            onChange("studentId", value);
            onChange("studentName", student?.name || "");

            const options = getEscalatedOptions(getAssignmentOptions(student));
            const firstOption = options[0];
            onChange("assignmentId", firstOption?.assignmentId || student?.assignmentId || "");
            onChange("scoreUnit", firstOption?.metricLabel || "score");
        };

        const handleAssignmentChange = (event) => {
            const id = event.target.value;
            onChange("assignmentId", id);
            const option = assignmentOptions.find((o) => o.assignmentId === id);
            onChange("scoreUnit", option?.metricLabel || "score");
        };

        const isValid = Boolean(formState.studentId && formState.date && formState.scoreValue !== "");

        return (
            <motion.section
                className="mtss-theme rounded-[32px] border border-white/40 bg-white/90 dark:bg-slate-900/40 shadow-[0_25px_80px_rgba(15,23,42,0.12)] p-6 space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <header>
                    <p className="uppercase text-xs tracking-[0.4em] text-muted-foreground">Progress Ping</p>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Log today's glow</h2>
                    <p className="text-sm text-muted-foreground">
                        Share check-in data, SEL notes, and small wins to keep the MTSS trail fresh.
                    </p>
                </header>
                <form className="space-y-5" onSubmit={onSubmit}>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                                Student Name
                            </label>
                            <select className={baseFieldClass} value={formState.studentId} onChange={handleStudentChange}>
                                <option value="">Select student</option>
                                {students.map((student) => (
                                    <option key={student.id} value={student.id}>
                                        {student.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                                Grade / Tier
                            </label>
                            <div className={readonlyField}>
                                {selectedStudent
                                    ? `${selectedStudent.grade || "Grade"} - ${selectedStudent.tier || "Tier 1"}`
                                    : "Select a student to view current tier"}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                            Focus Subject
                        </label>
                        <select
                            className={baseFieldClass}
                            value={formState.assignmentId}
                            onChange={handleAssignmentChange}
                            disabled={!assignmentOptions.length}
                        >
                            {assignmentOptions.length ? (
                                assignmentOptions.map((option) => (
                                    <option key={option.assignmentId} value={option.assignmentId}>
                                        {formatSubjectLabel(option)}
                                    </option>
                                ))
                            ) : (
                                <option value="">No subjects you can update</option>
                            )}
                        </select>
                    </div>

                    {selectedOption && (
                        <div className="rounded-2xl border border-white/40 bg-white/80 dark:bg-white/5 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                                Intervention Details
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3 mt-3">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                                        Strategy
                                    </label>
                                    <div className={readonlyField}>{strategyDetail}</div>
                                </div>
                                <div className="flex flex-col gap-2 sm:col-span-2">
                                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                                        Goal
                                    </label>
                                    <div className={readonlyField}>{goalDetail}</div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                                        Duration
                                    </label>
                                    <div className={readonlyField}>{durationDetail}</div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                                        Monitoring Method / Frequency
                                    </label>
                                    <div className={readonlyField}>{monitoringDetail}</div>
                                </div>
                                <div className="flex flex-col gap-2 sm:col-span-2">
                                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                                        Baseline to Target
                                    </label>
                                    <div className={readonlyField}>{baselineTargetDetail}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                                Date of Update
                            </label>
                            <input
                                type="date"
                                className={baseFieldClass}
                                value={formState.date}
                                onChange={(e) => onChange("date", e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                                Intervention Performed?
                            </label>
                            <select
                                className={baseFieldClass}
                                value={formState.performed}
                                onChange={(e) => onChange("performed", e.target.value)}
                            >
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>
                    </div>

                    {formState.performed === "no" && (
                        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200/40 dark:border-amber-700/30">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 dark:text-amber-400">
                                    Reason Not Performed
                                </label>
                                <select
                                    className={baseFieldClass}
                                    value={formState.skipReason}
                                    onChange={(e) => onChange("skipReason", e.target.value)}
                                >
                                    <option value="">Select a reason...</option>
                                    {SKIP_REASONS.map((reason) => (
                                        <option key={reason.value} value={reason.value}>{reason.label}</option>
                                    ))}
                                </select>
                            </div>
                            {formState.skipReason === "other" && (
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 dark:text-amber-400">
                                        Please specify
                                    </label>
                                    <input
                                        type="text"
                                        className={baseFieldClass}
                                        placeholder="Describe the reason..."
                                        value={formState.skipReasonNote}
                                        onChange={(e) => onChange("skipReasonNote", e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                                Status or Score
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    className={`${baseFieldClass} flex-1`}
                                    placeholder="e.g. 72"
                                    value={formState.scoreValue}
                                    onChange={(e) => onChange("scoreValue", e.target.value)}
                                />
                                <div className={`${readonlyField} w-28 flex items-center justify-center font-semibold`}>
                                    {lockedUnit}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                                Celebration Emoji
                            </label>
                            <select
                                className={baseFieldClass}
                                value={formState.badge || "🎉 Progress Party"}
                                onChange={(e) => onChange("badge", e.target.value)}
                            >
                                <option value="🎉 Progress Party">🎉 Progress Party</option>
                                <option value="🌟 Stellar Boost">🌟 Stellar Boost</option>
                                <option value="🎯 Focus Mode">🎯 Focus Mode</option>
                                <option value="👏 Great Effort">👏 Great Effort</option>
                                <option value="🏅 Milestone Hit">🏅 Milestone Hit</option>
                                <option value="📈 Growth Spurt">📈 Growth Spurt</option>
                                <option value="🌱 Keep Going">🌱 Keep Going</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                            Notes & Observations
                        </label>
                        <textarea
                            className={textareaClass}
                            placeholder="Describe student's progress, challenges, or celebrations..."
                            value={formState.notes}
                            onChange={(e) => onChange("notes", e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-3 pt-3">
                        <motion.button
                            type="submit"
                            disabled={!isValid || submitting}
                            className="mtss-rainbow-chip mtss-rainbow-chip--emerald inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
                            {submitting ? "Saving..." : "Submit Progress Update"}
                        </motion.button>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-muted text-foreground font-semibold"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </motion.section>
        );
    },
);

ProgressFormPanel.displayName = "ProgressFormPanel";
export default ProgressFormPanel;
