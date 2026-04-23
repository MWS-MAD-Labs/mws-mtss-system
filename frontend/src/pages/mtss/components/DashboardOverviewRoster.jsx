import { useEffect, useMemo, useState } from "react";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import StudentsTable from "./StudentsTable";

const BATCH = 10;

const DashboardOverviewRoster = ({ students, TierPill, ProgressBadge, onView, onUpdate, onEditPlan, canEditPlanForStudent }) => {
    const [visibleCount, setVisibleCount] = useState(BATCH);

    useEffect(() => {
        setVisibleCount(BATCH);
    }, [students.length]);

    const visibleStudents = useMemo(
        () => (students || []).slice(0, Math.min(visibleCount, students.length)),
        [students, visibleCount],
    );

    const hasMore = visibleStudents.length < students.length;
    const progressPercent = students.length ? Math.round((visibleStudents.length / students.length) * 100) : 0;

    return (
        <section className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden border border-white/40 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
            {/* Header */}
            <div className="relative px-5 py-5 sm:px-7 sm:py-6 border-b border-slate-100 dark:border-slate-800/80">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-bl from-[#818cf8]/10 to-transparent blur-[60px]" />
                </div>
                <div className="relative flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
                                Live Roster
                            </p>
                        </div>
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-white mt-1">
                            Kids on your radar today
                        </h2>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <span className="px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200/50 dark:border-indigo-500/20 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                            {students.length} students
                        </span>
                    </div>
                </div>
            </div>

            {/* Table content */}
            <div className="px-3 py-4 sm:px-5 sm:py-5 lg:px-7" data-aos="fade-up" data-aos-delay="120">
                <StudentsTable
                    students={visibleStudents}
                    TierPill={TierPill}
                    ProgressBadge={ProgressBadge}
                    dense
                    showActions
                    onView={onView}
                    onUpdate={onUpdate}
                    onEditPlan={onEditPlan}
                    canEditPlanForStudent={canEditPlanForStudent}
                />
            </div>

            {/* Footer with load more */}
            <div className="px-5 pb-5 sm:px-7 sm:pb-6">
                <div className="flex flex-col items-center gap-3">
                    {/* Progress bar */}
                    <div className="w-full max-w-xs">
                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <p className="text-[10px] sm:text-xs text-center text-slate-400 dark:text-slate-500 mt-1.5">
                            {visibleStudents.length} of {students.length} shown
                        </p>
                    </div>

                    {hasMore ? (
                        <button
                            type="button"
                            onClick={() => setVisibleCount((prev) => Math.min(students.length, prev + BATCH))}
                            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-[0_8px_25px_rgba(99,102,241,0.3)] hover:shadow-[0_12px_35px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <span>Show more</span>
                            <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                        </button>
                    ) : students.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/20 text-sm font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            All students loaded
                        </span>
                    ) : null}
                </div>
            </div>
        </section>
    );
};

export default DashboardOverviewRoster;
