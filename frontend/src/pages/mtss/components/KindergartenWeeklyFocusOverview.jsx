import { memo, useMemo } from "react";

const WEEKLY_FOCUS_META = {
    continue: { label: "Continue", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", priority: 1 },
    try: { label: "Try", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", priority: 2 },
    support_needed: { label: "Support Needed", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", priority: 3 },
};

const SIGNAL_META = {
    emerging: { label: "🌱 Emerging", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
    developing: { label: "🌿 Developing", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
    consistent: { label: "🌳 Consistent", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
};

const isKindergartenStudent = (student = {}) =>
    /kindergarten/i.test(student?.grade || student?.currentGrade || student?.className || "");

const toSafeDate = (value) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value) => {
    const parsed = toSafeDate(value);
    if (!parsed) return "No data yet";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parsed);
};

const getLatestHistoryEntry = (student = {}) => {
    const history = Array.isArray(student?.profile?.history) ? student.profile.history : [];
    return history.find((entry) => entry?.weeklyFocus || entry?.signal || entry?.notes) || null;
};

const buildOverviewRows = (students = []) =>
    students
        .filter(isKindergartenStudent)
        .map((student) => {
            const options = Array.isArray(student.assignmentOptions) ? student.assignmentOptions : [];
            const withOverview = options
                .map((option) => ({
                    assignmentId: option.assignmentId,
                    overview: option.weeklyFocusOverview,
                    latest: option.weeklyFocusOverview?.latest || null,
                    latestSignal: option.weeklyFocusOverview?.latestSignal || null,
                }))
                .filter((entry) => entry.latest || entry.latestSignal)
                .sort((a, b) => {
                    const aDate = toSafeDate(a.latest?.date || a.latestSignal?.date)?.getTime() || 0;
                    const bDate = toSafeDate(b.latest?.date || b.latestSignal?.date)?.getTime() || 0;
                    return bDate - aDate;
                });

            const chosen = withOverview[0] || null;
            const history = getLatestHistoryEntry(student);
            const latestFocus = chosen?.latest?.value || history?.weeklyFocus || null;
            const latestSignal = chosen?.latest?.signal || chosen?.latestSignal?.value || history?.signal || null;
            const latestDate = chosen?.latest?.date || chosen?.latestSignal?.date || history?.date || null;
            const latestNextStep = chosen?.latest?.nextStep || history?.nextStep || null;
            const streak = chosen?.overview?.supportNeededStreak || 0;
            const escalationSuggested = Boolean(chosen?.overview?.escalationSuggested);

            return {
                id: student.id || student.slug || student.name,
                name: student.name || "Student",
                grade: student.grade || student.currentGrade || "Kindergarten",
                focus: latestFocus,
                signal: latestSignal,
                latestDate,
                nextStep: latestNextStep,
                supportNeededStreak: streak,
                escalationSuggested,
            };
        })
        .sort((a, b) => {
            const aPriority = WEEKLY_FOCUS_META[a.focus]?.priority || 0;
            const bPriority = WEEKLY_FOCUS_META[b.focus]?.priority || 0;
            if (aPriority !== bPriority) return bPriority - aPriority;
            const aDate = toSafeDate(a.latestDate)?.getTime() || 0;
            const bDate = toSafeDate(b.latestDate)?.getTime() || 0;
            return bDate - aDate;
        });

const KindergartenWeeklyFocusOverview = memo(({ students = [] }) => {
    const rows = useMemo(() => buildOverviewRows(students), [students]);
    const supportNeededCount = rows.filter((row) => row.focus === "support_needed").length;

    if (!rows.length) return null;

    return (
        <section className="rounded-[28px] border border-white/40 bg-white/90 dark:bg-slate-900/45 p-5 sm:p-6 shadow-[0_10px_36px_rgba(15,23,42,0.11)]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Kindergarten Weekly Focus</p>
                    <h4 className="text-lg font-semibold text-foreground">Overview per Child</h4>
                </div>
                <div className="text-xs text-muted-foreground">
                    {rows.length} students • {supportNeededCount} need follow-up support
                </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {rows.map((row) => (
                    <article key={row.id} className="rounded-2xl border border-primary/15 bg-white/80 dark:bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold text-foreground">{row.name}</p>
                                <p className="text-[11px] text-muted-foreground">{row.grade}</p>
                            </div>
                            <span className="text-[11px] text-muted-foreground">{formatDate(row.latestDate)}</span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                            {row.focus ? (
                                <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${WEEKLY_FOCUS_META[row.focus]?.color || ""}`}>
                                    {WEEKLY_FOCUS_META[row.focus]?.label || row.focus}
                                </span>
                            ) : (
                                <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                    Weekly focus not set
                                </span>
                            )}
                            {row.signal && (
                                <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${SIGNAL_META[row.signal]?.color || ""}`}>
                                    {SIGNAL_META[row.signal]?.label || row.signal}
                                </span>
                            )}
                        </div>

                        {row.nextStep && (
                            <p className="mt-3 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">Next:</span> {row.nextStep}
                            </p>
                        )}

                        {row.supportNeededStreak > 0 && (
                            <p className={`mt-2 text-xs ${row.escalationSuggested ? "text-red-600 dark:text-red-300" : "text-amber-600 dark:text-amber-300"}`}>
                                Support needed streak: {row.supportNeededStreak} check-in
                                {row.supportNeededStreak > 1 ? "s" : ""}
                            </p>
                        )}
                    </article>
                ))}
            </div>
        </section>
    );
});

KindergartenWeeklyFocusOverview.displayName = "KindergartenWeeklyFocusOverview";

export default KindergartenWeeklyFocusOverview;
