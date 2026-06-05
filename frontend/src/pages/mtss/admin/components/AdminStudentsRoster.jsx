import { Users, Sparkles } from "lucide-react";
import StudentsTable from "../../components/StudentsTable";
import { TierPill, ProgressBadge } from "../../components/StatusPills";

const AdminStudentsRoster = ({
    pilotGuide = null,
    visibleStudents,
    activeSubjectLabel = "",
    filteredCount,
    filteredRowCount,
    selectedCount,
    mentorCount,
    onResetSelection,
    onClearFilters,
    onOpenAssign,
    disableAssignment,
    selectedIds,
    onToggleSelect,
    onViewStudent,
    onUpdateStudent,
    loadMoreRef,
    hasMoreStudents,
    isReadOnly = false,
}) => (
    <div
        className="glass glass-card mtss-card-surface p-6 rounded-[36px] border border-white/20 bg-gradient-to-br from-white/90 via-white/70 to-white/60 dark:from-white/10 dark:via-white/5 dark:to-white/5 backdrop-blur-2xl"
        data-aos="fade-up"
        data-aos-delay="120"
    >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
            <div className="space-y-1" data-aos="fade-right" data-aos-delay="150">
                <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Roster</p>
                <h3 className="text-2xl font-black text-foreground dark:text-white bg-gradient-to-r from-[#0ea5e9] via-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent">
                    MTSS support units
                </h3>
                <p className="text-sm text-muted-foreground max-w-xl">
                    {activeSubjectLabel
                        ? `Showing ${activeSubjectLabel} support only, so chips, owner, and update dates match the selected subject.`
                        : "Each row is one student; multi-subject support units open in Details with their own chip, progress, and update dates."}
                </p>
            </div>
            {!isReadOnly && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end" data-aos="fade-left" data-aos-delay="180">
                    <div className="flex items-center gap-3 w-full sm:w-auto px-4 py-2 rounded-2xl bg-gradient-to-r from-white/90 via-white/70 to-white/50 dark:from-white/10 dark:via-white/5 dark:to-white/0 border border-white/60 dark:border-white/10 shadow-inner shadow-white/40 dark:shadow-none">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#f472b6] to-[#facc15] dark:from-[#1d4ed8] dark:to-[#a855f7] text-white flex items-center justify-center shadow-lg shadow-rose-200/60 dark:shadow-none">
                            <Users className="w-4 h-4" />
                        </div>
                        <div className="text-sm font-semibold leading-tight text-slate-700 dark:text-white">
                            <span className="block">{selectedCount} selected</span>
                            <span className="text-xs font-normal text-slate-500 dark:text-white/60">
                                {mentorCount} mentors available
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={onResetSelection}
                            disabled={selectedCount === 0}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-full border text-sm font-semibold transition ${
                                selectedCount === 0
                                    ? "border-white/40 dark:border-white/10 text-slate-400 dark:text-white/30 cursor-not-allowed"
                                    : "border-white/70 dark:border-white/30 text-foreground dark:text-white bg-white/80 dark:bg-white/5 shadow-inner hover:-translate-y-0.5"
                            }`}
                        >
                            Clear selection
                        </button>
                        <button
                            disabled={disableAssignment}
                            onClick={onOpenAssign}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-2 transition ${
                                disableAssignment
                                    ? "bg-gradient-to-r from-slate-200 to-slate-100 dark:from-white/10 dark:to-white/5 text-slate-400 dark:text-white/40 cursor-not-allowed"
                                    : "bg-gradient-to-r from-[#34d399] via-[#3b82f6] to-[#a855f7] shadow-lg shadow-primary/30 hover:-translate-y-0.5"
                            }`}
                        >
                            <Sparkles className="w-4 h-4" />
                            Assign Selected
                        </button>
                    </div>
                </div>
            )}
        </div>
        {visibleStudents.length > 0 ? (
            <StudentsTable
                students={visibleStudents}
                TierPill={TierPill}
                ProgressBadge={ProgressBadge}
                showActions={!isReadOnly}
                pilotHintAction={pilotGuide?.studentAction || null}
                onView={onViewStudent}
                onUpdate={isReadOnly ? undefined : onUpdateStudent}
                selectable={!isReadOnly}
                selectedIds={isReadOnly ? [] : selectedIds}
                onSelect={isReadOnly ? undefined : onToggleSelect}
            />
        ) : (
            <div className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/80 p-8 text-center dark:border-white/15 dark:bg-white/5">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm dark:bg-white/10 dark:text-white/70">
                    <Users className="h-5 w-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">No support units match the selected filters.</h4>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-600 dark:text-white/60">
                    Try clearing filters or switching subject / focus area, such as Math, English, Behavior, or Attendance.
                </p>
                {onClearFilters && (
                    <button
                        type="button"
                        onClick={onClearFilters}
                        className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-white/90"
                    >
                        Clear filters
                    </button>
                )}
            </div>
        )}
        <div
            ref={loadMoreRef}
            className="mt-6 flex flex-col items-center gap-2 text-xs font-semibold text-muted-foreground"
            data-aos="fade-up"
            data-aos-delay="200"
        >
            <span>
                Showing {visibleStudents.length} of {filteredRowCount ?? filteredCount} student rows across {filteredCount} support units
            </span>
            {hasMoreStudents ? (
                <span className="px-3 py-1 rounded-full border border-white/50 dark:border-white/20 bg-white/70 dark:bg-white/5 text-[0.7rem] uppercase tracking-[0.3em]">
                    Scroll to load more
                </span>
            ) : (
                <span className="px-3 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400 text-[0.7rem] uppercase tracking-[0.3em]">
                    All caught up
                </span>
            )}
        </div>
    </div>
);

export default AdminStudentsRoster;
