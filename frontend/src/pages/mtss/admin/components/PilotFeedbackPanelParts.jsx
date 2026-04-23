import { memo } from "react";
import {
    Activity,
    AlertTriangle,
    Building2,
    Bug,
    CheckCircle2,
    ChevronDown,
    Clock3,
    Compass,
    Gauge,
    Hash,
    LayoutPanelTop,
    Mail,
    Radar,
    RefreshCcw,
    ShieldCheck,
    Sparkles,
    Target,
    TrendingUp,
    User2,
    Users2,
    Wifi,
    Zap,
} from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BUG_SEVERITY_LABELS, buildBugSeveritySummary, formatDateTime, formatPilotRouteLabel, formatRelativeTime, getPilotLiveStatus, READINESS_LABELS } from "../utils/pilotFeedbackPanelUtils";

const panelSurfaceClass =
    "relative overflow-hidden rounded-[34px] border border-white/40 bg-white/86 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55";

const cardSurfaceClass =
    "rounded-[26px] border border-white/45 bg-white/82 shadow-[0_18px_48px_rgba(15,23,42,0.1)] backdrop-blur-lg dark:border-white/10 dark:bg-white/[0.05]";

const severityBadgeClassMap = {
    low: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-100",
    medium: "border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-400/30 dark:bg-orange-500/15 dark:text-orange-100",
    high: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-100",
};

const severityPanelClassMap = {
    low: "border-amber-200/80 bg-amber-50/85 dark:border-amber-400/25 dark:bg-amber-500/10",
    medium: "border-orange-200/80 bg-orange-50/85 dark:border-orange-400/25 dark:bg-orange-500/10",
    high: "border-rose-200/80 bg-rose-50/85 dark:border-rose-400/30 dark:bg-rose-500/12",
};

const severityRailClassMap = {
    low: "bg-gradient-to-b from-amber-300 to-amber-500",
    medium: "bg-gradient-to-b from-orange-400 to-orange-600",
    high: "bg-gradient-to-b from-rose-400 to-rose-600",
};

const readinessChartColorMap = {
    yes: "#16a34a",
    almost: "#f59e0b",
    "not-yet": "#f97316",
    draft: "#94a3b8",
};

const readinessChipClassMap = {
    yes: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-100",
    almost: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-100",
    "not-yet": "border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-400/30 dark:bg-orange-500/15 dark:text-orange-100",
    draft: "border-slate-200 bg-slate-50 text-slate-900 dark:border-white/15 dark:bg-white/10 dark:text-white/85",
};

const infoToneClassMap = {
    default: "border-white/45 bg-white/82 dark:border-white/10 dark:bg-white/[0.05]",
    success: "border-emerald-200/80 bg-emerald-50/85 dark:border-emerald-400/25 dark:bg-emerald-500/10",
    warning: "border-amber-200/80 bg-amber-50/85 dark:border-amber-400/25 dark:bg-amber-500/10",
    danger: "border-rose-200/80 bg-rose-50/85 dark:border-rose-400/25 dark:bg-rose-500/10",
    info: "border-sky-200/80 bg-sky-50/85 dark:border-sky-400/25 dark:bg-sky-500/10",
};

const metadataPairs = [
    { key: "yes", label: READINESS_LABELS.yes },
    { key: "almost", label: READINESS_LABELS.almost },
    { key: "not-yet", label: READINESS_LABELS["not-yet"] },
    { key: "draft", label: READINESS_LABELS.draft },
];

const StepScorePill = memo(({ label, value }) => (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/78 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-white/80">
        <span>{label}</span>
        <span className="text-sm font-black text-slate-950 dark:text-white">{value}/5</span>
    </div>
));

export const PilotPanelSection = memo(({
    eyebrow,
    title,
    description,
    action,
    className,
    children,
}) => (
    <section className={cn(panelSurfaceClass, className)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.09),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.08),transparent_34%)]" />
        <div className="relative p-6">
            {(eyebrow || title || description || action) ? (
                <div className="flex flex-col gap-4 border-b border-slate-200/75 pb-5 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        {eyebrow ? (
                            <p className="text-[11px] font-black uppercase tracking-[0.34em] text-slate-500 dark:text-white/50">
                                {eyebrow}
                            </p>
                        ) : null}
                        {title ? (
                            <h3 className="text-[28px] font-black leading-tight text-slate-950 dark:text-white">{title}</h3>
                        ) : null}
                        {description ? (
                            <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-white/68">{description}</p>
                        ) : null}
                    </div>
                    {action ? <div className="shrink-0">{action}</div> : null}
                </div>
            ) : null}
            <div className={cn(eyebrow || title || description || action ? "pt-5" : "")}>{children}</div>
        </div>
    </section>
));

