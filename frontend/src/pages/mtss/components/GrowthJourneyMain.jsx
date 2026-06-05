import { useState, useCallback } from "react";
import { TrendingUp, Zap, Clock, BarChart3, Award, Target, ClipboardList, CalendarDays, FileText, ChevronRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Line, ReferenceLine, Legend } from "recharts";
import NotesBottomSheet from "./NotesBottomSheet";
import InfoCardDetailSheet from "./InfoCardDetailSheet";
import InterventionActivityLog from "./InterventionActivityLog";

const isMeaningfulValue = (value) => {
    if (value === null || value === undefined) return false;
    const text = `${value}`.trim();
    if (!text) return false;
    const normalized = text.toLowerCase();
    if (["not set", "tbd", "-"].includes(normalized)) return false;
    return /[a-z0-9]/i.test(text);
};

const MONITORING_TONES = {
    SEL: {
        bar: "from-rose-500 via-pink-500 to-fuchsia-500",
        icon: "from-rose-500 to-pink-500",
        bg: "from-rose-50 via-white to-pink-50",
        text: "text-rose-700 dark:text-rose-200",
        shadow: "shadow-[0_18px_50px_rgba(244,63,94,0.18)]",
    },
    ENGLISH: {
        bar: "from-sky-500 via-blue-500 to-indigo-500",
        icon: "from-sky-500 to-blue-500",
        bg: "from-sky-50 via-white to-blue-50",
        text: "text-sky-700 dark:text-sky-200",
        shadow: "shadow-[0_18px_50px_rgba(14,165,233,0.18)]",
    },
    MATH: {
        bar: "from-emerald-500 via-teal-500 to-green-500",
        icon: "from-emerald-500 to-teal-500",
        bg: "from-emerald-50 via-white to-teal-50",
        text: "text-emerald-700 dark:text-emerald-200",
        shadow: "shadow-[0_18px_50px_rgba(16,185,129,0.18)]",
    },
    BEHAVIOR: {
        bar: "from-amber-500 via-orange-500 to-yellow-500",
        icon: "from-amber-500 to-orange-500",
        bg: "from-amber-50 via-white to-orange-50",
        text: "text-amber-700 dark:text-amber-200",
        shadow: "shadow-[0_18px_50px_rgba(245,158,11,0.18)]",
    },
    ATTENDANCE: {
        bar: "from-indigo-500 via-violet-500 to-purple-500",
        icon: "from-indigo-500 to-violet-500",
        bg: "from-indigo-50 via-white to-violet-50",
        text: "text-indigo-700 dark:text-indigo-200",
        shadow: "shadow-[0_18px_50px_rgba(99,102,241,0.18)]",
    },
    INDONESIAN: {
        bar: "from-rose-500 via-red-500 to-pink-500",
        icon: "from-rose-500 to-red-500",
        bg: "from-rose-50 via-white to-red-50",
        text: "text-rose-700 dark:text-rose-200",
        shadow: "shadow-[0_18px_50px_rgba(225,29,72,0.18)]",
    },
    DEFAULT: {
        bar: "from-cyan-500 via-sky-500 to-blue-500",
        icon: "from-cyan-500 to-blue-500",
        bg: "from-cyan-50 via-white to-sky-50",
        text: "text-sky-700 dark:text-sky-200",
        shadow: "shadow-[0_18px_50px_rgba(14,165,233,0.18)]",
    },
};

