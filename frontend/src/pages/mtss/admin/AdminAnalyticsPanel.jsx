import { memo } from "react";
import { Activity, BarChart3, Sparkles, TrendingUp, UsersRound } from "lucide-react";

const AnalyticsMetricCard = ({ item, index }) => (
    <div
        className="rounded-[24px] border border-white/45 bg-white/80 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5"
        data-aos="fade-up"
        data-aos-delay={60 + index * 50}
        data-aos-duration="650"
    >
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">{item.label}</p>
        <p className="mt-3 text-4xl font-black tracking-tight text-slate-900 dark:text-white">{item.value}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-white/70">{item.helper}</p>
    </div>
);

const EmptyAnalyticsState = ({ title, description }) => (
    <div className="rounded-[24px] border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/80 p-6 dark:border-emerald-400/30 dark:from-emerald-500/10 dark:via-white/5 dark:to-sky-500/10">
        <p className="text-lg font-black text-slate-900 dark:text-white">{title}</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-white/70">{description}</p>
    </div>
);

const getTrendPoint = (point, index, length, key) => {
    const width = 600;
    const height = 200;
    const maxIndex = Math.max(length - 1, 1);
    const x = (index / maxIndex) * width;
    const y = height - ((point[key] || 0) / 100) * height;
    return { x, y };
};