export const PilotMetricCard = memo(({ icon: Icon, label, value, note, accent = "text-slate-950 dark:text-white", className }) => (
    <div className={cn(cardSurfaceClass, "p-4", className)}>
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-500 dark:text-white/50">{label}</p>
                <p className={cn("mt-2 text-[32px] font-black leading-none", accent)}>{value}</p>
                {note ? <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-white/55">{note}</p> : null}
            </div>
            {Icon ? (
                <div className="rounded-[20px] bg-gradient-to-br from-[#f97316] via-[#ec4899] to-[#6366f1] p-3 text-white shadow-lg">
                    <Icon className="h-5 w-5" />
                </div>
            ) : null}
        </div>
    </div>
));

export const PilotDashboardHero = memo(({
    stats,
    lastLiveEventAt,
    onRefresh,
    readinessDistribution,
    coverageSummary,
}) => (
    <section className="relative overflow-hidden rounded-[40px] border border-white/40 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(240,249,255,0.9)_45%,rgba(255,247,237,0.92))] p-6 shadow-[0_32px_100px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.9),rgba(15,23,42,0.86)_45%,rgba(30,41,59,0.92))]">
        <div className="absolute -left-16 top-0 h-44 w-44 rounded-full bg-sky-300/25 blur-3xl dark:bg-sky-500/15" />
        <div className="absolute right-0 top-8 h-48 w-48 rounded-full bg-orange-300/25 blur-3xl dark:bg-orange-500/15" />
        <div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-500/10" />

        <div className="relative space-y-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-white/80">
                        <LayoutPanelTop className="h-3.5 w-3.5" />
                        Pilot feedback command center
                    </div>
                    <div className="space-y-3">
                        <h2 className="max-w-3xl text-[34px] font-black leading-[1.05] text-slate-950 dark:text-white md:text-[40px]">
                            Principal testing review center for Pak Faisal
                        </h2>
                        <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-white/68">
                            Review every principal pilot session in one place, with live sync status, readiness signals, bug severity,
                            and guided-step evidence arranged for fast decision-making.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {metadataPairs.map((item) => (
                            <Badge
                                key={item.key}
                                variant="outline"
                                className={cn("rounded-full border px-3 py-1 font-semibold", readinessChipClassMap[item.key])}
                            >
                                {item.label}: {readinessDistribution?.[item.key] || 0}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col items-start gap-3 xl:items-end">
                    <div className="flex flex-wrap items-center gap-3">
                        <Badge className="rounded-full border-0 bg-emerald-500/90 px-3 py-1 text-white">
                            <Wifi className="mr-1 h-3.5 w-3.5" />
                            Live stream
                        </Badge>
                        <span className="text-xs font-medium text-slate-500 dark:text-white/55">
                            {formatRelativeTime(lastLiveEventAt)}
                        </span>
                    </div>
                    <Button variant="glass" onClick={onRefresh} className="rounded-2xl">
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Refresh dashboard
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <PilotMetricCard icon={Users2} label="Sessions" value={stats.totalSessions} note={`${stats.principalCount} principals in pilot`} />
                    <PilotMetricCard icon={CheckCircle2} label="Completed" value={stats.completedSessions} note={`${stats.inProgressSessions} still in progress`} accent="text-emerald-600 dark:text-emerald-300" />
                    <PilotMetricCard icon={Bug} label="With bugs" value={stats.sessionsWithBugs} note="Sessions that need follow-up review" accent="text-rose-600 dark:text-rose-300" />
                    <PilotMetricCard icon={ShieldCheck} label="Avg confidence" value={`${stats.averageConfidence || 0}/5`} note="Based on saved final feedback" accent="text-sky-600 dark:text-sky-300" />
                </div>

                <div className={cn(cardSurfaceClass, "grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-1")}>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-500 dark:text-white/50">
                            Coverage pulse
                        </p>
                        <h3 className="mt-2 text-lg font-black text-slate-950 dark:text-white">
                            {coverageSummary?.fullyCoveredSteps || 0}/{coverageSummary?.totalSteps || 0} guided steps fully covered
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-white/68">
                            Use this to see whether the pilot has already touched every critical workflow in MTSS.
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[22px] border border-white/60 bg-white/78 p-4 shadow-sm dark:border-white/10 dark:bg-white/10">
                            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/50">
                                Active 24h
                            </p>
                            <p className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-300">
                                {stats.activeLast24Hours}
                            </p>
                            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-white/55">
                                Sessions updated in the last 24 hours.
                            </p>
                        </div>
                        <div className="rounded-[22px] border border-white/60 bg-white/78 p-4 shadow-sm dark:border-white/10 dark:bg-white/10">
                            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/50">
                                Review focus
                            </p>
                            <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">
                                Start with high-severity bug sessions, then compare confidence against readiness.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
));

export const PilotFilterSelect = memo(({ value, onChange, options = [], className }) => (
    <select
        className={cn(
            "min-h-11 rounded-2xl border border-white/45 bg-white/86 px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white",
            className,
        )}
        value={value}
        onChange={(event) => onChange(event.target.value)}
    >
        {options.map((option) => (
            <option key={option.value} value={option.value}>
                {option.label}
            </option>
        ))}
    </select>
));

export const PilotEmptyState = memo(({ title, description }) => (
    <div className="rounded-[28px] border border-dashed border-slate-300/80 bg-white/60 p-8 text-center dark:border-white/10 dark:bg-white/5">
        <p className="text-base font-bold text-slate-800 dark:text-white">{title}</p>
        {description ? <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-white/60">{description}</p> : null}
    </div>
));

export const PilotCoverageCard = memo(({ order, title, completed, total, completionRate }) => (
    <div className={cn(cardSurfaceClass, "p-4")}>
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/50">
                    Step {order}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-950 dark:text-white">{title}</p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-white/85">
                {completed}/{total}
            </div>
        </div>

        <div className="mt-4 h-2.5 rounded-full bg-slate-200/80 dark:bg-white/10">
            <div
                className="h-full rounded-full bg-gradient-to-r from-[#22c55e] via-[#14b8a6] to-[#38bdf8]"
                style={{ width: `${completionRate}%` }}
            />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-white/55">
            <span>{completionRate}% covered</span>
            <span>{Math.max(0, total - completed)} remaining</span>
        </div>
    </div>
));

export const PilotStatusBadge = memo(({ statusLabel, isCompleted }) => (
    <Badge className={cn("rounded-full border-0 px-3 py-1 text-white", isCompleted ? "bg-emerald-500/90" : "bg-amber-500/90")}>
        {statusLabel}
    </Badge>
));

export const PilotSeverityBadge = memo(({ severity = "medium", count = null, className }) => (
    <Badge
        variant="outline"
        className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold",
            severityBadgeClassMap[severity] || severityBadgeClassMap.medium,
            className,
        )}
    >
        <AlertTriangle className="mr-1 h-3.5 w-3.5" />
        {count !== null ? `${count} ${BUG_SEVERITY_LABELS[severity] || "Medium"}` : `${BUG_SEVERITY_LABELS[severity] || "Medium"} severity`}
    </Badge>
));

export const PilotSessionListItem = memo(({
    session,
    active,
    onSelect,
    readinessLabel,
    statusLabel,
    formattedUpdatedAt,
}) => {
    const bugSummary = buildBugSeveritySummary(session);
    const completionRate = Number(session?.completionRate || 0);
    const confidenceValue = session?.finalFeedbackSavedAt ? `${session?.finalFeedback?.overallConfidence || 0}/5` : "Draft";

    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                "group relative w-full overflow-hidden rounded-[28px] border p-4 text-left transition duration-200",
                active
                    ? "border-transparent bg-[linear-gradient(135deg,#fff7ed,#fdf4ff_48%,#eff6ff)] shadow-[0_18px_52px_rgba(15,23,42,0.16)] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.08)_45%,rgba(255,255,255,0.04))]"
                    : "border-white/45 bg-white/76 hover:bg-white/92 dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/[0.08]",
            )}
        >
            <span className={cn("absolute inset-y-4 left-0 w-1 rounded-r-full bg-transparent transition", active && "bg-gradient-to-b from-sky-500 via-violet-500 to-orange-400")} />

            <div className="flex items-start justify-between gap-3 pl-1">
                <div className="min-w-0">
                    <p className="truncate text-base font-black text-slate-950 dark:text-white">
                        {session?.tester?.name || "Unnamed principal"}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-white/55">
                        {session?.tester?.email || "No email"} · {session?.tester?.unit || "No unit"}
                    </p>
                </div>
                <PilotStatusBadge statusLabel={statusLabel} isCompleted={session?.status === "completed"} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[20px] border border-white/60 bg-white/78 px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-white/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/50">Progress</p>
                    <p className="mt-2 text-xl font-black text-slate-950 dark:text-white">{completionRate}%</p>
                </div>
                <div className="rounded-[20px] border border-white/60 bg-white/78 px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-white/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/50">Bug load</p>
                    <p className={cn("mt-2 text-xl font-black", bugSummary.total ? "text-rose-600 dark:text-rose-300" : "text-emerald-600 dark:text-emerald-300")}>
                        {bugSummary.total}
                    </p>
                </div>
                <div className="rounded-[20px] border border-white/60 bg-white/78 px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-white/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/50">Confidence</p>
                    <p className="mt-2 text-xl font-black text-slate-950 dark:text-white">{confidenceValue}</p>
                </div>
            </div>

            <div className="mt-4 h-1.5 rounded-full bg-slate-200/80 dark:bg-white/10">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-orange-400"
                    style={{ width: `${Math.min(100, completionRate)}%` }}
                />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full border-slate-300 bg-white/85 dark:border-white/15 dark:bg-white/10">
                    {readinessLabel}
                </Badge>
                {bugSummary.highestSeverity ? <PilotSeverityBadge severity={bugSummary.highestSeverity} /> : null}
            </div>

            <p className="mt-3 text-xs text-slate-500 dark:text-white/55">Last updated: {formattedUpdatedAt}</p>
        </button>
    );
});