const InfoCard = ({ icon: Icon, label, value, gradient, shortLabel, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/60 dark:border-slate-700/40 bg-white/85 dark:bg-slate-900/50 p-2 sm:p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg text-left w-full cursor-pointer active:scale-[0.97]"
    >
        <div className={`absolute inset-x-0 top-0 h-0.5 sm:h-1 bg-gradient-to-r ${gradient} opacity-90`} />
        <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-105 flex-shrink-0`}>
                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[8px] sm:text-[10px] uppercase tracking-wider text-muted-foreground leading-tight">
                    <span className="sm:hidden">{shortLabel || label}</span>
                    <span className="hidden sm:inline">{label}</span>
                </p>
                <p className="text-[11px] sm:text-sm font-semibold text-foreground dark:text-white truncate leading-tight">
                    {value}
                </p>
            </div>
            <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground/50 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </div>
    </button>
);

const GrowthJourneyMain = ({
    intervention,
    config,
    CurrentIcon,
    strategyLabel,
    durationLabel,
    frequencyLabel,
    mentorLabel,
    pairingLabel,
    goalLabel,
    monitoringMethodLabel,
    startDateLabel,
    notesLabel,
}) => {
    const hasStrategy = isMeaningfulValue(strategyLabel);
    const hasDuration = isMeaningfulValue(durationLabel);
    const hasFrequency = isMeaningfulValue(frequencyLabel);
    const hasMentor = isMeaningfulValue(mentorLabel);
    const hasPairing = isMeaningfulValue(pairingLabel);
    const hasGoal = isMeaningfulValue(goalLabel);
    const hasMonitoring = isMeaningfulValue(monitoringMethodLabel);
    const hasStartDate = isMeaningfulValue(startDateLabel);
    const hasNotes = isMeaningfulValue(notesLabel);

    const hasCompactRow = hasStrategy || hasDuration || hasFrequency || hasMentor;
    const toneKey = intervention?.type?.toUpperCase?.() || "DEFAULT";
    const monitoringTone = MONITORING_TONES[toneKey] || MONITORING_TONES.DEFAULT;
    const [notesSheetOpen, setNotesSheetOpen] = useState(false);
    const [detailSheet, setDetailSheet] = useState(null);

    const openDetail = useCallback((key) => setDetailSheet(key), []);
    const closeDetail = useCallback(() => setDetailSheet(null), []);

    return (
        <div className="flex-1 space-y-3 sm:space-y-5">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[8px] sm:text-xs uppercase tracking-wider text-muted-foreground">
                            Growth Journey
                        </p>
                        <h3 className="text-sm sm:text-xl font-bold text-foreground dark:text-white flex items-center gap-1.5 sm:gap-2">
                            <div className={`w-6 h-6 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                <CurrentIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <span className="truncate">{intervention.label}</span>
                        </h3>
                    </div>
                </div>
                <span className={`text-2xl sm:text-5xl font-black bg-gradient-to-r ${config.gradient} text-transparent bg-clip-text flex-shrink-0`}>
                    {intervention.progress ?? 0}%
                </span>
            </div>

            {hasPairing && (
                <div className="flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2 text-xs font-semibold text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-100 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    <ClipboardList className="h-4 w-4 shrink-0" />
                    <span className="truncate" title={pairingLabel}>{pairingLabel}</span>
                </div>
            )}

            <div className="relative rounded-xl sm:rounded-2xl p-2.5 sm:p-4 bg-white/80 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/40">
                <div className="h-40 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={intervention.chart || []} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`gradient-${intervention.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={config.chartColor} stopOpacity={0.35} />
                                    <stop offset="95%" stopColor={config.chartColor} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
                            {intervention.target != null && (
                                <ReferenceLine
                                    y={Number(intervention.target) || 0}
                                    stroke="#f59e0b"
                                    strokeDasharray="8 4"
                                    strokeWidth={1.5}
                                    label={{ value: `Target: ${intervention.target}`, position: "insideTopRight", fill: "#f59e0b", fontSize: 9, fontWeight: 600 }}
                                />
                            )}
                            {intervention.baseline != null && (
                                <ReferenceLine
                                    y={Number(intervention.baseline) || 0}
                                    stroke="#f472b6"
                                    strokeDasharray="4 4"
                                    strokeWidth={1}
                                    label={{ value: `Baseline: ${intervention.baseline}`, position: "insideBottomRight", fill: "#f472b6", fontSize: 9, fontWeight: 600 }}
                                />
                            )}
                            <XAxis
                                dataKey="label"
                                tick={{ fill: "rgba(148,163,184,1)", fontSize: 9, fontWeight: 500 }}
                                stroke="rgba(148,163,184,0.3)"
                                tickLine={false}
                                dy={4}
                            />
                            <YAxis
                                tick={{ fill: "rgba(148,163,184,1)", fontSize: 9, fontWeight: 500 }}
                                stroke="rgba(148,163,184,0.3)"
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: 14,
                                    border: "1px solid rgba(148,163,184,0.2)",
                                    backdropFilter: "blur(16px)",
                                    background: "rgba(255,255,255,0.95)",
                                    boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                                    fontSize: 12,
                                    padding: "8px 12px",
                                }}
                                labelStyle={{ fontWeight: 700, marginBottom: 4, color: "#334155" }}
                                formatter={(value, name) => {
                                    const label = name === "reading" ? "Score" : name === "goal" ? "Goal Line" : name;
                                    return [value, label];
                                }}
                                cursor={{ stroke: config.chartColor, strokeWidth: 1, strokeDasharray: "4 4" }}
                            />
                            <Legend
                                verticalAlign="top"
                                align="right"
                                iconType="circle"
                                iconSize={7}
                                wrapperStyle={{ fontSize: 10, fontWeight: 600, paddingBottom: 4 }}
                                formatter={(value) => {
                                    if (value === "reading") return "Progress";
                                    if (value === "goal") return "Goal Line";
                                    return value;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="reading"
                                name="reading"
                                stroke={config.chartColor}
                                strokeWidth={2.5}
                                fill={`url(#gradient-${intervention.id})`}
                                dot={{ r: 3, fill: config.chartColor, stroke: "#fff", strokeWidth: 1.5 }}
                                activeDot={{ r: 5, fill: config.chartColor, stroke: "#fff", strokeWidth: 2 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="goal"
                                name="goal"
                                stroke="#0ea5e9"
                                strokeWidth={2}
                                strokeDasharray="6 4"
                                dot={false}
                                activeDot={{ r: 4, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-3 max-w-2xl mx-auto">
                {[
                    { label: "Baseline", value: intervention.baseline, color: "from-pink-500 to-rose-500", bg: "bg-pink-50 dark:bg-pink-900/20" },
                    { label: "Current", value: intervention.current, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                    { label: "Target", value: intervention.target, color: "from-amber-500 to-orange-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
                ].map((stat) => (
                    <div key={stat.label} className={`${stat.bg} rounded-lg sm:rounded-2xl p-2 sm:p-4 text-center`}>
                        <p className="text-[8px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-0.5 sm:mb-1">{stat.label}</p>
                        <p className={`text-base sm:text-2xl font-black bg-gradient-to-r ${stat.color} text-transparent bg-clip-text`}>
                            {stat.value ?? "-"}
                        </p>
                        <p className="text-[8px] sm:text-xs text-muted-foreground">{intervention.progressUnit || "pts"}</p>
                    </div>
                ))}
            </div>

            {(hasCompactRow || hasGoal || hasMonitoring || hasStartDate || hasNotes) && (
                <div className="rounded-xl sm:rounded-2xl border border-white/50 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/40 p-2.5 sm:p-5 space-y-2.5 sm:space-y-4">
                    {hasCompactRow && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-3">
                            {hasStrategy && (
                                <InfoCard icon={Zap} label="Strategy" value={strategyLabel} gradient="from-sky-500 to-blue-500" onClick={() => openDetail("strategy")} />
                            )}
                            {hasDuration && (
                                <InfoCard icon={Clock} label="Duration" shortLabel="Dur." value={durationLabel} gradient="from-amber-500 to-orange-500" onClick={() => openDetail("duration")} />
                            )}
                            {hasFrequency && (
                                <InfoCard icon={BarChart3} label="Frequency" shortLabel="Freq." value={frequencyLabel} gradient="from-emerald-500 to-teal-500" onClick={() => openDetail("frequency")} />
                            )}
                            {hasMentor && (
                                <InfoCard icon={Award} label="Mentor" value={mentorLabel} gradient="from-violet-500 to-fuchsia-500" onClick={() => openDetail("mentor")} />
                            )}
                        </div>
                    )}

                    {(hasGoal || hasMonitoring) && (
                        <div className={`grid ${hasGoal && hasMonitoring ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-1.5 sm:gap-3`}>
                            {hasGoal && (
                                <button
                                    type="button"
                                    onClick={() => openDetail("goal")}
                                    className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/60 dark:border-slate-700/40 bg-white/85 dark:bg-slate-900/50 p-2.5 sm:p-4 shadow-sm text-left w-full cursor-pointer active:scale-[0.98] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                                >
                                    <div className="absolute inset-x-0 top-0 h-0.5 sm:h-1.5 bg-gradient-to-r from-rose-500 to-pink-500 opacity-90" />
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[10px] uppercase tracking-wider text-muted-foreground">
                                            <span className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md flex-shrink-0">
                                                <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                                            </span>
                                            Goal
                                        </div>
                                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground/50 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                    <p className="mt-1.5 sm:mt-3 text-[11px] sm:text-sm font-semibold text-foreground dark:text-white line-clamp-2 leading-snug sm:leading-relaxed">
                                        {goalLabel}
                                    </p>
                                </button>
                            )}

                            {hasMonitoring && (
                                <button
                                    type="button"
                                    onClick={() => openDetail("monitoring")}
                                    className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/70 dark:border-slate-700/40 bg-gradient-to-br ${monitoringTone.bg} dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-900/40 p-2.5 sm:p-5 text-left w-full cursor-pointer active:scale-[0.98] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg`}
                                >
                                    <div className={`absolute inset-x-0 top-0 h-1 sm:h-2.5 bg-gradient-to-r ${monitoringTone.bar}`} />
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <div className={`flex items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[10px] uppercase tracking-wider ${monitoringTone.text}`}>
                                                <span className={`w-6 h-6 sm:w-11 sm:h-11 rounded-lg sm:rounded-2xl bg-gradient-to-br ${monitoringTone.icon} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                                                    <ClipboardList className="w-3 h-3 sm:w-5 sm:h-5" />
                                                </span>
                                                <span className="sm:hidden">Monitor</span>
                                                <span className="hidden sm:inline">Monitoring Method</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground/50 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                    <p className="mt-1.5 sm:mt-4 text-[11px] sm:text-base font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug sm:leading-relaxed">
                                        {monitoringMethodLabel}
                                    </p>
                                </button>
                            )}
                        </div>
                    )}

                    <InterventionActivityLog
                        intervention={intervention}
                        emptyTitle="No intervention activity yet"
                        emptyMessage="Start, revision, and progress events will appear here as this intervention moves forward."
                    />

                    {(hasStartDate || hasNotes) && (
                        <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
                            {hasStartDate && (
                                <InfoCard icon={CalendarDays} label="Start Date" shortLabel="Start" value={startDateLabel} gradient="from-indigo-500 to-purple-500" onClick={() => openDetail("startDate")} />
                            )}
                            {hasNotes && (
                                <button
                                    type="button"
                                    onClick={() => setNotesSheetOpen(true)}
                                    className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/60 dark:border-slate-700/40 bg-white/85 dark:bg-slate-900/50 p-2 sm:p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg text-left w-full cursor-pointer active:scale-[0.98]"
                                >
                                    <div className="absolute inset-x-0 top-0 h-0.5 sm:h-1 bg-gradient-to-r from-amber-500 to-yellow-500 opacity-90" />
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-105 flex-shrink-0">
                                            <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[8px] sm:text-[10px] uppercase tracking-wider text-muted-foreground leading-tight">Notes</p>
                                            <p className="text-[11px] sm:text-sm font-semibold text-foreground dark:text-white leading-snug line-clamp-1">
                                                {notesLabel}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            <NotesBottomSheet
                open={notesSheetOpen}
                onOpenChange={setNotesSheetOpen}
                interventionLabel={intervention.label}
                notes={notesLabel}
            />

            {(() => {
                const detailConfigs = {
                    strategy:   { icon: Zap,          label: "Strategy",          gradient: "from-sky-500 to-blue-500",       value: strategyLabel },
                    duration:   { icon: Clock,         label: "Duration",           gradient: "from-amber-500 to-orange-500",   value: durationLabel },
                    frequency:  { icon: BarChart3,     label: "Frequency",          gradient: "from-emerald-500 to-teal-500",   value: frequencyLabel },
                    mentor:     { icon: Award,         label: "Mentor",             gradient: "from-violet-500 to-fuchsia-500", value: mentorLabel },
                    goal:       { icon: Target,        label: "Goal",               gradient: "from-rose-500 to-pink-500",      value: goalLabel },
                    monitoring: { icon: ClipboardList, label: "Monitoring Method",  gradient: monitoringTone.bar,               value: monitoringMethodLabel },
                    startDate:  { icon: CalendarDays,  label: "Start Date",         gradient: "from-indigo-500 to-purple-500",  value: startDateLabel },
                };
                const active = detailSheet ? detailConfigs[detailSheet] : null;
                return (
                    <InfoCardDetailSheet
                        open={Boolean(active)}
                        onOpenChange={(isOpen) => { if (!isOpen) closeDetail(); }}
                        icon={active?.icon}
                        label={active?.label}
                        gradient={active?.gradient}
                    >
                        {active?.value && (
                            <p className="text-sm sm:text-base font-medium text-foreground dark:text-white leading-relaxed">
                                {active.value}
                            </p>
                        )}
                    </InfoCardDetailSheet>
                );
            })()}
        </div>
    );
};

export default GrowthJourneyMain;
