import { memo, useRef, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { animate } from "animejs";
import {
    INTERVENTION_CONFIG,
    TIER_CONFIG,
    getTierBadgeStyle,
} from "../config/studentProfileConfig";

const TIER_STRIPE = {
    tier3: "from-rose-500   to-pink-500",
    tier2: "from-amber-400  to-orange-400",
    tier1: "from-emerald-400 to-teal-500",
};

const InterventionCard = memo(({ intervention, index, isSelected, onSelect }) => {
    const config       = INTERVENTION_CONFIG[intervention.type] || INTERVENTION_CONFIG.SEL;
    const tierCfg      = TIER_CONFIG[intervention.tier]          || TIER_CONFIG.tier1;
    const tierLabel    = intervention.tierLabel || tierCfg.label;
    const badgeStyle   = getTierBadgeStyle(intervention.tier);
    const stripe       = TIER_STRIPE[intervention.tier] || TIER_STRIPE.tier1;
    const cardRef      = useRef(null);
    const barRef       = useRef(null);
    const [visible, setVisible] = useState(false);

    /* anime.js — card entrance on mount (replaces AOS to avoid re-trigger bug) */
    useEffect(() => {
        const el = cardRef.current;
        if (!el) return;
        animate(el, {
            opacity:    [0, 1],
            translateY: [16, 0],
            duration:   420,
            delay:      60 + index * 50,
            ease:       "outExpo",
        });
        const t = setTimeout(() => setVisible(true), 80 + index * 50);
        return () => clearTimeout(t);
    }, [index]);

    /* anime.js — fill progress bar after mount */
    useEffect(() => {
        if (!barRef.current || !visible) return;
        const pct = intervention.progress || 0;
        animate(barRef.current, {
            width: ["0%", `${pct}%`],
            duration: 900,
            delay: 200,
            ease: "outExpo",
        });
    }, [intervention.progress, visible]);

    return (
        <div
            ref={cardRef}
            style={{ opacity: 0 }}
            onClick={() => intervention.hasRealData && onSelect?.(intervention)}
            className={[
                /* iOS Liquid Glass base */
                "group relative flex items-center gap-2.5 sm:gap-3",
                "rounded-2xl sm:rounded-[18px] overflow-hidden",
                "pl-2.5 pr-2.5 py-2 sm:pl-3 sm:pr-3 sm:py-3",
                "backdrop-blur-xl",
                "bg-white/70 dark:bg-white/[0.04]",
                "border border-white/60 dark:border-white/[0.08]",
                "shadow-[0_1px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.72)]",
                "dark:shadow-[0_1px_12px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)]",
                "transition-all duration-200",
                isSelected
                    ? `ring-2 ${config.ring} shadow-lg`
                    : intervention.hasRealData
                        ? "hover:bg-white/90 dark:hover:bg-white/[0.07] hover:shadow-md hover:-translate-y-0.5 cursor-pointer active:scale-[0.98]"
                        : "cursor-default",
            ].join(" ")}
        >
            {/* Tier accent stripe — left edge */}
            <div className={`absolute left-0 top-0 w-[3px] h-full bg-gradient-to-b ${stripe}`} />

            {/* Subject emoji icon */}
            <div className={`flex-shrink-0 w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-sm text-[13px] sm:text-[15px]`}>
                {config.emoji}
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
                {/* Row 1 — Subject name + Tier badge */}
                <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[11px] sm:text-xs font-bold text-foreground dark:text-white leading-tight truncate">
                        {intervention.label}
                    </span>
                    <span className={`flex-shrink-0 inline-flex items-center px-[7px] py-[2px] rounded-md text-[8px] font-black uppercase tracking-wide shadow-sm ${badgeStyle}`}>
                        {tierLabel}
                    </span>
                </div>

                {/* Row 2 — Focus area */}
                <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-snug truncate mb-1">
                    {intervention.focusArea || intervention.strategyName || "Core support"}
                </p>

                {/* Row 3 — Progress bar */}
                <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1 rounded-full bg-black/[0.06] dark:bg-white/10 overflow-hidden">
                        <div
                            ref={barRef}
                            style={{ width: "0%" }}
                            className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
                        />
                    </div>
                    <span className={`text-[9px] font-bold flex-shrink-0 w-6 text-right ${config.text}`}>
                        {intervention.progress || 0}%
                    </span>
                </div>
            </div>

            {/* Chevron — only when detail is available */}
            {intervention.hasRealData && (
                <ChevronRight className="flex-shrink-0 w-3.5 h-3.5 text-muted-foreground/35 group-hover:text-muted-foreground/65 group-hover:translate-x-0.5 transition-all duration-150" />
            )}
        </div>
    );
});

InterventionCard.displayName = "InterventionCard";
export default InterventionCard;