export const PilotSessionSpotlight = memo(({
    session,
    statusLabel,
    readinessLabel,
    lastUpdatedLabel,
    bugSummary,
    className,
}) => {
    const completionRate = Number(session?.completionRate || 0);

    return (
        <section className={cn(panelSurfaceClass, "sticky top-6 z-20", className)}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_34%),radial-gradient(circle_at_right,rgba(249,115,22,0.12),transparent_34%)]" />
            <div className="relative p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-white/80">
                            <Radar className="h-3.5 w-3.5" />
                            Selected principal session
                        </div>
                        <div>
                            <h3 className="text-[34px] font-black leading-none text-slate-950 dark:text-white">
                                {session?.tester?.name || "Unnamed principal"}
                            </h3>
                            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-white/68">
                                {session?.tester?.email || "No email"} · {session?.tester?.unit || "No unit"} · {session?.tester?.role || "No role"}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <PilotStatusBadge statusLabel={statusLabel} isCompleted={session?.status === "completed"} />
                            <Badge variant="outline" className="rounded-full border-slate-300 bg-white/85 dark:border-white/15 dark:bg-white/10">
                                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                                {readinessLabel}
                            </Badge>
                            {bugSummary.highestSeverity ? (
                                <PilotSeverityBadge severity={bugSummary.highestSeverity} />
                            ) : (
                                <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-100">
                                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                    No active bugs
                                </Badge>
                            )}
                            <Badge variant="outline" className="rounded-full border-slate-300 bg-white/85 dark:border-white/15 dark:bg-white/10">
                                Session key: {session?.sessionKey || "Not available"}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid min-w-full gap-3 sm:grid-cols-2 xl:min-w-[22rem] xl:max-w-[24rem] xl:grid-cols-2">
                        <PilotMetricCard
                            icon={Activity}
                            label="Completion"
                            value={`${completionRate}%`}
                            note={`${session?.completedStepCount || 0}/${session?.stepCount || 0} guided steps completed`}
                            accent="text-sky-600 dark:text-sky-300"
                            className="p-4"
                        />
                        <PilotMetricCard
                            icon={Bug}
                            label="Bug load"
                            value={bugSummary.total || 0}
                            note={bugSummary.highestSeverity ? `${BUG_SEVERITY_LABELS[bugSummary.highestSeverity]} is the highest severity` : "No bug report submitted"}
                            accent={bugSummary.total ? "text-rose-600 dark:text-rose-300" : "text-emerald-600 dark:text-emerald-300"}
                            className="p-4"
                        />
                        <PilotMetricCard
                            icon={ShieldCheck}
                            label="Confidence"
                            value={session?.finalFeedbackSavedAt ? `${session?.finalFeedback?.overallConfidence || 0}/5` : "Draft"}
                            note={session?.finalFeedbackSavedAt ? "Final recommendation already saved" : "Waiting for final feedback"}
                            accent="text-emerald-600 dark:text-emerald-300"
                            className="p-4"
                        />
                        <PilotMetricCard
                            icon={Clock3}
                            label="Last sync"
                            value={lastUpdatedLabel}
                            note="Latest backend activity"
                            accent="text-amber-600 dark:text-amber-300"
                            className="p-4"
                        />
                    </div>
                </div>

                <div className="mt-6 rounded-[24px] border border-white/55 bg-white/72 p-5 dark:border-white/10 dark:bg-white/[0.06]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/50">
                                Walkthrough progress
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-white/75">
                                Track how far the principal has moved through the guided MTSS pilot journey.
                            </p>
                        </div>
                        <div className="rounded-full border border-white/60 bg-white/80 px-3 py-1 text-sm font-black text-slate-950 shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-white">
                            {completionRate}%
                        </div>
                    </div>
                    <div className="mt-4 h-2.5 rounded-full bg-slate-200/80 dark:bg-white/10">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-orange-400"
                            style={{ width: `${Math.min(100, completionRate)}%` }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
});

