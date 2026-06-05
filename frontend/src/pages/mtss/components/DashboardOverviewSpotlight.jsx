import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import DashboardOverviewSpotlightDetails from "./DashboardOverviewSpotlightDetails";
import DashboardOverviewSpotlightChart from "./DashboardOverviewSpotlightChart";
import { expandStudentsBySupportUnit } from "../utils/supportUnitUtils";

const DashboardOverviewSpotlight = ({ students, progressData, TierPill }) => {
    const [spotlightIndex, setSpotlightIndex] = useState(0);
    const supportUnits = useMemo(() => expandStudentsBySupportUnit(students), [students]);

    useEffect(() => {
        setSpotlightIndex(0);
    }, [supportUnits.length]);

    const setNext = useCallback(() => {
        setSpotlightIndex((prev) => (supportUnits.length ? (prev + 1) % supportUnits.length : 0));
    }, [supportUnits.length]);

    const setPrev = useCallback(() => {
        setSpotlightIndex((prev) => {
            if (!supportUnits.length) return 0;
            return (prev - 1 + supportUnits.length) % supportUnits.length;
        });
    }, [supportUnits.length]);

    const { spotlightStudent, spotlightProfile, progressUnit, spotlightStatus, weekLabel, chartSeries, history, pairingLabel } = useMemo(() => {
        const student = supportUnits?.[spotlightIndex] ?? supportUnits?.[0] ?? null;
        const profile = student?.profile || {};
        const unit = profile.progressUnit || (student?.type === "Behavior" ? "pts" : student?.type === "Attendance" ? "%" : "wpm");
        const status = profile.target ? Math.round((profile.current / profile.target) * 100) : 0;
        const totalWeeks = parseInt(profile.duration, 10);
        const series = profile.chart?.length
            ? profile.chart
            : progressData?.length
                ? progressData
                : [{ label: "Start", date: "Start", reading: 0, goal: 100 }];
        const currentWeek = series.length;
        const label =
            totalWeeks && currentWeek
                ? `Week ${Math.min(currentWeek, totalWeeks)} of ${totalWeeks}`
                : profile.duration || "Weekly check-in";
        const historyList = profile.history || [];
        const pairingLabel = student?.supportUnit?.pairingLabel || student?.pairingLabel || profile?.pairingLabel || null;
        return {
            spotlightStudent: student,
            spotlightProfile: profile,
            progressUnit: unit,
            spotlightStatus: status,
            weekLabel: label,
            chartSeries: series,
            history: historyList,
            pairingLabel,
        };
    }, [supportUnits, progressData, spotlightIndex]);

    return (
        <section className="mtss-liquid mtss-card-surface mtss-rainbow-shell p-6 space-y-6 border border-primary/10">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-white/10 border border-white/50 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-600 dark:text-white/80">
                                Support Unit Spotlight
                        </span>
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-fuchsia-500/10 to-emerald-500/10 text-[11px] font-semibold text-slate-700 dark:text-white/80 border border-white/40">
                            {weekLabel}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-foreground dark:text-white">
                                {pairingLabel || (spotlightStudent?.supportUnit?.subject
                                    ? `${spotlightStudent?.name || "Featured Student"} - ${spotlightStudent.supportUnit.subject}`
                                    : spotlightStudent?.name || "Featured Student")}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                                Quickly scan subject-level ownership, trends, and recent notes for this support unit.
                            </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="px-3 py-1.5 rounded-full bg-sky-100/80 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200">
                            Grade {spotlightStudent?.grade ?? "-"}
                        </span>
                        {spotlightStudent?.tier ? (
                            <TierPill tier={spotlightStudent.tier} />
                        ) : (
                            <span className="px-3 py-1.5 rounded-full bg-slate-100/80 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                                Tier -
                            </span>
                        )}
                        <span className="px-3 py-1.5 rounded-full bg-violet-100/80 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
                            Focus: {spotlightProfile.type ?? "-"}
                        </span>
                        <span className="px-3 py-1.5 rounded-full bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                            Mentor: {spotlightProfile.mentor ?? "-"}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col gap-3 items-start lg:items-end">
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                        <button
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 dark:bg-white/10 border border-white/60 dark:border-white/20 shadow-sm hover:-translate-y-0.5 transition"
                            onClick={setPrev}
                            aria-label="Previous student"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <select
                            className="flex-1 min-w-0 sm:flex-none sm:min-w-[200px] sm:max-w-xs px-4 py-2 rounded-full bg-white/90 dark:bg-white/10 border border-white/60 dark:border-white/20 text-sm font-semibold text-foreground dark:text-white shadow-sm"
                            value={spotlightStudent?.id || ""}
                            onChange={(e) => {
                                const idx = supportUnits.findIndex((s) => (s.id || s._id) === e.target.value);
                                setSpotlightIndex(idx >= 0 ? idx : 0);
                            }}
                        >
                            {supportUnits.map((student) => (
                                <option key={student.id || student._id} value={student.id || student._id}>
                                    {student.supportUnit?.subject ? `${student.name} - ${student.supportUnit.subject}` : student.name}
                                </option>
                            ))}
                        </select>
                        <button
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 dark:bg-white/10 border border-white/60 dark:border-white/20 shadow-sm hover:-translate-y-0.5 transition"
                            onClick={setNext}
                            aria-label="Next student"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/75 dark:bg-white/10 border border-white/50 text-xs font-semibold text-foreground dark:text-white shadow-sm">
                            <Sparkles className="w-4 h-4 text-primary" />
                            {supportUnits.length} support units
                        </span>
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-400/20 via-emerald-400/10 to-cyan-400/15 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-500/30">
                            <Activity className="w-4 h-4" />
                            {spotlightStatus || 0}% to target
                        </span>
                    </div>
                </div>
            </header>

            <DashboardOverviewSpotlightDetails
                spotlightStudent={spotlightStudent}
                spotlightProfile={spotlightProfile}
                progressUnit={progressUnit}
                spotlightStatus={spotlightStatus}
                weekLabel={weekLabel}
                history={history}
                TierPill={TierPill}
            />

            <DashboardOverviewSpotlightChart chartSeries={chartSeries} progressUnit={progressUnit} />
        </section>
    );
};

export default DashboardOverviewSpotlight;
