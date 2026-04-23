import { memo } from "react";
import { ArrowRight, Sparkles, CalendarDays, User } from "lucide-react";

const TeacherHeroSection = ({ heroBadge, tabs, activeTab, onTabChange, pilotGuide = null }) => (
    <div className="relative rounded-2xl sm:rounded-[40px] p-[1.5px] bg-gradient-to-br from-[#f472b6]/60 via-[#818cf8]/50 to-[#34d399]/60 shadow-[0_16px_50px_rgba(99,102,241,0.15)] sm:shadow-[0_30px_80px_rgba(99,102,241,0.2)]">
        <div className="relative overflow-hidden rounded-[14px] sm:rounded-[38px] border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl">
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-20 -left-20 w-48 h-48 sm:w-80 sm:h-80 bg-gradient-to-br from-[#f472b6]/20 via-[#a78bfa]/15 to-transparent blur-[80px] sm:blur-[140px]" />
                <div className="absolute -bottom-16 -right-16 w-52 h-52 sm:w-96 sm:h-96 bg-gradient-to-tl from-[#22d3ee]/20 via-[#818cf8]/10 to-transparent blur-[80px] sm:blur-[160px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-60 sm:h-60 bg-[#fbbf24]/8 blur-[80px] sm:blur-[100px] rounded-full" />
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,255,0.7),_transparent_50%)]" />
            </div>

            <div className="relative px-3 py-4 sm:px-7 sm:py-8 lg:px-9 text-slate-900 dark:text-white">
                {/* Top badges row — compact on mobile */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2.5 sm:mb-5">
                    <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.3em] sm:tracking-[0.35em] text-white bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#818cf8] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-[0_4px_20px_rgba(168,85,247,0.35)]">
                        <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                        MTSS Studio
                    </span>
                    <span className="inline-flex px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/90 dark:bg-white/10 border border-white/60 dark:border-white/15 text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-slate-600 dark:text-slate-200 shadow-sm">
                        {heroBadge.school}
                    </span>
                    <span className="inline-flex px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 dark:from-emerald-500/20 dark:to-cyan-500/20 border border-emerald-300/40 dark:border-emerald-500/20 text-[9px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        {heroBadge.gradeLabel}
                    </span>
                </div>

                {/* Greeting — smaller on mobile */}
                <h1 className="text-lg sm:text-3xl lg:text-[2.5rem] font-black leading-[1.2] sm:leading-[1.15] bg-gradient-to-r from-[#1e1b4b] via-[#6366f1] to-[#ec4899] dark:from-[#e0e7ff] dark:via-[#c4b5fd] dark:to-[#f9a8d4] text-transparent bg-clip-text">
                    {heroBadge.greeting || `Hey ${heroBadge.teacher}, let's light up today's boosts.`}
                </h1>

                <div className="mt-3 sm:mt-5 space-y-4 sm:space-y-5">
                    <div className="space-y-2">
                        <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/55">
                            Today&apos;s context
                        </p>
                        {heroBadge.tierFocus && (
                            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-400/15 to-orange-400/15 dark:from-amber-500/15 dark:to-orange-500/15 border border-amber-300/40 dark:border-amber-500/20">
                                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                    <span className="relative inline-flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-amber-500" />
                                </span>
                                <span className="text-[10px] sm:text-sm font-semibold text-amber-700 dark:text-amber-300">
                                    Focus today: {heroBadge.tierFocus}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-white/50 dark:border-white/10 pt-4 sm:pt-5">
                        <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/55 mb-3">
                            Teacher snapshot
                        </p>
                        <div className="grid gap-2 sm:gap-3 md:grid-cols-2">
                            <div className="flex items-start gap-3 px-3 py-3 sm:px-4 rounded-xl sm:rounded-2xl border border-slate-200/70 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] min-w-0">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex-shrink-0">
                                    <User className="w-3.5 h-3.5" />
                                </span>
                                <div className="min-w-0">
                                    <span className="block text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/45">Teacher</span>
                                    <span className="block text-[12px] sm:text-base font-semibold text-slate-800 dark:text-white leading-tight truncate">{heroBadge.teacher}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 px-3 py-3 sm:px-4 rounded-xl sm:rounded-2xl border border-slate-200/70 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] min-w-0">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex-shrink-0">
                                    <CalendarDays className="w-3.5 h-3.5" />
                                </span>
                                <div className="min-w-0">
                                    <span className="block text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/45">Today</span>
                                    <span className="block text-[12px] sm:text-base font-semibold text-slate-800 dark:text-white leading-tight truncate">{heroBadge.dateLabel || "Daily snapshot"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab navigation — compact on mobile */}
                <div className="mt-4 sm:mt-7 border-t border-white/50 dark:border-white/10 pt-4 sm:pt-5">
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.24em] text-slate-500 dark:text-white/55 mb-3">
                        Quick actions
                    </p>
                    <div className={`grid gap-1.5 sm:gap-3 ${tabs.length > 3 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const active = activeTab === tab.key;
                            const disabled = Boolean(tab.disabled);
                            const hinted = pilotGuide?.teacherTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => !disabled && onTabChange(tab.key)}
                                    disabled={disabled}
                                    className={`relative group flex items-center justify-center sm:justify-between gap-1 sm:gap-2 rounded-xl sm:rounded-2xl px-2 py-2 sm:px-4 sm:py-3.5 text-[11px] sm:text-sm font-semibold transition-all duration-200 border ${
                                        active
                                            ? "bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#d946ef] text-white border-transparent shadow-[0_8px_24px_rgba(99,102,241,0.35)] sm:shadow-[0_12px_35px_rgba(99,102,241,0.4)] scale-[1.02]"
                                            : disabled
                                                ? "bg-slate-100/70 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200/70 dark:border-slate-700/60 cursor-not-allowed"
                                            : "bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-white border-white/70 dark:border-slate-600/60 hover:bg-white dark:hover:bg-slate-700/80 hover:border-indigo-200/50 dark:hover:border-indigo-400/40 hover:shadow-[0_8px_25px_rgba(99,102,241,0.12)] dark:hover:shadow-[0_8px_25px_rgba(99,102,241,0.2)]"
                                    }`}
                                    aria-pressed={active}
                                >
                                    <span className="flex items-center gap-1 sm:gap-2.5 min-w-0">
                                        <span
                                            className={`inline-flex h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-all ${
                                                active
                                                ? "bg-white/25 text-white"
                                            : disabled
                                                ? "bg-slate-200/70 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500"
                                            : "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 text-slate-500 dark:text-slate-200 group-hover:from-indigo-50 group-hover:to-purple-50 group-hover:text-indigo-500 dark:group-hover:from-indigo-800 dark:group-hover:to-purple-800 dark:group-hover:text-indigo-300"
                                            }`}
                                        >
                                            <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </span>
                                        <span className="sm:hidden text-[10px]">{tab.shortLabel || tab.label}</span>
                                        <span className="hidden sm:inline text-sm">{tab.label}</span>
                                    </span>
                                    {hinted && (
                                        <>
                                            <span className="pointer-events-none absolute inset-0 rounded-xl sm:rounded-2xl ring-2 ring-amber-400/90 ring-offset-2 ring-offset-white/70 dark:ring-amber-300 dark:ring-offset-slate-900/80 animate-pulse" />
                                            <span className="pointer-events-none absolute -top-2 right-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-lg">
                                                {active ? "You are here" : "Next click"}
                                            </span>
                                        </>
                                    )}
                                    <ArrowRight
                                        className={`hidden sm:block w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                                            active ? "translate-x-0.5" : disabled ? "opacity-0 -translate-x-1" : "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
                                        }`}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

TeacherHeroSection.displayName = "TeacherHeroSection";
export default memo(TeacherHeroSection);