export const PilotReadinessMiniChart = memo(({ data = [], className }) => (
    <div className={cn(cardSurfaceClass, "p-5", className)}>
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/50">
                    Readiness trend
                </p>
                <h4 className="mt-1 text-lg font-black text-slate-950 dark:text-white">Latest final confidence pulse</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-white/68">
                    The mini chart uses the most recent final feedback entries to show how rollout confidence is moving.
                </p>
            </div>
            <div className="rounded-[20px] bg-gradient-to-br from-emerald-400 via-sky-500 to-violet-500 p-3 text-white shadow-lg">
                <TrendingUp className="h-5 w-5" />
            </div>
        </div>

        {data.length ? (
            <>
                <div className="mt-5 h-36">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }}
                            />
                            <Tooltip
                                cursor={{ fill: "rgba(148,163,184,0.08)" }}
                                contentStyle={{
                                    borderRadius: "16px",
                                    border: "1px solid rgba(148,163,184,0.18)",
                                    background: "rgba(255,255,255,0.97)",
                                    boxShadow: "0 18px 40px rgba(15,23,42,0.14)",
                                }}
                                formatter={(value) => [`${value}/5 confidence`, "Confidence"]}
                                labelFormatter={(_, payload = []) => payload?.[0]?.payload?.name || "Principal"}
                            />
                            <Bar dataKey="confidence" radius={[12, 12, 0, 0]} maxBarSize={26}>
                                {data.map((entry) => (
                                    <Cell key={entry.sessionKey} fill={readinessChartColorMap[entry.readiness] || readinessChartColorMap.draft} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                    {metadataPairs.slice(0, 3).map((item) => (
                        <Badge
                            key={item.key}
                            variant="outline"
                            className={cn("rounded-full border px-3 py-1 font-semibold", readinessChipClassMap[item.key])}
                        >
                            {item.label}
                        </Badge>
                    ))}
                </div>
            </>
        ) : (
            <div className="mt-5 rounded-[22px] border border-dashed border-slate-300/80 bg-white/60 p-5 dark:border-white/10 dark:bg-white/[0.05]">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">No final confidence trend yet</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-white/55">
                    The mini chart will populate after principals save final feedback at the end of the guided pilot.
                </p>
            </div>
        )}
    </div>
));

export const PilotInfoField = memo(({ label, value, tone = "default", multiline = false, className }) => (
    <div className={cn("rounded-[22px] border p-4 shadow-sm", infoToneClassMap[tone] || infoToneClassMap.default, className)}>
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/50">{label}</p>
        <p
            className={cn(
                "mt-2 text-sm leading-relaxed text-slate-700 dark:text-white/78",
                tone === "danger" && "text-rose-700 dark:text-rose-100/90",
                tone === "warning" && "text-amber-800 dark:text-amber-100/90",
                tone === "success" && "text-emerald-800 dark:text-emerald-100/90",
                multiline && "whitespace-pre-wrap",
            )}
        >
            {value || "Not provided"}
        </p>
    </div>
));

export const PilotInsightCard = memo(({
    eyebrow,
    title,
    value,
    icon: Icon,
    tone = "default",
    multiline = false,
    className,
    children,
}) => (
    <div className={cn("rounded-[26px] border p-5 shadow-lg", infoToneClassMap[tone] || infoToneClassMap.default, className)}>
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                {eyebrow ? (
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/50">
                        {eyebrow}
                    </p>
                ) : null}
                <h4 className="mt-1 text-lg font-black leading-snug text-slate-950 dark:text-white">{title}</h4>
            </div>
            {Icon ? (
                <div className="rounded-[18px] bg-white/80 p-2.5 text-slate-700 shadow-sm dark:bg-white/10 dark:text-white">
                    <Icon className="h-4 w-4" />
                </div>
            ) : null}
        </div>
        {children ? (
            <div className="mt-4">{children}</div>
        ) : (
            <p className={cn("mt-4 text-sm leading-relaxed text-slate-700 dark:text-white/78", multiline && "whitespace-pre-wrap")}>
                {value || "Not provided"}
            </p>
        )}
    </div>
));

export const PilotStepFeedbackCard = memo(({ step, completionStatusLabel }) => {
    const bugSeverity = step?.bugSeverity || "medium";
    const severityPanelClass = severityPanelClassMap[bugSeverity] || severityPanelClassMap.medium;
    const isSubmitted = Boolean(step?.completedInHub);
    const stepStatusLabel = isSubmitted ? completionStatusLabel : "Not started";
    const easeValue = isSubmitted ? `${step.easeOfUse}/5` : "Not rated";
    const clarityValue = isSubmitted ? `${step.clarity}/5` : "Not rated";
    const performanceValue = isSubmitted ? `${step.performance}/5` : "Not rated";

    return (
        <details
            className={cn(
                cardSurfaceClass,
                "group relative overflow-hidden",
                step?.bugFound && severityPanelClass,
            )}
        >
            {step?.bugFound ? (
                <span
                    aria-hidden
                    className={cn(
                        "absolute inset-y-0 left-0 w-1.5",
                        severityRailClassMap[bugSeverity] || severityRailClassMap.medium,
                    )}
                />
            ) : null}

            <summary className={cn("list-none cursor-pointer p-5", step?.bugFound && "pl-6")}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-500 dark:text-white/50">
                            Step {step.order}
                        </p>
                        <h5 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{step.title || step.stepId}</h5>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-white/62">
                            {step.duration || "No duration"} · {stepStatusLabel}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge
                            className={cn(
                                "rounded-full border-0 px-3 py-1 text-white",
                                step.completedInHub ? "bg-emerald-500/90" : "bg-slate-500/90",
                            )}
                        >
                            {step.completedInHub ? (
                                <>
                                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                    Marked complete
                                </>
                            ) : "Not marked complete"}
                        </Badge>
                        {step.bugFound ? <PilotSeverityBadge severity={bugSeverity} /> : null}
                        <StepScorePill label="Ease" value={isSubmitted ? step.easeOfUse : "—"} />
                        <StepScorePill label="Clarity" value={isSubmitted ? step.clarity : "—"} />
                        <StepScorePill label="Speed" value={isSubmitted ? step.performance : "—"} />
                        <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
                    </div>
                </div>
            </summary>

            <div className={cn("border-t border-slate-200/80 px-5 pb-5 pt-5 dark:border-white/10", step?.bugFound && "pl-6")}>
                <div className="grid gap-3 md:grid-cols-3">
                    <PilotMetricCard label="Ease of use" value={easeValue} note={isSubmitted ? "Usability score" : "No saved feedback yet"} icon={Sparkles} />
                    <PilotMetricCard label="Clarity" value={clarityValue} note={isSubmitted ? "Understanding score" : "No saved feedback yet"} icon={Compass} />
                    <PilotMetricCard label="Performance" value={performanceValue} note={isSubmitted ? "Speed score" : "No saved feedback yet"} icon={Activity} />
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <PilotInfoField label="Helpful notes" value={step.helpfulNotes || "No helpful notes recorded"} tone="success" />
                    <PilotInfoField label="Confusing or missing" value={step.confusingNotes || "No confusion recorded"} tone="warning" />
                </div>

                {step.partialReason ? (
                    <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50/85 p-4 dark:border-amber-400/25 dark:bg-amber-500/10">
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-700 dark:text-amber-200">
                            Why this step was partial or failed
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-amber-900 dark:text-amber-100/85">{step.partialReason}</p>
                    </div>
                ) : null}

                {step.bugFound ? (
                    <div className={cn("mt-4 rounded-[22px] border p-4", severityPanelClass)}>
                        <div className="flex flex-wrap items-center gap-2">
                            <Bug className="h-4 w-4 text-rose-600 dark:text-rose-300" />
                            <p className="text-sm font-black text-slate-950 dark:text-white">Bug detail</p>
                            <PilotSeverityBadge severity={bugSeverity} />
                        </div>
                        <div className="mt-4 grid gap-4 xl:grid-cols-2">
                            <PilotInfoField label="Bug summary" value={step.bugSummary || "Not provided"} tone="danger" />
                            <PilotInfoField label="Expected result" value={step.expectedResult || "Not provided"} tone="danger" />
                            <PilotInfoField label="Reproduction steps" value={step.reproductionSteps || "Not provided"} tone="danger" multiline />
                            <PilotInfoField label="Screenshot / video link" value={step.screenshotLink || "Not provided"} tone="danger" />
                        </div>
                    </div>
                ) : null}
            </div>
        </details>
    );
});

const getInitials = (name = "") => {
    const trimmed = String(name || "").trim();
    if (!trimmed) return "??";
    return trimmed
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "??";
};

const verdictAccentMap = {
    yes: "from-emerald-400/30 via-emerald-300/15 to-transparent text-emerald-700 dark:text-emerald-200",
    almost: "from-amber-400/30 via-amber-300/15 to-transparent text-amber-700 dark:text-amber-200",
    "not-yet": "from-orange-400/30 via-orange-300/15 to-transparent text-orange-700 dark:text-orange-200",
    draft: "from-slate-400/30 via-slate-300/15 to-transparent text-slate-700 dark:text-white/85",
};

export const PilotPageHeader = memo(({ lastLiveEventAt, onRefresh, sessionCount, principalCount }) => (
    <header className="relative overflow-hidden rounded-[36px] border border-white/45 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(238,242,255,0.92)_45%,rgba(254,243,235,0.94))] px-6 py-7 shadow-[0_28px_80px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(15,23,42,0.85)_45%,rgba(30,41,59,0.92))]">
        <div className="absolute -left-12 -top-10 h-40 w-40 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-500/15" />
        <div className="absolute -right-10 top-6 h-44 w-44 rounded-full bg-orange-300/25 blur-3xl dark:bg-orange-500/15" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/85 bg-white/85 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.32em] text-slate-600 shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-white/75">
                    <LayoutPanelTop className="h-3.5 w-3.5" />
                    MTSS · Principal pilot
                </div>
                <h1 className="text-[30px] font-black leading-[1.05] text-slate-950 dark:text-white sm:text-[36px]">
                    Pilot feedback command center
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-white/65">
                    Live review board for Pak Faisal — every principal session, evidence trail, and rollout signal in one focused screen.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold text-slate-600 dark:text-white/65">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 dark:border-white/15 dark:bg-white/10">
                        <Users2 className="h-3.5 w-3.5" />
                        {principalCount || 0} principals
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 dark:border-white/15 dark:bg-white/10">
                        <Radar className="h-3.5 w-3.5" />
                        {sessionCount || 0} sessions captured
                    </span>
                </div>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
                <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/85 px-3 py-1.5 dark:border-emerald-400/30 dark:bg-emerald-500/15">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-65" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-100">Live stream</span>
                    <span className="text-[11px] text-emerald-700/80 dark:text-emerald-100/80">{formatRelativeTime(lastLiveEventAt)}</span>
                </div>
                <Button onClick={onRefresh} variant="glass" className="rounded-2xl">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Refresh dashboard
                </Button>
            </div>
        </div>
    </header>
));