const AdminAnalyticsPanel = ({
    successByType,
    trendPaths,
    trendData,
    analyticsSummary = [],
    analyticsNarrative,
    strategyHighlights,
    tierMovement,
    mentorSubjectCoverageRows = [],
}) => {
    const hasSuccessData = Array.isArray(successByType) && successByType.length > 0;
    const hasTrendData = Array.isArray(trendData) && trendData.length > 0;
    const hasStrategyData = Array.isArray(strategyHighlights) && strategyHighlights.length > 0;
    const hasCoverageData = Array.isArray(mentorSubjectCoverageRows) && mentorSubjectCoverageRows.length > 0;
    const maxStrategyVal = hasStrategyData ? Math.max(...strategyHighlights.map((s) => Number(s.value) || 0), 1) : 1;
    const progressTrendDelta = hasTrendData && trendData.length >= 2
        ? trendData[trendData.length - 1].met - trendData[0].met
        : 0;
    const progressTrendLabel = progressTrendDelta > 0
        ? `↑ ${progressTrendDelta}% on-track`
        : progressTrendDelta < 0
            ? `↓ ${Math.abs(progressTrendDelta)}% on-track`
            : "↔ On-track steady";

    return (
        <div className="space-y-6">
            <section
                className="glass glass-card mtss-card-surface rounded-[36px] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.14)]"
                data-aos="fade-up"
                data-aos-duration="700"
            >
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-3xl space-y-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.32em] text-slate-500 dark:text-white/55">Analytics overview</p>
                        <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Intervention health and progress pulse</h3>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-white/70">
                            {analyticsNarrative?.body || "Use this panel to review how intervention plans are progressing, where support is stuck, and which strategies are producing the clearest gains."}
                        </p>
                    </div>
                    <div className="rounded-[28px] border border-white/50 bg-gradient-to-br from-[var(--mtss-panel-warm)]/90 via-white to-[var(--mtss-panel-cool)]/85 p-5 shadow-inner dark:border-white/10 dark:from-white/5 dark:via-white/10 dark:to-white/5">
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">Lead takeaway</p>
                        <p className="mt-3 text-lg font-black text-slate-900 dark:text-white">
                            {analyticsNarrative?.title || "No intervention activity has been recorded yet"}
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {analyticsSummary.map((item, index) => (
                        <AnalyticsMetricCard key={item.key} item={item} index={index} />
                    ))}
                </div>
            </section>

            <section
                className="glass glass-card mtss-card-surface rounded-[32px] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.14)]"
                data-aos="fade-up"
                data-aos-duration="700"
                data-aos-delay="60"
            >
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">Mentor-subject coverage</p>
                        <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Student - subject - mentor pairings</h3>
                        <p className="mt-2 max-w-2xl text-xs font-semibold leading-relaxed text-slate-500 dark:text-white/60">
                            Use this as the ownership check: every active support unit should show one student, one subject / focus area, and one accountable mentor.
                        </p>
                    </div>
                    <UsersRound className="h-5 w-5 text-cyan-500" />
                </div>

                {hasCoverageData ? (
                    <div className="mt-5 grid gap-3 lg:grid-cols-2">
                        {mentorSubjectCoverageRows.slice(0, 8).map((row) => {
                            const studentNames = (row.students || []).map((student) => student.name).filter(Boolean);
                            const preview = studentNames.slice(0, 3).join(", ");
                            const studentLabel = studentNames.length > 3 ? `${preview} +${studentNames.length - 3}` : preview;
                            return (
                                <div
                                    key={`${row.mentorName}-${row.subject}-${row.tierCode}`}
                                    className="rounded-[22px] border border-white/45 bg-white/75 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-black text-slate-900 dark:text-white">{row.subject}</p>
                                        <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-100">
                                            {row.tier}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-white/70">
                                        {row.mentorName} - {studentLabel || "No students"}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="mt-5">
                        <EmptyAnalyticsState
                            title="No mentor-subject coverage yet"
                            description="Subject-level coverage appears after intervention plans include assigned students, focus areas, and mentors."
                        />
                    </div>
                )}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <div
                    className="glass glass-card mtss-card-surface rounded-[32px] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.14)]"
                    data-aos="fade-up"
                    data-aos-duration="700"
                    data-aos-delay="80"
                >
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">Outcome by focus area</p>
                            <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Success rate by subject / focus area</h3>
                        </div>
                        <Sparkles className="h-5 w-5 text-yellow-400" />
                    </div>

                        <div className="mt-6 space-y-4">
                        <p className="rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-xs font-semibold leading-relaxed text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200">
                            Read this as a subject-level sample: higher bars mean more plans are meeting their target; lower bars point to focus areas that need coaching or plan revision.
                        </p>
                            {hasSuccessData ? (
                            successByType.map((item, idx) => (
                                <div
                                    key={item.label}
                                    className="rounded-[24px] border border-white/45 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5"
                                    data-aos="fade-right"
                                    data-aos-delay={100 + idx * 40}
                                    data-aos-duration="600"
                                >
                                    <div className="flex items-center justify-between gap-3 text-sm font-semibold text-foreground dark:text-white">
                                        <span>{item.label}</span>
                                        <span>{item.value}%</span>
                                    </div>
                                    <div className="mt-3 h-3 rounded-full bg-slate-200/80 dark:bg-white/10">
                                        <div className={`h-full rounded-full bg-gradient-to-r ${item.gradient}`} style={{ width: `${item.value}%` }} />
                                    </div>
                                    <p className="mt-3 text-xs text-slate-500 dark:text-white/55">{item.detail}</p>
                                </div>
                            ))
                        ) : (
                            <EmptyAnalyticsState
                                title="No success-rate breakdown yet"
                                description="Once Tier 2 or Tier 3 plans are created, this panel will compare how each focus area is performing against its target."
                            />
                        )}
                    </div>
                </div>

                <div
                    className="glass glass-card mtss-card-surface rounded-[32px] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.14)]"
                    data-aos="fade-up"
                    data-aos-duration="700"
                    data-aos-delay="120"
                >
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">Progress over time</p>
                            <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Support unit progress trend</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            {hasTrendData && (
                                <span className={`rounded-full px-3 py-1 text-xs font-black ${
                                    progressTrendDelta >= 0
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                                        : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200"
                                }`}>
                                    {progressTrendLabel}
                                </span>
                            )}
                            <Activity className="h-5 w-5 text-emerald-400" />
                        </div>
                    </div>

                        {hasTrendData ? (
                            <div className="mt-6 space-y-4">
                                <p className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
                                        Year-over-year comparison is unavailable until a prior MTSS cycle is stored. This view shows current-cycle support-unit check-ins only.
                                </p>
                                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-white/60">
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                                    On-track updates
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                                    Needs-support updates
                                </span>
                            </div>
                            <div className="w-full overflow-x-auto rounded-[24px] border border-white/45 bg-gradient-to-br from-[var(--mtss-panel-gray)] via-white to-[var(--mtss-panel-cyan)] p-4 dark:border-white/10 dark:from-white/5 dark:via-white/10 dark:to-white/5">
                                <svg viewBox="0 0 600 220" className="h-56 w-full">
                                    <defs>
                                        <linearGradient id="metLine" x1="0%" x2="100%" y1="0%" y2="0%">
                                            <stop offset="0%" stopColor="var(--mtss-chart-emerald-from)" />
                                            <stop offset="100%" stopColor="var(--mtss-chart-emerald-to)" />
                                        </linearGradient>
                                        <linearGradient id="supportLine" x1="0%" x2="100%" y1="0%" y2="0%">
                                            <stop offset="0%" stopColor="var(--mtss-chart-rose-from)" />
                                            <stop offset="100%" stopColor="var(--mtss-chart-rose-to)" />
                                        </linearGradient>
                                    </defs>
                                    <path d={trendPaths.met} fill="none" stroke="url(#metLine)" strokeWidth="4" strokeLinecap="round" />
                                    <path d={trendPaths.support} fill="none" stroke="url(#supportLine)" strokeWidth="4" strokeLinecap="round" />
                                    {trendData.map((point, index) => {
                                        const metPoint = getTrendPoint(point, index, trendData.length, "met");
                                        const supportPoint = getTrendPoint(point, index, trendData.length, "support");
                                        return (
                                            <g key={`${point.label}-labels`}>
                                                <circle cx={metPoint.x} cy={metPoint.y} r="5" fill="var(--mtss-chart-emerald-to)" stroke="var(--mtss-chart-dot-border, #ffffff)" strokeWidth="2" />
                                                <text
                                                    x={metPoint.x}
                                                    y={Math.max(14, metPoint.y - 12)}
                                                    textAnchor="middle"
                                                    className="fill-slate-700 text-[11px] font-black dark:fill-white"
                                                >
                                                    {point.met}%
                                                </text>
                                                <circle cx={supportPoint.x} cy={supportPoint.y} r="5" fill="var(--mtss-chart-rose-from)" stroke="var(--mtss-chart-dot-border, #ffffff)" strokeWidth="2" />
                                                <text
                                                    x={supportPoint.x}
                                                    y={Math.min(214, supportPoint.y + 22)}
                                                    textAnchor="middle"
                                                    className="fill-slate-700 text-[11px] font-black dark:fill-white"
                                                >
                                                    {point.support}%
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>
                                <div className="mt-2 grid grid-cols-6 gap-2 text-xs text-slate-500 dark:text-white/60">
                                    {trendData.map((point) => (
                                        <div key={point.label} className="space-y-1 text-center">
                                            <p>{point.label}</p>
                                            <p className="font-semibold text-slate-700 dark:text-white">{point.total} updates</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                            <EmptyAnalyticsState
                                title="Progress trend is waiting for check-ins"
                                description="This chart will populate after teachers save progress updates. Year-over-year data is unavailable until a previous MTSS cycle exists."
                            />
                    )}
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div
                    className="glass glass-card mtss-card-surface rounded-[32px] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.14)]"
                    data-aos="fade-up"
                    data-aos-duration="700"
                    data-aos-delay="160"
                >
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">Strategy scan</p>
                            <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Most active focus areas</h3>
                        </div>
                        <BarChart3 className="h-5 w-5 text-sky-500" />
                    </div>

                    <div className="mt-6 space-y-3 text-sm">
                        <p className="rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-xs font-semibold leading-relaxed text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200">
                            Read this as demand volume, not effectiveness: a high count means many active student-subject units need adult follow-up in that focus area.
                        </p>
                        {hasStrategyData ? (
                            strategyHighlights.map((strategy, idx) => {
                                const pct = Math.round((Number(strategy.value) / maxStrategyVal) * 100);
                                const barColor = pct >= 75
                                    ? "from-sky-500 to-blue-600"
                                    : pct >= 40
                                        ? "from-cyan-400 to-sky-500"
                                        : "from-slate-300 to-slate-400 dark:from-white/30 dark:to-white/20";
                                return (
                                    <div
                                        key={strategy.label}
                                        className="rounded-2xl bg-white/75 px-4 py-3 dark:bg-white/5"
                                        data-aos="fade-right"
                                        data-aos-delay={100 + idx * 40}
                                        data-aos-duration="600"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="font-semibold text-foreground dark:text-white">{strategy.label}</span>
                                            <span className="text-base font-black text-primary tabular-nums">{strategy.value}</span>
                                        </div>
                                        <div className="mt-2 h-2 rounded-full bg-slate-200/80 dark:bg-white/10">
                                            <div
                                                className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <EmptyAnalyticsState
                                title="No focus area distribution yet"
                                description="Focus area counts appear after intervention plans are created and assigned."
                            />
                        )}
                    </div>
                </div>

                <div
                    className="glass glass-card mtss-card-surface rounded-[32px] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.14)]"
                    data-aos="fade-up"
                    data-aos-duration="700"
                    data-aos-delay="200"
                >
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">Movement report</p>
                                <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Support unit movement signal</h3>
                        </div>
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>

                    <div className="mt-6 rounded-[28px] bg-gradient-to-br from-[var(--mtss-panel-gray)] to-[var(--mtss-panel-sky)] p-6 dark:from-white/10 dark:to-white/5">
                        <p className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-xs font-semibold leading-relaxed text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                            Movement is based on current-cycle progress signals. Use Needs Support to decide which student-subject units need plan review before tier changes.
                        </p>
                        <div className="grid gap-5 md:grid-cols-3">
                            {tierMovement.map((item, idx) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.label}
                                        className="rounded-[24px] border border-white/50 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5"
                                        data-aos="fade-left"
                                        data-aos-delay={120 + idx * 40}
                                        data-aos-duration="650"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className={`h-6 w-6 ${item.accent}`} />
                                            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">{item.label}</p>
                                        </div>
                                        <p className={`mt-4 text-3xl font-black ${item.accent}`}>{item.detail}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

AdminAnalyticsPanel.displayName = "AdminAnalyticsPanel";
export default memo(AdminAnalyticsPanel);
