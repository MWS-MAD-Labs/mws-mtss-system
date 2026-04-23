import { memo, useRef, useEffect, useMemo, useState } from "react";
import { Activity, Star } from "lucide-react";
import { animate, stagger } from "animejs";
import gsap from "gsap";
import InterventionCard from "./InterventionCard";

/* ── Tier filter config ────────────────────────────────── */
const FILTERS = [
    {
        key: null,
        label: "All",
        active: "bg-slate-800/80 dark:bg-white/15 text-white shadow-sm",
        inactive: "bg-white/60 dark:bg-white/[0.04] text-muted-foreground border border-black/[0.06] dark:border-white/10",
    },
    {
        key: "tier3",
        label: "Tier 3",
        dot: "bg-rose-500",
        active: "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-400/40 shadow-sm",
        inactive: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-700/30",
    },
    {
        key: "tier2",
        label: "Tier 2",
        dot: "bg-amber-500",
        active: "bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-amber-400/40 shadow-sm",
        inactive: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-700/30",
    },
    {
        key: "tier1",
        label: "Tier 1",
        dot: "bg-emerald-500",
        active: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-400/40 shadow-sm",
        inactive: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-700/30",
    },
];

/* ── Component ─────────────────────────────────────────── */
const StudentInterventionsSection = memo(({
    sortedInterventions,
    selectedIntervention,
    onSelect,
    glassStyles,
}) => {
    const sectionRef = useRef(null);
    const chipsRef   = useRef([]);
    const barT3Ref   = useRef(null);
    const barT2Ref   = useRef(null);
    const barT1Ref   = useRef(null);

    const [activeFilter, setActiveFilter] = useState(null);

    /* Count per tier */
    const tierCounts = useMemo(() => {
        const c = { tier1: 0, tier2: 0, tier3: 0 };
        sortedInterventions.forEach(i => { c[i.tier] = (c[i.tier] || 0) + 1; });
        return c;
    }, [sortedInterventions]);

    const total = sortedInterventions.length;

    /* Filtered list — tier 3 first within each tier group */
    const displayed = useMemo(
        () => activeFilter
            ? sortedInterventions.filter(i => i.tier === activeFilter)
            : sortedInterventions,
        [sortedInterventions, activeFilter]
    );

    /* Visible filters (only tiers with at least 1 subject) */
    const visibleFilters = useMemo(
        () => FILTERS.filter(f => f.key === null || tierCounts[f.key] > 0),
        [tierCounts]
    );

    /* GSAP — section entrance */
    useEffect(() => {
        if (!sectionRef.current) return;
        gsap.fromTo(
            sectionRef.current,
            { opacity: 0, y: 28, scale: 0.99 },
            { opacity: 1, y: 0, scale: 1, duration: 0.62, ease: "power3.out", delay: 0.22 }
        );
    }, []);

    /* anime.js — filter chips stagger in */
    useEffect(() => {
        const chips = chipsRef.current.filter(Boolean);
        if (!chips.length) return;
        animate(chips, {
            opacity:    [0, 1],
            translateY: [6, 0],
            delay:      stagger(38, { start: 320 }),
            duration:   340,
            ease:       "outExpo",
        });
    }, []);

    /* anime.js — proportion bar segments fill */
    useEffect(() => {
        if (!total) return;
        const refs = [
            { ref: barT3Ref, key: "tier3" },
            { ref: barT2Ref, key: "tier2" },
            { ref: barT1Ref, key: "tier1" },
        ];
        refs.forEach(({ ref, key }) => {
            if (!ref.current || !tierCounts[key]) return;
            const pct = `${(tierCounts[key] / total) * 100}%`;
            animate(ref.current, {
                width: ["0%", pct],
                duration: 800,
                delay: 500,
                ease: "outExpo",
            });
        });
    }, [tierCounts, total]);

    return (
        <section
            ref={sectionRef}
            className={`${glassStyles.inner} rounded-2xl sm:rounded-3xl p-3 sm:p-6`}
        >
            {/* ── Header ──────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                        <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xs sm:text-base font-black text-foreground dark:text-white leading-tight">
                            Interventions
                            {total > 0 && (
                                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground ml-1">
                                    · {total}
                                </span>
                            )}
                        </h3>
                    </div>
                </div>

                {/* Tier count pills — top-right summary */}
                {total > 0 && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {tierCounts.tier3 > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[8px] sm:text-[9px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                {tierCounts.tier3}
                            </span>
                        )}
                        {tierCounts.tier2 > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[8px] sm:text-[9px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                {tierCounts.tier2}
                            </span>
                        )}
                        {tierCounts.tier1 > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[8px] sm:text-[9px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {tierCounts.tier1}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {total > 0 && (
                <>
                    {/* ── Tier proportion bar ──────────────────── */}
                    {total > 1 && (
                        <div className="flex rounded-full overflow-hidden h-[3px] mb-2.5 sm:mb-4 bg-black/[0.05] dark:bg-white/[0.06]">
                            {tierCounts.tier3 > 0 && (
                                <div
                                    ref={barT3Ref}
                                    style={{ width: "0%" }}
                                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
                                />
                            )}
                            {tierCounts.tier2 > 0 && (
                                <div
                                    ref={barT2Ref}
                                    style={{ width: "0%" }}
                                    className="h-full bg-gradient-to-r from-amber-400 to-orange-400"
                                />
                            )}
                            {tierCounts.tier1 > 0 && (
                                <div
                                    ref={barT1Ref}
                                    style={{ width: "0%" }}
                                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
                                />
                            )}
                        </div>
                    )}

                    {/* ── Filter chips ─────────────────────────── */}
                    <div className="flex items-center gap-1 sm:gap-1.5 mb-2.5 sm:mb-4 overflow-x-auto pb-1 scrollbar-slim">
                        {visibleFilters.map((f, i) => (
                            <button
                                key={f.key ?? "all"}
                                ref={el => (chipsRef.current[i] = el)}
                                style={{ opacity: 0 }}
                                onClick={() => setActiveFilter(f.key)}
                                className={[
                                    "flex-shrink-0 inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full",
                                    "text-[9px] sm:text-[10px] font-bold transition-all duration-200",
                                    activeFilter === f.key ? f.active : f.inactive,
                                ].join(" ")}
                            >
                                {f.dot && (
                                    <span className={`w-1.5 h-1.5 rounded-full ${f.dot} flex-shrink-0`} />
                                )}
                                {f.label}
                                {f.key !== null && (
                                    <span className="opacity-70">{tierCounts[f.key]}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* ── Card grid ────────────────────────────────────── */}
            {displayed.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1.5 sm:gap-2.5">
                    {displayed.map((intervention, idx) => (
                        <InterventionCard
                            key={intervention.id || idx}
                            intervention={intervention}
                            index={idx}
                            isSelected={selectedIntervention?.id === intervention.id}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            ) : activeFilter ? (
                <div className="text-center py-8 text-muted-foreground text-xs font-medium">
                    No {activeFilter.replace("tier", "Tier ")} interventions
                </div>
            ) : (
                <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <Star className="w-10 h-10 mx-auto mb-2 text-amber-400" />
                    <p className="font-semibold text-sm">No active interventions</p>
                    <p className="text-xs mt-1 opacity-70">Universal supports are in place</p>
                </div>
            )}
        </section>
    );
});

StudentInterventionsSection.displayName = "StudentInterventionsSection";
export default StudentInterventionsSection;