export const PilotKpiBar = memo(({ stats }) => (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PilotMetricCard
            icon={Users2}
            label="Total sessions"
            value={stats?.totalSessions || 0}
            note={`${stats?.principalCount || 0} principals · ${stats?.activeLast24Hours || 0} active in 24h`}
        />
        <PilotMetricCard
            icon={CheckCircle2}
            label="Completed"
            value={stats?.completedSessions || 0}
            note={`${stats?.inProgressSessions || 0} still in progress`}
            accent="text-emerald-600 dark:text-emerald-300"
        />
        <PilotMetricCard
            icon={Bug}
            label="Sessions with bugs"
            value={stats?.sessionsWithBugs || 0}
            note="Needs review or fixes before rollout"
            accent="text-rose-600 dark:text-rose-300"
        />
        <PilotMetricCard
            icon={ShieldCheck}
            label="Avg confidence"
            value={`${stats?.averageConfidence || 0}/5`}
            note="From principals who saved final feedback"
            accent="text-sky-600 dark:text-sky-300"
        />
    </div>
));

export const PilotPulseRibbon = memo(({ stats, coverageSummary, readinessDistribution }) => {
    const totalSteps = coverageSummary?.totalSteps || 0;
    const fully = coverageSummary?.fullyCoveredSteps || 0;
    const coverageRate = totalSteps ? Math.round((fully / totalSteps) * 100) : 0;

    return (
        <div className={cn(cardSurfaceClass, "flex flex-wrap items-center gap-4 px-5 py-4")}>
            <div className="flex items-center gap-2">
                <div className="rounded-full bg-amber-500/15 p-1.5 text-amber-600 dark:text-amber-300">
                    <Zap className="h-3.5 w-3.5" />
                </div>
                <div className="text-xs">
                    <p className="font-black uppercase tracking-[0.22em] text-slate-500 dark:text-white/55">Active 24h</p>
                    <p className="font-bold text-slate-900 dark:text-white">{stats?.activeLast24Hours || 0} sessions</p>
                </div>
            </div>
            <span className="hidden h-8 w-px bg-slate-200/80 dark:bg-white/10 sm:block" />
            <div className="flex items-center gap-2">
                <div className="rounded-full bg-sky-500/15 p-1.5 text-sky-600 dark:text-sky-300">
                    <LayoutPanelTop className="h-3.5 w-3.5" />
                </div>
                <div className="text-xs">
                    <p className="font-black uppercase tracking-[0.22em] text-slate-500 dark:text-white/55">Step coverage</p>
                    <p className="font-bold text-slate-900 dark:text-white">{fully}/{totalSteps} fully ({coverageRate}%)</p>
                </div>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
                {metadataPairs.map((item) => (
                    <Badge
                        key={item.key}
                        variant="outline"
                        className={cn("rounded-full border px-2.5 py-1 text-[11px] font-bold", readinessChipClassMap[item.key])}
                    >
                        {item.label}: {readinessDistribution?.[item.key] || 0}
                    </Badge>
                ))}
            </div>
        </div>
    );
});

