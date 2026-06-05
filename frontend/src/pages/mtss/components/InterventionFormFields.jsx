import { memo } from "react";
import {
    INTERVENTION_TYPES,
    TIERS,
    DURATIONS,
    FREQUENCIES,
    WEEKDAYS,
    METHODS,
    SCORE_UNITS,
} from "../config/interventionFormConfig";

const InterventionFormFields = memo(({
    formState,
    onChange,
    students,
    selectedStudent,
    filteredStrategies,
    strategyFallbackActive = false,
    loadingStrategies,
    baseFieldClass,
    textareaClass,
    onStudentChange,
    onStrategyChange,
    isEditing = false,
    allowedSubjectKeys = null,
}) => {
    const fieldClass = `${baseFieldClass} bg-white/90 dark:bg-slate-900/50 border border-white/70 dark:border-white/15 shadow-[0_10px_30px_rgba(15,23,42,0.08)] focus:ring-2 focus:ring-primary/40`;
    const textareaFieldClass = `${textareaClass} bg-white/90 dark:bg-slate-900/50 border border-white/70 dark:border-white/15 shadow-[0_10px_30px_rgba(15,23,42,0.08)] focus:ring-2 focus:ring-primary/40`;
    const dualFieldClass = `${fieldClass} flex-1`;
    const fieldWrap = "rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4 shadow-inner";
    const labelClass = "text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-200";

    return (
        <>
            <div className="grid md:grid-cols-2 gap-4" data-aos="fade-up" data-aos-delay="90">
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <label className={labelClass}>
                        Student Name
                    </label>
                    <select
                        className={fieldClass}
                        value={formState.studentId}
                        onChange={onStudentChange}
                        disabled={isEditing}
                    >
                        <option value="">Select student</option>
                        {students.map((student) => (
                            <option key={student.id} value={student.id}>{student.name}</option>
                        ))}
                    </select>
                    {isEditing && (
                        <p className="text-xs text-muted-foreground">Student is locked while editing this intervention.</p>
                    )}
                </div>
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <label className={labelClass}>
                        Class Scope
                    </label>
                    <div className="px-4 py-3 rounded-2xl bg-gradient-to-r from-white/90 via-white/70 to-white/60 dark:from-white/10 dark:via-white/5 dark:to-white/5 border border-white/60 dark:border-white/10 text-sm text-slate-600 dark:text-slate-200">
                        {selectedStudent?.className || selectedStudent?.grade || formState.grade || "Filtered to your classes"}
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4" data-aos="fade-up" data-aos-delay="120">
                    <div className={`${fieldWrap} flex flex-col gap-2`}>
                        <label className={labelClass}>
                            Subject / Focus Area
                        </label>
                        <select className={fieldClass} value={formState.type} onChange={(e) => onChange("type", e.target.value)}>
                            <option value="">Select subject or focus area</option>
                            {INTERVENTION_TYPES
                                .filter((type) => !allowedSubjectKeys || allowedSubjectKeys.has(type.value))
                                .map((type) => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))
                            }
                        </select>
                        <p className="text-xs text-muted-foreground">
                            {allowedSubjectKeys
                                ? "Showing subjects you are assigned to teach for this student."
                                : "Examples: Math, English, Behavior, Attendance."}
                        </p>
                    </div>
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <label className={labelClass}>
                        Tier Level
                    </label>
                    <select className={fieldClass} value={formState.tier} onChange={(e) => onChange("tier", e.target.value)}>
                        {TIERS.map((tier) => (
                            <option key={tier.value} value={tier.value}>{tier.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4" data-aos="fade-up" data-aos-delay="150">
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <label className={labelClass}>
                        Strategy Library
                    </label>
                    <select className={fieldClass} value={formState.strategyId || ""} onChange={onStrategyChange} disabled={loadingStrategies}>
                        <option value="">{loadingStrategies ? "Loading strategies..." : "Select strategy"}</option>
                        {filteredStrategies.map((strategy) => (
                            <option key={strategy._id} value={strategy._id}>{strategy.name}</option>
                        ))}
                    </select>
                        <p className="text-xs text-muted-foreground">
                            {strategyFallbackActive
                                ? "No exact match for this focus area yet. Showing full strategy library."
                                : "Suggestions filtered by subject / focus area."}
                        </p>
                </div>
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <label className={labelClass}>
                        Duration
                    </label>
                    <select className={fieldClass} value={formState.duration} onChange={(e) => onChange("duration", e.target.value)}>
                        <option value="">Select duration</option>
                        {DURATIONS.map((duration) => (
                            <option key={duration} value={duration}>{duration}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={`${fieldWrap} flex flex-col gap-2`} data-aos="fade-up" data-aos-delay="170">
                <label className={labelClass}>Goal</label>
                <textarea className={textareaFieldClass} placeholder="Describe the intervention goal..." value={formState.goal} onChange={(e) => onChange("goal", e.target.value)} />
            </div>

            <div className="grid md:grid-cols-2 gap-4" data-aos="fade-up" data-aos-delay="190">
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <label className={labelClass}>Start Date</label>
                    <input type="date" className={fieldClass} value={formState.startDate} onChange={(e) => onChange("startDate", e.target.value)} />
                </div>
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <label className={labelClass}>Monitoring Frequency</label>
                    <select className={fieldClass} value={formState.monitorFrequency} onChange={(e) => onChange("monitorFrequency", e.target.value)}>
                        <option value="">Select frequency</option>
                        {FREQUENCIES.map((frequency) => (
                            <option key={frequency} value={frequency}>{frequency}</option>
                        ))}
                    </select>
                </div>
            </div>

            {formState.monitorFrequency === "Custom" && (
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200/40 dark:border-blue-700/30" data-aos="fade-up" data-aos-delay="165">
                    <label className={labelClass}>Select Days</label>
                    <div className="flex flex-wrap gap-2">
                        {WEEKDAYS.map((day) => {
                            const selected = (formState.customFrequencyDays || []).includes(day.value);
                            return (
                                <button
                                    key={day.value}
                                    type="button"
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                        selected
                                            ? "bg-primary text-white shadow-md"
                                            : "bg-white/80 dark:bg-white/10 border border-primary/20 text-muted-foreground hover:border-primary/40"
                                    }`}
                                    onClick={() => {
                                        const current = formState.customFrequencyDays || [];
                                        const updated = selected
                                            ? current.filter((d) => d !== day.value)
                                            : [...current, day.value];
                                        onChange("customFrequencyDays", updated);
                                    }}
                                >
                                    {day.label}
                                </button>
                            );
                        })}
                    </div>
                    <input
                        type="text"
                        className={fieldClass}
                        placeholder="Optional note, e.g. 'Morning sessions only'"
                        value={formState.customFrequencyNote || ""}
                        onChange={(e) => onChange("customFrequencyNote", e.target.value)}
                    />
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-4" data-aos="fade-up" data-aos-delay="210">
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <label className={labelClass}>Monitoring Method</label>
                    <select className={fieldClass} value={formState.monitorMethod} onChange={(e) => onChange("monitorMethod", e.target.value)}>
                        <option value="">Select method</option>
                        {METHODS.map((method) => (
                            <option key={method} value={method}>{method}</option>
                        ))}
                    </select>
                </div>
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <label className={labelClass}>Notes</label>
                    <textarea className={textareaFieldClass} placeholder="Add context or reminders..." value={formState.notes} onChange={(e) => onChange("notes", e.target.value)} />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4" data-aos="fade-up" data-aos-delay="230">
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <label className={labelClass}>Baseline Score</label>
                    <div className="flex gap-2">
                        <input type="number" className={dualFieldClass} placeholder="e.g. 45" value={formState.baselineValue} onChange={(e) => onChange("baselineValue", e.target.value)} />
                        <select className={`${fieldClass} w-28`} value={formState.baselineUnit} onChange={(e) => { onChange("baselineUnit", e.target.value); onChange("targetUnit", e.target.value); }}>
                            {SCORE_UNITS.map((unit) => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <label className={labelClass}>Target Score</label>
                    <div className="flex gap-2">
                        <input type="number" className={dualFieldClass} placeholder="e.g. 70" value={formState.targetValue} onChange={(e) => onChange("targetValue", e.target.value)} />
                        <div className="px-4 py-3 rounded-2xl bg-white/70 dark:bg-white/10 border border-white/40 dark:border-white/10 text-sm text-slate-500 dark:text-slate-300 w-28 flex items-center">
                            {formState.baselineUnit || "score"}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
});

InterventionFormFields.displayName = "InterventionFormFields";
export default InterventionFormFields;
