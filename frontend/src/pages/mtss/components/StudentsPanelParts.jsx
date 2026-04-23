import { Search, Filter, Layers, Shield, AlertTriangle, Flame } from "lucide-react";

const TIER_STYLES = [
    {
        key: "All",
        label: "All",
        icon: Layers,
        active: "bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#a78bfa] text-white shadow-[0_6px_20px_rgba(99,102,241,0.35)] dark:shadow-[0_6px_24px_rgba(99,102,241,0.5)]",
        idle: "bg-white/60 dark:bg-white/[0.08] border-indigo-200/60 dark:border-indigo-400/30 text-indigo-700 dark:text-indigo-200 hover:bg-white/80 dark:hover:bg-white/[0.14] hover:border-indigo-300 dark:hover:border-indigo-400/50",
    },
    {
        key: "Tier 1",
        label: "T1",
        icon: Shield,
        active: "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-[0_6px_20px_rgba(20,184,166,0.35)] dark:shadow-[0_6px_24px_rgba(20,184,166,0.5)]",
        idle: "bg-white/60 dark:bg-white/[0.08] border-emerald-200/60 dark:border-emerald-400/30 text-emerald-700 dark:text-emerald-200 hover:bg-white/80 dark:hover:bg-white/[0.14] hover:border-emerald-300 dark:hover:border-emerald-400/50",
    },
    {
        key: "Tier 2",
        label: "T2",
        icon: AlertTriangle,
        active: "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-400 text-white shadow-[0_6px_20px_rgba(249,115,22,0.35)] dark:shadow-[0_6px_24px_rgba(249,115,22,0.5)]",
        idle: "bg-white/60 dark:bg-white/[0.08] border-amber-200/60 dark:border-amber-400/30 text-amber-700 dark:text-amber-200 hover:bg-white/80 dark:hover:bg-white/[0.14] hover:border-amber-300 dark:hover:border-amber-400/50",
    },
    {
        key: "Tier 3",
        label: "T3",
        icon: Flame,
        active: "bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 text-white shadow-[0_6px_20px_rgba(244,63,94,0.35)] dark:shadow-[0_6px_24px_rgba(244,63,94,0.5)]",
        idle: "bg-white/60 dark:bg-white/[0.08] border-rose-200/60 dark:border-rose-400/30 text-rose-700 dark:text-rose-200 hover:bg-white/80 dark:hover:bg-white/[0.14] hover:border-rose-300 dark:hover:border-rose-400/50",
    },
];

export const tierFilters = TIER_STYLES.map((t) => t.key);
export const STUDENTS_PANEL_BATCH = 10;

export const FilterBar = ({ activeTier, setActiveTier, query, setQuery }) => (
    <div
        className="relative overflow-hidden rounded-2xl sm:rounded-[28px] border border-white/50 dark:border-white/[0.12] bg-white/70 dark:bg-white/[0.06] backdrop-blur-xl p-3 sm:p-5 flex flex-col gap-2.5 sm:gap-4 shadow-[0_8px_32px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]"
        data-aos="fade-up"
        data-aos-delay="40"
    >
        {/* Liquid glass highlight */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/70 dark:via-white/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent" />
        </div>
        {/* Header + filter pills on one row */}
        <div className="relative flex items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-slate-500 dark:text-slate-300 whitespace-nowrap">
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Quick filters</span>
            </span>
            <div className="flex flex-1 gap-1.5 sm:gap-2">
                {TIER_STYLES.map((tier) => {
                    const active = activeTier === tier.key;
                    const Icon = tier.icon;
                    return (
                        <button
                            key={tier.key}
                            onClick={() => setActiveTier(tier.key)}
                            className={`flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold uppercase tracking-wider border backdrop-blur-md transition-all duration-200 ${
                                active
                                    ? `${tier.active} border-transparent scale-[1.03]`
                                    : `${tier.idle} shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:scale-[1.02]`
                            }`}
                        >
                            <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                            <span className="sm:hidden">{tier.label}</span>
                            <span className="hidden sm:inline">{tier.key}</span>
                        </button>
                    );
                })}
            </div>
        </div>
        {/* Search */}
        <div className="relative">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400" />
            <input
                type="text"
                placeholder="Search kids or boost type..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm bg-white/50 dark:bg-white/[0.07] backdrop-blur-md border border-white/60 dark:border-white/[0.12] text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/40 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all"
            />
        </div>
    </div>
);

export const RosterHeader = ({ visible, total }) => (
    <div className="flex items-center justify-between gap-2 sm:gap-3" data-aos="fade-up" data-aos-delay="60">
        <div className="min-w-0">
            <p className="uppercase text-[9px] sm:text-xs text-muted-foreground tracking-[0.3em] sm:tracking-[0.4em]">Crew Roster</p>
            <h2 className="text-base sm:text-2xl font-bold text-slate-900 dark:text-white truncate">Kids on your radar today</h2>
        </div>
        <div className="text-[10px] sm:text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
            <strong>{visible}</strong>/{total}
        </div>
    </div>
);

export const LoadMore = ({ visible, total, onLoadMore }) => (
    <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground py-3" data-aos="fade-up" data-aos-delay="160">
        {visible < total ? (
            <button
                type="button"
                onClick={onLoadMore}
                className="px-4 py-2 rounded-full bg-white/80 dark:bg-white/10 border border-primary/30 text-sm font-semibold text-primary shadow-sm hover:-translate-y-0.5 transition"
            >
                Load 10 more kids ({visible}/{total})
            </button>
        ) : (
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-200 border border-emerald-200/70 dark:border-emerald-500/30">
                All kids loaded
            </span>
        )}
    </div>
);