const PilotMetaPill = memo(({ icon: Icon, label, value }) => (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/85 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-white/80">
        {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-white/55" /> : null}
        <span className="truncate">
            <span className="font-bold uppercase tracking-[0.18em] text-[10px] text-slate-500 dark:text-white/50">{label}</span>
            <span className="ml-1.5 truncate text-slate-800 dark:text-white">{value || "—"}</span>
        </span>
    </span>
));
PilotMetaPill.displayName = "PilotMetaPill";

const PilotInlineStat = memo(({ label, value, accent }) => (
    <div className="rounded-[18px] border border-white/55 bg-white/82 px-3 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/55">{label}</p>
        <p className={cn("mt-1.5 text-xl font-black leading-tight text-slate-950 dark:text-white", accent)}>{value}</p>
    </div>
));
PilotInlineStat.displayName = "PilotInlineStat";

export const PilotIdentityCard = memo(({
    session,
    statusLabel,
    readinessLabel,
    lastUpdatedLabel,
    bugSummary,
    completionRate,
    confidenceLabel,
    finalSaved,
}) => {
    const readinessKey = session?.finalFeedbackSavedAt ? (session?.finalFeedback?.readiness || "not-yet") : "draft";
    const initials = getInitials(session?.tester?.name);

    return (
        <section className={cn(panelSurfaceClass, "sticky top-6 z-20 p-6")}>
            <div className="absolute inset-x-6 top-0 h-1 rounded-b-full bg-gradient-to-r from-sky-500 via-violet-500 to-orange-400" />

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                <div className="flex items-start gap-4 min-w-0">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 via-violet-500 to-orange-400 text-lg font-black text-white shadow-md">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500 dark:text-white/55">Selected principal</p>
                            <h3 className="mt-1 truncate text-[26px] font-black leading-tight text-slate-950 dark:text-white">
                                {session?.tester?.name || "Unnamed principal"}
                            </h3>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            <PilotMetaPill icon={Mail} label="Email" value={session?.tester?.email || "No email"} />
                            <PilotMetaPill icon={Building2} label="Unit" value={session?.tester?.unit || "No unit"} />
                            <PilotMetaPill icon={User2} label="Role" value={session?.tester?.role || "No role"} />
                            <PilotMetaPill icon={Hash} label="Key" value={session?.sessionKey || "—"} />
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            <PilotStatusBadge statusLabel={statusLabel} isCompleted={session?.status === "completed"} />
                            <Badge
                                variant="outline"
                                className={cn("rounded-full border px-2.5 py-1 text-xs font-bold", readinessChipClassMap[readinessKey] || readinessChipClassMap.draft)}
                            >
                                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                                {readinessLabel}
                            </Badge>
                            {bugSummary?.highestSeverity ? (
                                <PilotSeverityBadge severity={bugSummary.highestSeverity} count={bugSummary.total} />
                            ) : (
                                <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-100">
                                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                    No bug reports
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                    <PilotInlineStat label="Completion" value={`${completionRate}%`} accent="text-sky-600 dark:text-sky-300" />
                    <PilotInlineStat
                        label="Bug load"
                        value={bugSummary?.total || 0}
                        accent={bugSummary?.total ? "text-rose-600 dark:text-rose-300" : "text-emerald-600 dark:text-emerald-300"}
                    />
                    <PilotInlineStat
                        label="Confidence"
                        value={confidenceLabel}
                        accent={finalSaved ? "text-emerald-600 dark:text-emerald-300" : "text-slate-500 dark:text-white/55"}
                    />
                    <PilotInlineStat label="Last sync" value={lastUpdatedLabel} accent="text-amber-600 dark:text-amber-300" />
                </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/55">Walkthrough</span>
                <div className="flex-1 h-2 rounded-full bg-slate-200/80 dark:bg-white/10">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-orange-400"
                        style={{ width: `${Math.min(100, completionRate)}%` }}
                    />
                </div>
                <span className="text-xs font-black text-slate-700 dark:text-white/80">
                    {session?.completedStepCount || 0}/{session?.stepCount || 0}
                </span>
            </div>
        </section>
    );
});

export const PilotDecisionHub = memo(({
    readinessLabel,
    confidenceLabel,
    finalSaved,
    bugSummary,
    reviewPriorityNote,
    finalSavedAtLabel,
}) => {
    const readinessKey = finalSaved ? "yes" : "draft";

    return (
        <PilotPanelSection
            eyebrow="Decision summary"
            title="Rollout verdict, confidence, and the next move"
            description="Three answers Pak Faisal needs at a glance: what was decided, how confident the principal felt, and what to handle first."
        >
            <div className="grid gap-4 lg:grid-cols-3">
                <div className={cn(
                    "relative overflow-hidden rounded-[26px] border p-5 shadow-sm",
                    finalSaved
                        ? "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-400/25 dark:bg-emerald-500/10"
                        : "border-slate-200/85 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.05]",
                )}>
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", verdictAccentMap[readinessKey])} />
                    <div className="relative">
                        <div className="flex items-center gap-2">
                            <div className="rounded-full bg-white/80 p-1.5 text-emerald-600 shadow-sm dark:bg-white/10 dark:text-emerald-300">
                                <ShieldCheck className="h-4 w-4" />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-600 dark:text-white/65">Rollout verdict</p>
                        </div>
                        <p className="mt-3 text-3xl font-black leading-tight text-slate-950 dark:text-white">{readinessLabel}</p>
                        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-white/70">
                            {finalSaved ? `Final feedback saved · ${finalSavedAtLabel}` : "Draft only — final feedback not yet locked."}
                        </p>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-[26px] border border-sky-200/80 bg-sky-50/80 p-5 shadow-sm dark:border-sky-400/25 dark:bg-sky-500/10">
                    <div className="flex items-center gap-2">
                        <div className="rounded-full bg-white/80 p-1.5 text-sky-600 shadow-sm dark:bg-white/10 dark:text-sky-300">
                            <Gauge className="h-4 w-4" />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-600 dark:text-white/65">Confidence</p>
                    </div>
                    <p className="mt-3 text-4xl font-black leading-none text-sky-700 dark:text-sky-200">{confidenceLabel}</p>
                    <div className="mt-3 h-1.5 rounded-full bg-white/70 dark:bg-white/10">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500"
                            style={{ width: finalSaved ? `${Math.min(100, (parseInt(confidenceLabel, 10) || 0) * 20)}%` : "8%" }}
                        />
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-white/70">
                        {finalSaved ? "Self-reported overall confidence on rollout readiness." : "No saved confidence score yet."}
                    </p>
                </div>

                <div className={cn(
                    "relative overflow-hidden rounded-[26px] border p-5 shadow-sm",
                    bugSummary?.highestSeverity
                        ? severityPanelClassMap[bugSummary.highestSeverity]
                        : "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-400/25 dark:bg-emerald-500/10",
                )}>
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "rounded-full p-1.5 shadow-sm",
                            bugSummary?.highestSeverity
                                ? "bg-white/80 text-rose-600 dark:bg-white/10 dark:text-rose-300"
                                : "bg-white/80 text-emerald-600 dark:bg-white/10 dark:text-emerald-300",
                        )}>
                            <Target className="h-4 w-4" />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-600 dark:text-white/65">Priority action</p>
                    </div>
                    <p className="mt-3 text-base font-black leading-snug text-slate-950 dark:text-white">
                        {bugSummary?.total
                            ? `Review ${bugSummary.highestSeverity} severity first (${bugSummary.total} report${bugSummary.total > 1 ? "s" : ""})`
                            : finalSaved
                                ? "Cross-check recommendation against evidence"
                                : "Push for final feedback submission"}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-white/70">{reviewPriorityNote}</p>
                    {bugSummary?.total ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {["high", "medium", "low"]
                                .filter((sev) => bugSummary?.counts?.[sev] > 0)
                                .map((sev) => (
                                    <PilotSeverityBadge key={sev} severity={sev} count={bugSummary.counts[sev]} />
                                ))}
                        </div>
                    ) : null}
                </div>
            </div>
        </PilotPanelSection>
    );
});

