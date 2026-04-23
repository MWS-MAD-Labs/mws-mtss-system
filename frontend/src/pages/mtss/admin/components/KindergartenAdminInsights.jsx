import React, { memo, useMemo } from "react";
import { AlertTriangle, CheckCircle2, BarChart3, Users2 } from "lucide-react";

const SIGNAL_META = {
    emerging: { label: "🌱 Emerging", accent: "from-amber-400 to-amber-500" },
    developing: { label: "🌿 Developing", accent: "from-sky-400 to-sky-500" },
    consistent: { label: "🌳 Consistent", accent: "from-emerald-400 to-emerald-500" },
};

const STATUS_META = {
    ok: { label: "On Track", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
    attention: { label: "Needs Attention", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
    urgent: { label: "Urgent", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
};

const clampIntensity = (value, max) => {
    if (!max) return 0;
    const ratio = Math.min(1, Math.max(0, value / max));
    return Math.round(ratio * 100);
};

const formatDate = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parsed);
};

const KindergartenAdminInsights = memo(({ analytics }) => {
    const domainHeatmap = analytics?.domainHeatmap || {};
    const weeks = Array.isArray(domainHeatmap.weeks) ? domainHeatmap.weeks : [];
    const domains = Array.isArray(domainHeatmap.domains) ? domainHeatmap.domains : [];
    const classRows = Array.isArray(domainHeatmap.classes) ? domainHeatmap.classes : [];
    const signalDistribution = analytics?.signalDistribution || {};
    const fidelity = analytics?.fidelity || {};
    const tierMonitoring = analytics?.tierMonitoring || {};

    const maxHeatValue = useMemo(
        () =>
            domains.reduce((max, domain) => {
                const localMax = Array.isArray(domain.counts) ? Math.max(...domain.counts, 0) : 0;
                return Math.max(max, localMax);
            }, 0),
        [domains],
    );

    if (!analytics) {
        return (
            <div className="rounded-[28px] border border-white/40 bg-white/85 dark:bg-white/5 p-6 text-sm text-muted-foreground">
                Kindergarten analytics are not available yet.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="glass glass-card mtss-card-surface p-6 rounded-[32px] space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Kindergarten Pulse</p>
                        <h3 className="text-xl font-black text-foreground dark:text-white">
                            Domain Heatmap ({weeks.length || 0} weeks)
                        </h3>
                    </div>
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                </div>

                <div className="overflow-x-auto rounded-2xl border border-primary/15 bg-white/80 dark:bg-white/5">
                    <table className="min-w-full text-xs sm:text-sm">
                        <thead>
                            <tr className="border-b border-primary/10">
                                <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Domain</th>
                                {weeks.map((week) => (
                                    <th key={week.key} className="px-3 py-2 text-center font-semibold text-muted-foreground">
                                        {week.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {domains.map((domain) => (
                                <tr key={domain.tag} className="border-b last:border-b-0 border-primary/10">
                                    <td className="px-3 py-2 font-semibold text-foreground dark:text-white">{domain.label}</td>
                                    {(domain.counts || []).map((count, idx) => {
                                        const intensity = clampIntensity(count, maxHeatValue);
                                        return (
                                            <td key={`${domain.tag}-${weeks[idx]?.key || idx}`} className="px-2 py-2 text-center">
                                                <span
                                                    className="inline-flex min-w-[42px] justify-center px-2 py-1 rounded-lg font-semibold text-[11px]"
                                                    style={{
                                                        backgroundColor: `rgba(99,102,241,${0.12 + intensity / 120})`,
                                                        color: intensity > 65 ? "white" : "rgb(55,65,81)",
                                                    }}
                                                >
                                                    {count}
                                                </span>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    {classRows.slice(0, 3).map((entry) => (
                        <div key={entry.className} className="rounded-2xl bg-white/70 dark:bg-white/5 border border-primary/10 p-3">
                            <p className="text-sm font-semibold text-foreground dark:text-white">{entry.className}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {entry.studentCount} students • {entry.totalObservations} observations this week
                            </p>
                            <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1">
                                Dominant: {entry.dominantDomainLabel || "Not enough data yet"}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <div className="glass glass-card mtss-card-surface p-6 rounded-[32px] space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-foreground dark:text-white">Signal Distribution (this week)</h3>
                        <Users2 className="w-5 h-5 text-sky-500" />
                    </div>
                    <div className="space-y-3">
                        {Object.keys(SIGNAL_META).map((signalKey) => {
                            const count = signalDistribution?.counts?.[signalKey] || 0;
                            const percent = signalDistribution?.percentages?.[signalKey] || 0;
                            const meta = SIGNAL_META[signalKey];
                            return (
                                <div key={signalKey}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="font-semibold text-foreground dark:text-white">{meta.label}</span>
                                        <span className="text-muted-foreground">{count} students ({percent}%)</span>
                                    </div>
                                    <div className="h-2.5 rounded-full bg-white/20">
                                        <div className={`h-full rounded-full bg-gradient-to-r ${meta.accent}`} style={{ width: `${percent}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                        <p className="text-xs text-muted-foreground pt-1">
                            Total students with signal detected this week: {signalDistribution?.total || 0}
                        </p>
                    </div>
                </div>

                <div className="glass glass-card mtss-card-surface p-6 rounded-[32px] space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-foreground dark:text-white">Tier Monitoring</h3>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {["tier1", "tier2", "tier3"].map((tier) => (
                            <div key={tier} className="rounded-2xl bg-white/70 dark:bg-white/5 border border-primary/10 p-3 text-center">
                                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{tier.toUpperCase()}</p>
                                <p className="text-xl font-black text-foreground dark:text-white">{tierMonitoring?.tierCounts?.[tier] || 0}</p>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Escalation Candidates</p>
                        {(tierMonitoring?.escalationCandidates || []).slice(0, 4).map((entry) => (
                            <div key={entry.studentId} className="rounded-xl bg-rose-50/70 dark:bg-rose-900/15 border border-rose-200/50 dark:border-rose-700/30 px-3 py-2">
                                <p className="text-sm font-semibold text-foreground dark:text-white">
                                    {entry.name} • {entry.className}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Support streak {entry.supportNeededStreak}x • {entry.currentTier.toUpperCase()} → {entry.suggestedTier.toUpperCase()}
                                </p>
                            </div>
                        ))}
                        {!(tierMonitoring?.escalationCandidates || []).length && (
                            <p className="text-xs text-muted-foreground">No escalation candidates this week.</p>
                        )}
                    </div>
                </div>
            </section>

            <section className="glass glass-card mtss-card-surface p-6 rounded-[32px] space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-foreground dark:text-white">Teacher Fidelity Check</h3>
                        <p className="text-xs text-muted-foreground">Review qualitative observation routine per mentor</p>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>

                <div className="overflow-x-auto rounded-2xl border border-primary/10">
                    <table className="min-w-full text-xs sm:text-sm">
                        <thead>
                            <tr className="border-b border-primary/10">
                                <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Mentor</th>
                                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Students</th>
                                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Obs This Week</th>
                                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Last Obs</th>
                                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(fidelity?.teachers || []).map((teacher) => (
                                <tr key={teacher.mentorId || teacher.mentorName} className="border-b last:border-b-0 border-primary/10">
                                    <td className="px-3 py-2 font-semibold text-foreground dark:text-white">{teacher.mentorName}</td>
                                    <td className="px-3 py-2 text-center">{teacher.trackedStudents}</td>
                                    <td className="px-3 py-2 text-center">{teacher.observationsThisWeek}</td>
                                    <td className="px-3 py-2 text-center">
                                        {formatDate(teacher.lastObservationDate)}
                                        {teacher.daysSinceLastObservation !== null && (
                                            <span className="block text-[11px] text-muted-foreground">{teacher.daysSinceLastObservation} days ago</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_META[teacher.status]?.className || ""}`}>
                                            {STATUS_META[teacher.status]?.label || teacher.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {(fidelity?.alerts || []).length > 0 && (
                    <div className="space-y-2">
                        {(fidelity.alerts || []).slice(0, 3).map((alert) => (
                            <p key={`${alert.mentorName}-${alert.type}`} className="text-xs text-amber-700 dark:text-amber-300">
                                {alert.message}
                            </p>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
});

KindergartenAdminInsights.displayName = "KindergartenAdminInsights";

export default KindergartenAdminInsights;
