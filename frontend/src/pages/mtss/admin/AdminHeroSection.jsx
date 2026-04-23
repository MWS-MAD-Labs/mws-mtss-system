import { memo } from "react";

const AdminHeroSection = ({ heroCard, tabs, activeTab, onTabChange, pilotGuide = null }) => {
    const BadgeIcon = heroCard.badgeIcon;

    return (
        <div className="space-y-4" data-aos="fade-up">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-gradient-to-r from-white/90 via-white/70 to-white/50 dark:from-white/10 dark:via-white/5 dark:to-white/5 backdrop-blur-xl shadow-lg border border-white/60 dark:border-white/10">
                <BadgeIcon className="w-5 h-5 text-rose-500" />
                <div>
                    <p className="text-[0.6rem] uppercase tracking-[0.5em] text-muted-foreground">{heroCard.badgeLabel}</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-white">{heroCard.badgeCaption}</p>
                </div>
            </div>
            <div data-aos="fade-up" data-aos-delay="100">
                <h1
                    className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-[#ef4444] via-[#f472b6] to-[#2563eb] dark:from-[#fbbf24] dark:via-[#22d3ee] dark:to-[#a78bfa] bg-clip-text text-transparent drop-shadow-[0_8px_20px_rgba(15,23,42,0.35)]"
                    style={{ WebkitTextStroke: "0.6px rgba(15,23,42,0.35)" }}
                >
                    {heroCard.heading}
                </h1>
            </div>
            <div className="flex flex-wrap gap-3 pt-2" data-aos="zoom-in" data-aos-delay="150">
                {tabs.map((tab) => {
                    const TabIcon = tab.icon;
                    const active = activeTab === tab.key;
                    const hinted = pilotGuide?.adminTab === tab.key;
                    const baseClass =
                        "px-5 py-3 rounded-full border backdrop-blur-xl font-semibold text-sm flex items-center gap-2 transition shadow-lg relative overflow-hidden group";
                    const activeClass =
                        "bg-gradient-to-r from-[#ffe29f] via-[#ffa99f] to-[#ff719a] text-[#5b0f45] border-white/70 shadow-[0_10px_30px_rgba(255,113,154,0.35)]";
                    const inactiveClass =
                        "bg-gradient-to-r from-white/85 via-white/70 to-white/55 border-white/70 text-slate-600 dark:from-white/10 dark:via-white/5 dark:to-white/5 dark:text-white/80 hover:border-white/90";
                    return (
                        <button
                            key={tab.key}
                            onClick={() => onTabChange(tab.key)}
                            className={`${baseClass} ${active ? activeClass : inactiveClass}`}
                        >
                            <span
                                aria-hidden="true"
                                className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition pointer-events-none ${
                                    active ? "bg-white/10" : "bg-white/30 dark:bg-white/10"
                                }`}
                            />
                            <TabIcon className="w-4 h-4" />
                            <span className="relative">{tab.label}</span>
                            {hinted && (
                                <>
                                    <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-amber-400/90 ring-offset-2 ring-offset-white/80 dark:ring-amber-300 dark:ring-offset-slate-900/80 animate-pulse" />
                                    <span className="pointer-events-none absolute -top-1 right-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-lg">
                                        {active ? "You are here" : "Start here"}
                                    </span>
                                </>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

AdminHeroSection.displayName = "AdminHeroSection";
export default memo(AdminHeroSection);