export const PilotInsightTile = memo(({
    eyebrow,
    title,
    value,
    icon: Icon,
    tone = "default",
    multiline = false,
    span = false,
}) => (
    <div className={cn(
        "relative overflow-hidden rounded-[24px] border p-5 shadow-sm transition hover:shadow-md",
        infoToneClassMap[tone] || infoToneClassMap.default,
        span && "md:col-span-2",
    )}>
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500 dark:text-white/55">{eyebrow}</p>
                <h4 className="mt-1.5 text-sm font-black leading-snug text-slate-950 dark:text-white">{title}</h4>
            </div>
            {Icon ? (
                <div className="rounded-[14px] bg-white/85 p-2 text-slate-600 shadow-sm dark:bg-white/10 dark:text-white/80">
                    <Icon className="h-3.5 w-3.5" />
                </div>
            ) : null}
        </div>
        <p className={cn(
            "mt-3 text-sm leading-relaxed text-slate-700 dark:text-white/80",
            multiline && "whitespace-pre-wrap",
            !value && "italic text-slate-400 dark:text-white/40",
        )}>
            {value || "Not provided"}
        </p>
    </div>
));

export const PilotMetadataStrip = memo(({ session, finalSavedAtLabel, sessionKey, completionLabel }) => (
    <div className={cn(cardSurfaceClass, "p-5")}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/55">Final saved</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{finalSavedAtLabel}</p>
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/55">Last server update</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{session?.updatedAt ? new Date(session.updatedAt).toLocaleString() : "Not yet"}</p>
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/55">Steps completed</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{completionLabel}</p>
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/55">Session key</p>
                <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">{sessionKey || "—"}</p>
            </div>
        </div>
    </div>
));

