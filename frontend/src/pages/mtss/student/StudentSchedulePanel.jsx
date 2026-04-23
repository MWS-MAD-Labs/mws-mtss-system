import { memo, useMemo } from "react";
import { CalendarHeart, Clock3, Layers3, Target } from "lucide-react";
import { buildStudentProfileView } from "../utils/studentProfileUtils";
import { formatMentorDisplay } from "../utils/mentorNameUtils";
import EvidenceViewer from "../components/EvidenceViewer";

const normalizeGoals = (goals = []) => {
    if (!Array.isArray(goals)) return [];
    return goals
        .map((goal, idx) => {
            if (!goal) return null;
            if (typeof goal === "string") {
                return { id: `goal-${idx}`, label: goal, completed: false };
            }
            return {
                id: goal._id || goal.id || `goal-${idx}`,
                label: goal.description || goal.goal || goal.title || `Goal ${idx + 1}`,
                completed: Boolean(goal.completed),
            };
        })
        .filter(Boolean);
};

const toTimestamp = (value) => {
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatReviewDate = (value, fallback = "Awaiting schedule") => {
    if (!value) return fallback;
    try {
        return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
    } catch (error) {
        return fallback;
    }
};

const StudentSchedulePanel = ({ student, isLoading = false }) => {
    const sortedInterventions = useMemo(() => {
        if (!student) return [];
        return buildStudentProfileView(student).sortedInterventions || [];
    }, [student]);

    const interventions = useMemo(() => {
        const withRealData = sortedInterventions.filter((item) => item.hasRealData);
        return withRealData.length ? withRealData : sortedInterventions;
    }, [sortedInterventions]);

    const allGoals = useMemo(
        () =>
            interventions.flatMap((intervention) =>
                normalizeGoals(intervention.goals).map((goal) => ({
                    ...goal,
                    subject: intervention.label || intervention.type || "Intervention",
                })),
            ),
        [interventions],
    );

    const timeline = useMemo(
        () =>
            interventions
                .flatMap((intervention) =>
                    (Array.isArray(intervention.history) ? intervention.history : []).map((entry, index) => ({
                        id: `${intervention.type || intervention.label || "intervention"}-${entry?.date || "timeline"}-${index}`,
                        subject: intervention.label || intervention.type || "Intervention",
                        date: entry?.date || "Recent",
                        dateRaw: entry?.dateRaw || entry?.createdAt || entry?.date,
                        notes: entry?.notes || "Check-in recorded",
                        evidence: Array.isArray(entry?.evidence) ? entry.evidence : [],
                        mentor: formatMentorDisplay({
                            name: intervention.mentor,
                            nickname: intervention.mentorNickname,
                            username: intervention.mentorUsername,
                            gender: intervention.mentorGender,
                        }),
                    })),
                )
                .sort((a, b) => toTimestamp(b.dateRaw || b.date) - toTimestamp(a.dateRaw || a.date))
                .slice(0, 12),
        [interventions],
    );

    if (isLoading) {
        return (
            <div className="rounded-[30px] border border-white/80 bg-white/90 p-8 text-center text-sm text-slate-700 shadow-sm dark:border-white/20 dark:bg-slate-900/82 dark:text-slate-200">
                Loading intervention schedule...
            </div>
        );
    }

    if (!student) {
        return (
            <div className="rounded-[30px] border border-white/80 bg-white/90 p-8 text-center text-sm text-slate-700 shadow-sm dark:border-white/20 dark:bg-slate-900/82 dark:text-slate-200">
                No schedule data available.
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="rounded-[34px] border border-white/80 bg-white/90 p-5 shadow-[0_14px_36px_rgba(14,165,233,0.12)] backdrop-blur-xl dark:border-white/20 dark:bg-slate-900/82 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-600 dark:text-slate-200">Intervention Plan</p>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white">All Active Subjects</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-200">
                            {interventions.length} subject intervention{interventions.length > 1 ? "s" : ""} in your schedule
                        </p>
                    </div>
                    <CalendarHeart className="h-5 w-5 text-cyan-600 dark:text-cyan-200" />
                </div>

                <div className="flex flex-wrap gap-2">
                    {interventions.map((intervention) => (
                        <span
                            key={`${intervention.type}-${intervention.id || intervention.label}`}
                            className="rounded-full border border-white/80 bg-white/92 px-3 py-1 text-xs font-semibold text-slate-800 dark:border-white/20 dark:bg-slate-800/72 dark:text-slate-100"
                        >
                            {intervention.label} - {intervention.tierLabel || intervention.tier || "Tier 1"}
                        </span>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {interventions.map((intervention) => {
                    const mentorLabel = formatMentorDisplay({
                        name: intervention.mentor,
                        nickname: intervention.mentorNickname,
                        username: intervention.mentorUsername,
                        gender: intervention.mentorGender,
                    });
                    let monitoringLabel = intervention.monitoringFrequency || intervention.monitoringMethod || "Weekly review";
                    if (monitoringLabel === "Custom" && Array.isArray(intervention.customFrequencyDays) && intervention.customFrequencyDays.length > 0) {
                        const dayAbbr = intervention.customFrequencyDays.map((d) => d.slice(0, 3));
                        monitoringLabel = `Custom — ${dayAbbr.join(", ")}`;
                    }

                    const scheduleCards = [
                        { key: "next", label: "Next Review", value: formatReviewDate(intervention.endDate, student?.nextUpdate || "Awaiting schedule"), tone: "from-rose-100 to-pink-100 dark:from-rose-950/70 dark:to-pink-950/60", labelTone: "text-rose-700 dark:text-rose-100" },
                        { key: "monitoring", label: "Monitoring", value: monitoringLabel, tone: "from-sky-100 to-cyan-100 dark:from-sky-950/70 dark:to-cyan-950/60", labelTone: "text-sky-700 dark:text-sky-100" },
                        { key: "mentor", label: "Mentor", value: mentorLabel || "MTSS Mentor", tone: "from-violet-100 to-fuchsia-100 dark:from-violet-950/70 dark:to-fuchsia-950/60", labelTone: "text-violet-700 dark:text-violet-100" },
                        { key: "duration", label: "Duration", value: intervention.duration || "Ongoing", tone: "from-amber-100 to-orange-100 dark:from-amber-950/70 dark:to-orange-950/60", labelTone: "text-amber-700 dark:text-amber-100" },
                    ];

                    return (
                        <div key={`${intervention.type}-${intervention.id || intervention.label}`} className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-md backdrop-blur-xl dark:border-white/20 dark:bg-slate-900/82">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.3em] text-slate-600 dark:text-slate-200">Subject Plan</p>
                                    <h4 className="text-lg font-black text-slate-800 dark:text-white">{intervention.label || "Intervention"}</h4>
                                </div>
                                <span className="rounded-full border border-white/80 bg-white/92 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-700 dark:border-white/20 dark:bg-slate-800/72 dark:text-violet-100">
                                    {intervention.tierLabel || intervention.tier || "Tier 1"}
                                </span>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                {scheduleCards.map((item) => (
                                    <div key={item.key} className={`rounded-2xl border border-white/60 bg-gradient-to-r ${item.tone} px-4 py-3 dark:border-white/20`}>
                                        <p className={`text-[11px] uppercase tracking-[0.28em] ${item.labelTone}`}>{item.label}</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-md backdrop-blur-xl dark:border-white/20 dark:bg-slate-900/82 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-slate-600 dark:text-slate-200">Goals</p>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">All Subject Targets</h3>
                        </div>
                        <Target className="h-5 w-5 text-rose-600 dark:text-rose-200" />
                    </div>

                    {allGoals.length > 0 ? (
                        <div className="space-y-3">
                            {allGoals.slice(0, 12).map((goal) => (
                                <div
                                    key={`${goal.subject}-${goal.id}`}
                                    className={`rounded-2xl px-4 py-3 border ${
                                        goal.completed
                                            ? "bg-emerald-50/90 border-emerald-200/80 dark:bg-emerald-950/50 dark:border-emerald-400/35"
                                            : "bg-gradient-to-r from-violet-50 to-pink-50 border-white/80 dark:from-violet-950/70 dark:to-pink-950/60 dark:border-white/20"
                                    }`}
                                >
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600 dark:text-slate-200">{goal.subject}</p>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{goal.label}</p>
                                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-200">{goal.completed ? "Completed" : "In Progress"}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-white/80 bg-gradient-to-r from-violet-50 to-pink-50 px-4 py-3 text-sm text-slate-700 dark:border-white/20 dark:from-violet-950/70 dark:to-pink-950/60 dark:text-slate-200">
                            No detailed goals recorded yet.
                        </div>
                    )}
                </div>

                <div className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-md backdrop-blur-xl dark:border-white/20 dark:bg-slate-900/82 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-slate-600 dark:text-slate-200">Timeline</p>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">All Subject Sessions</h3>
                        </div>
                        <Clock3 className="h-5 w-5 text-indigo-600 dark:text-indigo-200" />
                    </div>

                    {timeline.length > 0 ? (
                        <div className="space-y-3">
                            {timeline.map((entry) => (
                                <div key={entry.id} className="rounded-2xl border border-white/80 bg-gradient-to-r from-indigo-50 to-cyan-50 px-4 py-3 dark:border-white/20 dark:from-indigo-950/70 dark:to-cyan-950/60">
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-100">{entry.subject}</p>
                                    <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-100">{entry.date}</p>
                                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-100">{entry.notes}</p>
                                    {entry.evidence?.length > 0 && (
                                        <div className="mt-2">
                                            <EvidenceViewer evidence={entry.evidence} />
                                        </div>
                                    )}
                                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-200">Mentor: {entry.mentor}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-white/80 bg-gradient-to-r from-indigo-50 to-cyan-50 px-4 py-3 text-sm text-slate-700 dark:border-white/20 dark:from-indigo-950/70 dark:to-cyan-950/60 dark:text-slate-200">
                            Session timeline will appear after mentor check-ins are submitted.
                        </div>
                    )}
                </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                <Layers3 className="h-3.5 w-3.5" />
                Schedule is now unified from all intervention subjects in your MTSS plan.
            </div>
        </div>
    );
};

StudentSchedulePanel.displayName = "StudentSchedulePanel";
export default memo(StudentSchedulePanel);
