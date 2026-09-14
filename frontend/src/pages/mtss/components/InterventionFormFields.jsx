import { memo } from "react";
import Dropdown from "./Dropdown";
import CalendarField from "./CalendarField";
import {
    INTERVENTION_TYPES,
    TIERS,
    DURATIONS,
    FREQUENCIES,
    WEEKDAYS,
    METHODS,
    SCORE_UNITS,
    GOAL_NOTES_MAX_LENGTH,
    MAX_CAPPED_SCORE,
    MAX_CUSTOM_DURATION_DAYS,
    getInterventionFormErrors,
} from "../config/interventionFormConfig";

const SCORE_CAPPED_UNITS = new Set(["%", "pts", "score"]);

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
    // Custom dropdown panel styling - a native <select>'s popup can't be
    // styled (browser-rendered), so every select in this form uses the
    // shared Dropdown component instead, with the panel matching the
    // field's own card styling.
    const dropdownPanelClass = "rounded-2xl border border-white/70 dark:border-white/15 bg-white dark:bg-slate-900 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)]";
    const errorTextClass = "text-xs font-medium text-rose-600 dark:text-rose-400";
    const errors = getInterventionFormErrors(formState);
    const scoreCapped = SCORE_CAPPED_UNITS.has(formState.baselineUnit);
    // The HTML `max`/`min` attributes on a number input only affect the
    // spinner arrows and :invalid state - they don't stop someone from
    // typing "10000000" directly. Clamp on every keystroke instead so the
    // value genuinely can't exceed the cap, not just show an error after
    // the fact.
    const clampScoreValue = (raw) => {
        if (raw === "") return raw;
        const num = Number(raw);
        if (!Number.isFinite(num)) return raw;
        let next = num;
        if (next < 0) next = 0;
        if (scoreCapped && next > MAX_CAPPED_SCORE) next = MAX_CAPPED_SCORE;
        return String(next);
    };

    // Duration is stored/sent to the backend as plain text (e.g. "8 weeks")
    // and parsed elsewhere (parseInt on the leading number, for the
    // "Week X of Y" progress display) - picking "Custom" alone has nothing
    // to parse, so it needs its own field, not just a dropdown entry.
    // Kept to a plain number of days (not free text like "3 months") so
    // there's no ambiguity about what unit was typed - the "days" label is
    // shown next to the input, not typed by the person.
    const presetDurations = DURATIONS.filter((duration) => duration !== "Custom");
    const isCustomDuration = Boolean(formState.duration) && !presetDurations.includes(formState.duration);
    const customDurationDays = isCustomDuration ? (formState.duration.match(/\d+/)?.[0] || "") : "";
    // Only append a synthetic option once real custom text has been typed -
    // the literal "Custom" marker is already one of DURATIONS itself.
    const durationOptions = isCustomDuration && formState.duration !== "Custom"
        ? [...DURATIONS.map((duration) => ({ value: duration, label: duration })), { value: formState.duration, label: formState.duration }]
        : DURATIONS.map((duration) => ({ value: duration, label: duration }));

    return (
        <>
            <div className="grid md:grid-cols-2 gap-4">
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <label className={labelClass}>
                        Student Name
                    </label>
                    <Dropdown
                        options={students.map((student) => ({ value: student.id, label: student.name }))}
                        value={formState.studentId}
                        onChange={(value) => onStudentChange({ target: { value } })}
                        placeholder="Select student"
                        searchPlaceholder="Search students..."
                        disabled={isEditing}
                        triggerClassName={fieldClass}
                        panelClassName={dropdownPanelClass}
                    />
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

            <div className="grid md:grid-cols-2 gap-4">
                    <div className={`${fieldWrap} flex flex-col gap-2`}>
                        <label className={labelClass}>
                            Subject / Focus Area
                        </label>
                        <Dropdown
                            options={INTERVENTION_TYPES
                                .filter((type) => !allowedSubjectKeys || allowedSubjectKeys.has(type.value))
                                .map((type) => ({ value: type.value, label: type.label }))}
                            value={formState.type}
                            onChange={(value) => onChange("type", value)}
                            placeholder="Select subject or focus area"
                            triggerClassName={fieldClass}
                            panelClassName={dropdownPanelClass}
                        />
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
                    <Dropdown
                        options={TIERS.map((tier) => ({ value: tier.value, label: tier.label }))}
                        value={formState.tier}
                        onChange={(value) => onChange("tier", value)}
                        placeholder="Select tier"
                        triggerClassName={fieldClass}
                        panelClassName={dropdownPanelClass}
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <label className={labelClass}>
                        Strategy Library
                    </label>
                    <Dropdown
                        options={filteredStrategies.map((strategy) => ({ value: strategy._id, label: strategy.name }))}
                        value={formState.strategyId || ""}
                        onChange={(value) => onStrategyChange({ target: { value } })}
                        placeholder={loadingStrategies ? "Loading strategies..." : "Select strategy"}
                        searchPlaceholder="Search strategies..."
                        disabled={loadingStrategies}
                        triggerClassName={fieldClass}
                        panelClassName={dropdownPanelClass}
                    />
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
                    <Dropdown
                        options={durationOptions}
                        value={formState.duration}
                        onChange={(value) => onChange("duration", value)}
                        placeholder="Select duration"
                        triggerClassName={fieldClass}
                        panelClassName={dropdownPanelClass}
                    />
                    {isCustomDuration && (
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                max={MAX_CUSTOM_DURATION_DAYS}
                                className={`${fieldClass} flex-1`}
                                placeholder="e.g. 100"
                                value={customDurationDays}
                                onChange={(e) => {
                                    // Clamp on keystroke, same reasoning as
                                    // baseline/target above - `max` alone
                                    // doesn't stop someone typing "1000".
                                    const digits = e.target.value.replace(/\D/g, "");
                                    if (!digits) { onChange("duration", "Custom"); return; }
                                    const clamped = Math.min(Number(digits), MAX_CUSTOM_DURATION_DAYS);
                                    onChange("duration", `${clamped} days`);
                                }}
                            />
                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-300">days</span>
                        </div>
                    )}
                    {errors.duration && <p className={errorTextClass}>{errors.duration}</p>}
                </div>
            </div>

            <div className={`${fieldWrap} flex flex-col gap-2`}>
                <div className="flex items-center justify-between">
                    <label className={labelClass}>Goal</label>
                    <span className="text-[11px] text-muted-foreground">{(formState.goal || "").length}/{GOAL_NOTES_MAX_LENGTH}</span>
                </div>
                <textarea
                    className={textareaFieldClass}
                    placeholder="Describe the intervention goal..."
                    maxLength={GOAL_NOTES_MAX_LENGTH}
                    value={formState.goal}
                    onChange={(e) => onChange("goal", e.target.value)}
                />
                {errors.goal && <p className={errorTextClass}>{errors.goal}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <label className={labelClass}>Start Date</label>
                    <CalendarField
                        value={formState.startDate}
                        onChange={(value) => onChange("startDate", value)}
                        placeholder="Select date"
                        className={fieldClass}
                    />
                </div>
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <label className={labelClass}>Monitoring Frequency</label>
                    <Dropdown
                        options={FREQUENCIES.map((frequency) => ({ value: frequency, label: frequency }))}
                        value={formState.monitorFrequency}
                        onChange={(value) => onChange("monitorFrequency", value)}
                        placeholder="Select frequency"
                        triggerClassName={fieldClass}
                        panelClassName={dropdownPanelClass}
                    />
                    {formState.monitorFrequency === "Custom" && (
                        <p className="text-xs text-muted-foreground">Pick the exact check-in days below instead of Daily/Weekly/Bi-weekly.</p>
                    )}
                </div>
            </div>

            {formState.monitorFrequency === "Custom" && (
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200/40 dark:border-blue-700/30">
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

            <div className="grid md:grid-cols-2 gap-4">
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <label className={labelClass}>Monitoring Method</label>
                    <Dropdown
                        options={METHODS.map((method) => ({ value: method, label: method }))}
                        value={formState.monitorMethod}
                        onChange={(value) => onChange("monitorMethod", value)}
                        placeholder="Select method"
                        triggerClassName={fieldClass}
                        panelClassName={dropdownPanelClass}
                    />
                </div>
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <div className="flex items-center justify-between">
                        <label className={labelClass}>Notes</label>
                        <span className="text-[11px] text-muted-foreground">{(formState.notes || "").length}/{GOAL_NOTES_MAX_LENGTH}</span>
                    </div>
                    <textarea
                        className={textareaFieldClass}
                        placeholder="Add context or reminders..."
                        maxLength={GOAL_NOTES_MAX_LENGTH}
                        value={formState.notes}
                        onChange={(e) => onChange("notes", e.target.value)}
                    />
                    {errors.notes && <p className={errorTextClass}>{errors.notes}</p>}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <label className={labelClass}>Baseline Score</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min="0"
                            max={scoreCapped ? MAX_CAPPED_SCORE : undefined}
                            className={dualFieldClass}
                            placeholder="e.g. 45"
                            value={formState.baselineValue}
                            onChange={(e) => onChange("baselineValue", clampScoreValue(e.target.value))}
                        />
                        <div className="w-28">
                            <Dropdown
                                options={SCORE_UNITS.map((unit) => ({ value: unit, label: unit }))}
                                value={formState.baselineUnit}
                                onChange={(value) => { onChange("baselineUnit", value); onChange("targetUnit", value); }}
                                placeholder="Unit"
                                triggerClassName={fieldClass}
                                panelClassName={dropdownPanelClass}
                            />
                        </div>
                    </div>
                    {scoreCapped && <p className="text-[11px] text-muted-foreground">0-{MAX_CAPPED_SCORE} for this unit.</p>}
                    {errors.baselineValue && <p className={errorTextClass}>{errors.baselineValue}</p>}
                </div>
                <div className={`${fieldWrap} flex flex-col gap-2`}>
                    <label className={labelClass}>Target Score</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min="0"
                            max={scoreCapped ? MAX_CAPPED_SCORE : undefined}
                            className={dualFieldClass}
                            placeholder="e.g. 70"
                            value={formState.targetValue}
                            onChange={(e) => onChange("targetValue", clampScoreValue(e.target.value))}
                        />
                        <div className="px-4 py-3 rounded-2xl bg-white/70 dark:bg-white/10 border border-white/40 dark:border-white/10 text-sm text-slate-500 dark:text-slate-300 w-28 flex items-center">
                            {formState.baselineUnit || "score"}
                        </div>
                    </div>
                    {scoreCapped && <p className="text-[11px] text-muted-foreground">0-{MAX_CAPPED_SCORE} for this unit.</p>}
                    {errors.targetValue && <p className={errorTextClass}>{errors.targetValue}</p>}
                </div>
            </div>
        </>
    );
});

InterventionFormFields.displayName = "InterventionFormFields";
export default InterventionFormFields;