export const PilotLiveMonitor = memo(({ session }) => {
    const liveStatus = getPilotLiveStatus(session);
    const currentStep = session?.liveContext?.currentStepTitle || "No step in focus";
    const currentRoute = formatPilotRouteLabel(session?.liveContext?.currentRoute || session?.lastViewedRoute || "");
    const lastActionAt = formatDateTime(session?.liveContext?.lastActionAt || session?.updatedAt || session?.clientUpdatedAt);

    return (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <PilotInfoField label="Live status" value={liveStatus} tone="info" />
            <PilotInfoField label="Step in focus" value={currentStep} tone="default" />
            <PilotInfoField label="Live route" value={currentRoute} tone="default" multiline className="xl:col-span-2" />
            <PilotInfoField label="Open modal" value={session?.liveContext?.currentModal || "No modal open"} tone="default" />
            <PilotInfoField label="Last principal action" value={session?.liveContext?.currentAction || "No action label yet"} tone="warning" />
            <PilotInfoField label="Last live event" value={lastActionAt} tone="success" />
            <PilotInfoField label="Final feedback state" value={session?.finalFeedbackSavedAt ? "Final feedback saved" : "Still drafting or not started"} tone={session?.finalFeedbackSavedAt ? "success" : "warning"} />
        </div>
    );
});

export const PilotActivityTimeline = memo(({ items = [] }) => {
    if (!items.length) {
        return (
            <PilotEmptyState
                title="No activity trail yet"
                description="Recent pilot actions will appear here as principals open steps, write feedback, and save their wrap-up."
            />
        );
    }

    return (
        <div className="space-y-3">
            {items.map((entry, index) => (
                <div
                    key={`${entry.type}-${entry.at}-${index}`}
                    className="grid gap-3 rounded-[24px] border border-white/45 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05] md:grid-cols-[9rem_minmax(0,1fr)]"
                >
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/50">{entry.type || "activity"}</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{formatDateTime(entry.at)}</p>
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{entry.label || "Activity recorded"}</p>
                        {entry.stepTitle ? (
                            <p className="text-xs text-slate-500 dark:text-white/55">Step: {entry.stepTitle}</p>
                        ) : null}
                        {entry.route ? (
                            <p className="text-xs leading-relaxed text-slate-500 dark:text-white/55">
                                Route: {formatPilotRouteLabel(entry.route)}
                            </p>
                        ) : null}
                    </div>
                </div>
            ))}
        </div>
    );
});

PilotPanelSection.displayName = "PilotPanelSection";
PilotMetricCard.displayName = "PilotMetricCard";
PilotDashboardHero.displayName = "PilotDashboardHero";
PilotFilterSelect.displayName = "PilotFilterSelect";
PilotEmptyState.displayName = "PilotEmptyState";
PilotCoverageCard.displayName = "PilotCoverageCard";
PilotStatusBadge.displayName = "PilotStatusBadge";
PilotSeverityBadge.displayName = "PilotSeverityBadge";
PilotSessionListItem.displayName = "PilotSessionListItem";
PilotSessionSpotlight.displayName = "PilotSessionSpotlight";
PilotReadinessMiniChart.displayName = "PilotReadinessMiniChart";
PilotInfoField.displayName = "PilotInfoField";
PilotInsightCard.displayName = "PilotInsightCard";
PilotStepFeedbackCard.displayName = "PilotStepFeedbackCard";
PilotPageHeader.displayName = "PilotPageHeader";
PilotKpiBar.displayName = "PilotKpiBar";
PilotPulseRibbon.displayName = "PilotPulseRibbon";
PilotIdentityCard.displayName = "PilotIdentityCard";
PilotDecisionHub.displayName = "PilotDecisionHub";
PilotInsightTile.displayName = "PilotInsightTile";
PilotMetadataStrip.displayName = "PilotMetadataStrip";
PilotLiveMonitor.displayName = "PilotLiveMonitor";
PilotActivityTimeline.displayName = "PilotActivityTimeline";
