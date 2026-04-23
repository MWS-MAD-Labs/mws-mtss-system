import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const DashboardOverviewSpotlightChart = ({ chartSeries = [], progressUnit = "score" }) => {
    const { latest, goal, delta, average, gap, yDomain } = useMemo(() => {
        const series = Array.isArray(chartSeries) ? chartSeries : [];
        if (!series.length) {
            return { latest: 0, goal: 100, delta: 0, average: 0, gap: 100, yDomain: [0, 100] };
        }
        const last = series[series.length - 1];
        const prev = series[series.length - 2];
        const latestValue = last?.reading != null ? Number(last.reading) : 0;
        const goalValue = last?.goal != null ? Number(last.goal) : null;
        const prevValue = prev?.reading != null ? Number(prev.reading) : latestValue;
        const validReadings = series.filter((d) => d?.reading != null).map((d) => Number(d.reading));
        const avgValue = validReadings.length
            ? Math.round(validReadings.reduce((sum, v) => sum + v, 0) / validReadings.length)
            : 0;
        const allDataValues = [
            ...validReadings,
            ...series.filter((d) => d?.goal != null).map((d) => Number(d.goal)),
        ].filter(Number.isFinite);
        const minVal = allDataValues.length ? Math.min(...allDataValues) : 0;
        const maxVal = allDataValues.length ? Math.max(...allDataValues) : 100;
        const padding = Math.max((maxVal - minVal) * 0.15, 5);
        return {
            latest: latestValue,
            goal: goalValue,
            delta: Math.round(latestValue - prevValue),
            average: avgValue,
            gap: goalValue != null ? Math.max(0, goalValue - latestValue) : null,
            yDomain: [Math.max(0, Math.floor(minVal - padding)), Math.ceil(maxVal + padding)],
        };
    }, [chartSeries]);

    const fmt = (v) => (v == null ? "-" : progressUnit === "%" ? `${v}%` : `${v} ${progressUnit}`);

    const deltaTone = delta >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300";
    const deltaSign = delta > 0 ? "+" : "";

    return (
        <div
            className="mtss-rainbow-shell rounded-3xl p-4 border border-white/40 dark:border-white/10 bg-gradient-to-br from-white/85 via-white/70 to-white/60 dark:from-white/10 dark:via-white/5 dark:to-white/5"
            data-aos="fade-up"
            data-aos-delay="140"
        >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground">Trend</p>
                    <p className="text-sm font-semibold text-foreground dark:text-white">Progress vs Goal</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Latest: <span className="font-semibold text-foreground dark:text-white">{fmt(latest)}</span>
                        {gap != null && (
                            <> · Gap: <span className="font-semibold text-foreground dark:text-white">{fmt(gap)}</span></>
                        )}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50/80 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-200 border border-emerald-200/50">
                        Latest {fmt(latest)}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100/80 text-slate-600 dark:bg-slate-800/50 dark:text-slate-200 border border-white/40">
                        Avg {fmt(average)}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 dark:bg-white/10 border border-white/40 ${deltaTone}`}>
                        {deltaSign}{fmt(Math.abs(delta))}
                    </span>
                    {goal != null && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50/80 text-amber-600 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-200/50">
                            Goal {fmt(goal)}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground mb-2">
                <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Actual
                </span>
                <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gold" />
                    Goal
                </span>
            </div>

            <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                    <XAxis
                        dataKey="date"
                        stroke="rgba(209,213,219,0.85)"
                        tick={{ fill: "rgba(148,163,184,0.85)", fontSize: 11 }}
                    />
                    <YAxis
                        width={42}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "rgba(148,163,184,0.85)", fontSize: 11 }}
                        domain={yDomain}
                        tickFormatter={(value) => progressUnit === "%" ? `${value}%` : `${value}`}
                    />
                    <Tooltip
                        cursor={{ stroke: "rgba(99,102,241,0.4)", strokeWidth: 2 }}
                        formatter={(value, name) => [
                            value != null ? fmt(value) : "-",
                            name === "reading" ? "Actual" : "Goal",
                        ]}
                        contentStyle={{
                            borderRadius: 16,
                            border: "1px solid rgba(148,163,184,0.3)",
                            backgroundColor: "rgba(15,23,42,0.9)",
                            color: "#f8fafc",
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="reading"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.6}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                    />
                    <Line
                        type="monotone"
                        dataKey="goal"
                        stroke="hsl(var(--gold))"
                        strokeDasharray="4 4"
                        strokeWidth={1.8}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default DashboardOverviewSpotlightChart;
