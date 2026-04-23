import { memo } from "react";
import { Activity, BarChart3, Sparkles, TrendingUp } from "lucide-react";

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

const AdminAnalyticsPanel = ({
    successByType,
    trendPaths,
    trendData,
    analyticsSummary = [],
    analyticsNarrative,
    strategyHighlights,
    tierMovement,
}) => {
    const hasSuccessData = Array.isArray(successByType) && successByType.length > 0;
    const hasTrendData = Array.isArray(trendData) && trendData.length > 0;
    const hasStrategyData = Array.isArray(strategyHighlights) && strategyHighlights.length > 0;

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
                    <div className="rounded-[28px] border border-white/50 bg-gradient-to-br from-[#fff7ed]/90 via-white to-[#eff6ff]/85 p-5 shadow-inner dark:border-white/10 dark:from-white/5 dark:via-white/10 dark:to-white/5">
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
                            <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Success rate by intervention type</h3>
                        </div>
                        <Sparkles className="h-5 w-5 text-yellow-400" />
                    </div>

                    <div className="mt-6 space-y-4">
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
                            <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Student progress trend</h3>
                        </div>
                        <Activity className="h-5 w-5 text-emerald-400" />
                    </div>

                    {hasTrendData ? (
                        <div className="mt-6 space-y-4">
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
                            <div className="w-full overflow-x-auto rounded-[24px] border border-white/45 bg-gradient-to-br from-[#f8fafc] via-white to-[#ecfeff] p-4 dark:border-white/10 dark:from-white/5 dark:via-white/10 dark:to-white/5">
                                <svg viewBox="0 0 600 220" className="h-56 w-full">
                                    <defs>
                                        <linearGradient id="metLine" x1="0%" x2="100%" y1="0%" y2="0%">
                                            <stop offset="0%" stopColor="#6ee7b7" />
                                            <stop offset="100%" stopColor="#22c55e" />
                                        </linearGradient>
                                        <linearGradient id="supportLine" x1="0%" x2="100%" y1="0%" y2="0%">
                                            <stop offset="0%" stopColor="#fb7185" />
                                            <stop offset="100%" stopColor="#f97316" />
                                        </linearGradient>
                                    </defs>
                                    <path d={trendPaths.met} fill="none" stroke="url(#metLine)" strokeWidth="4" strokeLinecap="round" />
                                    <path d={trendPaths.support} fill="none" stroke="url(#supportLine)" strokeWidth="4" strokeLinecap="round" />
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
                            description="This chart will populate after teachers save progress updates. A seeded pilot class with weekly check-ins will make the trend immediately visible."
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
                        {hasStrategyData ? (
                            strategyHighlights.map((strategy, idx) => (
                                <div
                                    key={strategy.label}
                                    className="flex items-center justify-between rounded-2xl bg-white/75 px-4 py-3 dark:bg-white/5"
                                    data-aos="fade-right"
                                    data-aos-delay={100 + idx * 40}
                                    data-aos-duration="600"
                                >
                                    <span className="font-semibold text-foreground dark:text-white">{strategy.label}</span>
                                    <span className="text-lg font-black text-primary">{strategy.value}</span>
                                </div>
                            ))
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
                            <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Student movement signal</h3>
                        </div>
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>

                    <div className="mt-6 rounded-[28px] bg-gradient-to-br from-[#f8fafc] to-[#e0f2fe] p-6 dark:from-white/10 dark:to-white/5">
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
