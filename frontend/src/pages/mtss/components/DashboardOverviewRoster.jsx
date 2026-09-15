import { useEffect, useMemo, useState } from "react";
import StudentsTable from "./StudentsTable";
import RosterPagination from "./RosterPagination";

const PAGE_SIZE = 10;

const DashboardOverviewRoster = ({ students, TierPill, ProgressBadge, onView, onUpdate, onEditPlan, canEditPlanForStudent }) => {
    const [page, setPage] = useState(1);

    const rosterStudents = useMemo(() => (Array.isArray(students) ? students : []), [students]);
    const totalPages = Math.max(1, Math.ceil(rosterStudents.length / PAGE_SIZE));

    useEffect(() => {
        setPage(1);
    }, [rosterStudents.length]);

    // Clamp instead of reset when the list shrinks out from under a page
    // the person is already sitting on (e.g. a filter removes rows) -
    // jumping straight back to page 1 would be more disorienting.
    useEffect(() => {
        setPage((current) => Math.min(current, totalPages));
    }, [totalPages]);

    const visibleStudents = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return rosterStudents.slice(start, start + PAGE_SIZE);
    }, [rosterStudents, page]);

    const rangeStart = rosterStudents.length ? (page - 1) * PAGE_SIZE + 1 : 0;
    const rangeEnd = Math.min(page * PAGE_SIZE, rosterStudents.length);

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
                            Students on your radar today
                        </h2>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <span className="px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200/50 dark:border-indigo-500/20 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                            {rosterStudents.length} students
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
                    compactRoster
                    showActions
                    onView={onView}
                    onUpdate={onUpdate}
                    onEditPlan={onEditPlan}
                    canEditPlanForStudent={canEditPlanForStudent}
                />
            </div>

            {/* Footer with pagination */}
            {rosterStudents.length > 0 && (
                <div className="px-5 pb-5 sm:px-7 sm:pb-6">
                    <RosterPagination
                        page={page}
                        totalPages={totalPages}
                        setPage={setPage}
                        rangeStart={rangeStart}
                        rangeEnd={rangeEnd}
                        totalCount={rosterStudents.length}
                    />
                </div>
            )}
        </section>
    );
};

export default DashboardOverviewRoster;
