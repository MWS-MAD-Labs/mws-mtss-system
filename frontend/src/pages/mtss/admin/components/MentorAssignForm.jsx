import { memo } from "react";

const MentorAssignForm = memo(({
    tier,
    tierOptions,
    focusInput,
    notes,
    selectedStudents,
    selectedIds,
    submitting,
    onTierChange,
    onFocusChange,
    onNotesChange,
    onCancel,
    onSubmit,
    children // For StudentSelectionList
}) => (
    <form onSubmit={onSubmit} className="space-y-6" data-aos="fade-up" data-aos-delay="260">
        <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
            <label className="space-y-2 text-sm font-semibold text-foreground dark:text-white">
                <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    Tier <span className="text-[10px] text-rose-500">Required</span>
                </span>
                <select
                    value={tier}
                    onChange={(event) => onTierChange(event.target.value)}
                    className="w-full rounded-2xl border border-border/50 bg-white/95 dark:bg-white/10 px-4 py-3 focus:ring-2 focus:ring-primary/40 shadow-inner"
                >
                    {tierOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </label>
            <label className="space-y-2 text-sm font-semibold text-foreground dark:text-white">
                <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    Focus areas <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/40 text-muted-foreground">Optional</span>
                </span>
                <input
                    value={focusInput}
                    onChange={(event) => onFocusChange(event.target.value)}
                    placeholder="Fluency boost, SEL routines"
                    className="w-full rounded-2xl border border-border/50 bg-white/95 dark:bg-white/10 px-4 py-3 focus:ring-2 focus:ring-primary/40 shadow-inner"
                />
            </label>
        </div>

        <label className="space-y-2 text-sm font-semibold text-foreground dark:text-white">
            <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                Notes <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/40 text-muted-foreground">Optional</span>
            </span>
            <textarea
                value={notes}
                onChange={(event) => onNotesChange(event.target.value)}
                placeholder="Add optional context, routines, or student highlights..."
                className="w-full h-28 rounded-2xl border border-border/50 bg-white/95 dark:bg-white/10 px-4 py-3 resize-none focus:ring-2 focus:ring-primary/40 shadow-inner"
            />
        </label>

        {selectedStudents.length > 0 && (
            <div
                className="rounded-[24px] bg-gradient-to-r from-[#ecfeff]/90 via-[#fef9c3]/80 to-[#fce7f3]/80 dark:from-white/10 dark:via-white/5 dark:to-white/5 border border-white/60 dark:border-white/10 p-4 flex flex-wrap gap-2 text-sm"
                data-aos="fade-up"
                data-aos-delay="320"
            >
                {selectedStudents.slice(0, 6).map((student) => (
                    <span key={student.id || student._id} className="px-3 py-1 rounded-full bg-white/80 dark:bg-white/10 border border-white/60 dark:border-white/20 text-foreground dark:text-white">
                        {student.name}
                    </span>
                ))}
                {selectedStudents.length > 6 && (
                    <span className="px-3 py-1 rounded-full bg-white/70 dark:bg-white/10 border border-white/40 dark:border-white/20 text-muted-foreground">
                        +{selectedStudents.length - 6} more
                    </span>
                )}
            </div>
        )}

        {children}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-full border border-border/60 text-sm font-semibold text-foreground dark:text-white bg-white/80 dark:bg-white/5 hover:shadow"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={submitting || selectedIds.length < 2}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold text-white transition ${
                    submitting || selectedIds.length < 2
                        ? "bg-muted cursor-not-allowed opacity-60"
                        : "bg-gradient-to-r from-[#22d3ee] via-[#3b82f6] to-[#a855f7] shadow-xl hover:-translate-y-0.5"
                }`}
            >
                {submitting ? "Assigning..." : "Assign Selected"}
            </button>
        </div>
    </form>
));

MentorAssignForm.displayName = "MentorAssignForm";
export default MentorAssignForm;
