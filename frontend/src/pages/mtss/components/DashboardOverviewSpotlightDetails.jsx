import { Clock8, Clock4, UserRound, Layers, TrendingUp, MessageSquareText } from "lucide-react";

const DashboardOverviewSpotlightDetails = ({
    spotlightStudent,
    spotlightProfile,
    progressUnit,
    spotlightStatus,
    weekLabel,
    history,
    TierPill,
}) => {
    const parseNumber = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    };
    const baselineValue = parseNumber(spotlightProfile?.baseline);
    const currentValue = parseNumber(spotlightProfile?.current);
    const targetValue = parseNumber(spotlightProfile?.target);
    const baseline = baselineValue ?? spotlightProfile?.baseline ?? null;
    const current = currentValue ?? spotlightProfile?.current ?? null;
    const target = targetValue ?? spotlightProfile?.target ?? null;
    const gap = target != null && current != null ? Math.max(0, target - current) : null;
    const progressValue = (() => {
        if (current == null || target == null || target === 0) return spotlightStatus || 0;
        const base = baseline ?? 0;
        const denom = target - base;
        if (denom === 0) return current >= target ? 100 : 0;
        return Math.min(100, Math.max(0, Math.round(((current - base) / denom) * 100)));
    })();
    const formatValue = (value) => (value == null ? "-" : `${value} ${progressUnit}`);
    const classLabel = spotlightStudent?.className || spotlightStudent?.class || "-";
    const lastCheckIn = history?.[0]?.date || "No recent updates";
    const pairingLabel = spotlightStudent?.supportUnit?.pairingLabel || spotlightStudent?.pairingLabel || spotlightProfile?.pairingLabel || null;

    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-aos="fade-up" data-aos-delay="80">
            <div className="rounded-2xl border border-sky-200/60 dark:border-sky-800/40 bg-gradient-to-br from-sky-50/90 via-white/80 to-white/70 dark:from-sky-950/40 dark:via-slate-900/40 dark:to-slate-900/30 p-4 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-slate-500 dark:text-white/60">
                        <UserRound className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                        Student
                    </div>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-white/10 border border-white/50 text-[11px] font-semibold text-foreground dark:text-white">
                        <Clock8 className="w-3.5 h-3.5" />
                        {weekLabel}
                    </span>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span>Grade</span>
                        <span className="font-semibold text-foreground dark:text-white">{spotlightStudent?.grade ?? "-"}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span>Class</span>
                        <span className="font-semibold text-foreground dark:text-white">{classLabel}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span>Teacher</span>
                        <span className="font-semibold text-foreground dark:text-white">{spotlightProfile.teacher ?? "-"}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span>Mentor</span>
                        <span className="font-semibold text-foreground dark:text-white">{spotlightProfile.mentor ?? "-"}</span>
                    </div>
                    {pairingLabel && (
                        <div className="rounded-xl bg-sky-50 px-3 py-2 text-sky-700 dark:bg-sky-500/10 dark:text-sky-100">
                            <span className="block truncate font-semibold" title={pairingLabel}>{pairingLabel}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span>Tier</span>
                        {spotlightStudent?.tier ? (
                            <TierPill tier={spotlightStudent.tier} />
                        ) : (
                            <span className="font-semibold text-foreground dark:text-white">-</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-violet-200/60 dark:border-violet-800/40 bg-gradient-to-br from-violet-50/80 via-white/80 to-white/70 dark:from-violet-950/40 dark:via-slate-900/40 dark:to-slate-900/30 p-4 space-y-3">
                <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-slate-500 dark:text-white/60">
                    <Layers className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                    Intervention
                </div>
                <ul className="space-y-2 text-sm text-foreground dark:text-white">
                        <li><strong>Subject / Focus Area:</strong> {spotlightProfile.type ?? "-"}</li>
                    <li><strong>Strategy:</strong> {spotlightProfile.strategy ?? "-"}</li>
                    <li><strong>Started:</strong> {spotlightProfile.started ?? "-"}</li>
                    <li><strong>Duration:</strong> {spotlightProfile.duration ?? "-"}</li>
                </ul>
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                    {spotlightProfile.strategy && spotlightProfile.strategy !== spotlightProfile.type && (
                        <span className="px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200 truncate max-w-full">
                            {spotlightProfile.strategy}
                        </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                        Last update: {lastCheckIn}
                    </span>
                </div>
            </div>

            <div className="rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50/80 via-white/80 to-white/70 dark:from-emerald-950/40 dark:via-slate-900/40 dark:to-slate-900/30 p-4 space-y-3">
                <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-slate-500 dark:text-white/60">
                    <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    Progress
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-foreground dark:text-white">
                    <div className="rounded-xl bg-white/70 dark:bg-white/5 border border-white/40 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Baseline</p>
                        <p className="text-base font-bold">{formatValue(baseline)}</p>
                    </div>
                    <div className="rounded-xl bg-white/70 dark:bg-white/5 border border-white/40 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Current</p>
                        <p className="text-base font-bold">{formatValue(current)}</p>
                    </div>
                    <div className="rounded-xl bg-white/70 dark:bg-white/5 border border-white/40 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Target</p>
                        <p className="text-base font-bold">{formatValue(target)}</p>
                    </div>
                    <div className="rounded-xl bg-white/70 dark:bg-white/5 border border-white/40 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Gap</p>
                        <p className="text-base font-bold">{gap == null ? "-" : `${gap} ${progressUnit}`}</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span>Status</span>
                        <span className="text-emerald-600 dark:text-emerald-300">{Math.round(progressValue)}% to target</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/40 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 transition-all duration-500"
                            style={{ width: `${progressValue}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/80 via-white/80 to-white/70 dark:from-amber-950/40 dark:via-slate-900/40 dark:to-slate-900/30 p-4 space-y-3">
                <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-slate-500 dark:text-white/60">
                    <MessageSquareText className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    Recent Notes
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {history?.length ? (
                        history.map((entry, idx) => (
                            <div
                                key={`${entry.date || idx}-${idx}`}
                                className="rounded-xl bg-white/80 dark:bg-white/5 border border-white/40 px-3 py-2 text-xs text-foreground dark:text-white"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold">{entry.date || "Recent"}</span>
                                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                        <Clock4 className="w-3 h-3" />
                                        {entry.score || entry.value || ""}
                                    </span>
                                </div>
                                <p className="mt-1 text-[12px] text-muted-foreground">
                                    {entry.notes || entry.summary || entry.description || "Check-in recorded"}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-muted-foreground">No recent notes.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardOverviewSpotlightDetails;
