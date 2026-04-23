import { memo, useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import { animate, stagger } from "animejs";

/* ── Tier visual config ─────────────────────────────────────── */
const CHIP = {
    tier3: {
        bg: "bg-rose-50/90 dark:bg-rose-950/35",
        border: "border-rose-200/70 dark:border-rose-700/35",
        text: "text-rose-800 dark:text-rose-200",
        badge: "bg-gradient-to-r from-rose-500 to-pink-500",
        pulse: true,
    },
    tier2: {
        bg: "bg-amber-50/90 dark:bg-amber-950/35",
        border: "border-amber-200/70 dark:border-amber-700/35",
        text: "text-amber-800 dark:text-amber-200",
        badge: "bg-gradient-to-r from-amber-500 to-orange-500",
        pulse: false,
    },
    tier1: {
        bg: "bg-emerald-50/90 dark:bg-emerald-950/35",
        border: "border-emerald-200/70 dark:border-emerald-700/35",
        text: "text-emerald-800 dark:text-emerald-200",
        badge: "bg-gradient-to-r from-emerald-500 to-teal-500",
        pulse: false,
    },
};

const ICONS = {
    SEL: "\uD83D\uDC96",
    ENGLISH: "\uD83D\uDCDA",
    MATH: "\uD83D\uDD22",
    BEHAVIOR: "\u2B50",
    ATTENDANCE: "\uD83D\uDCDD",
    INDONESIAN: "\uD83C\uDDEE\uD83C\uDDE9",
};
const UNIVERSAL_ICON = "\uD83C\uDF1F";
const PRIORITY = { tier3: 3, tier2: 2, tier1: 1 };
const MAX_INLINE = 2;

/* ── Accent bar helpers (exported for row components) ──────── */
const TIER_ACCENT = {
    tier3: "from-rose-500 to-pink-500",
    tier2: "from-amber-500 to-orange-500",
};
const FALLBACK_ACCENT = [
    "from-indigo-500 to-purple-500",
    "from-cyan-500 to-blue-500",
    "from-emerald-500 to-teal-500",
    "from-sky-500 to-indigo-500",
    "from-violet-500 to-purple-500",
];

export const getMaxTierCode = (interventions = []) => {
    const active = interventions.filter(
        (e) => e.hasData || e.tierCode === "tier2" || e.tierCode === "tier3",
    );
    if (!active.length) return "tier1";
    if (active.some((e) => e.tierCode === "tier3")) return "tier3";
    if (active.some((e) => e.tierCode === "tier2")) return "tier2";
    return "tier1";
};

export const getAccentColor = (interventions = [], index = 0) => {
    const max = getMaxTierCode(interventions);
    return TIER_ACCENT[max] || FALLBACK_ACCENT[index % FALLBACK_ACCENT.length];
};

export const getActiveList = (interventions = []) =>
    interventions.filter(
        (e) => e.tierCode === "tier2" || e.tierCode === "tier3",
    );

/* ── Reduced-motion check ───────────────────────────────────── */
const prefersReducedMotion = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Chip renderer (shared between inline & dropdown) ──────── */
const Chip = ({ iv, compact, attrs = {} }) => {
    const s = CHIP[iv.tierCode] || CHIP.tier1;
    const icon = ICONS[iv.type] || "\uD83D\uDCCB";
    const tierNum = iv.tierCode?.replace("tier", "") || "1";

    return (
        <span
            {...attrs}
            className={`inline-flex items-center gap-0.5 ${compact ? "px-1.5 py-[2px]" : "px-2 py-[3px]"} rounded-full border flex-shrink-0 ${s.bg} ${s.border} hover:shadow-sm transition-all duration-200 cursor-default`}
            title={`${iv.label} — ${iv.tier}${iv.strategies?.[0] ? ` · ${iv.strategies[0]}` : ""}`}
        >
            <span className="text-[10px] leading-none">{icon}</span>
            <span className={`font-semibold ${s.text} text-[9px] whitespace-nowrap`}>
                {iv.label}
            </span>
            <span className={`w-4 h-4 text-[8px] inline-flex items-center justify-center rounded-full font-bold text-white shadow-sm ${s.badge} ${s.pulse ? "animate-pulse" : ""}`}>
                {tierNum}
            </span>
        </span>
    );
};

/* ── Chevron SVG ──────────────────────────────────────────── */
const Chevron = ({ up = false, className = "" }) => (
    <svg className={className} viewBox="0 0 16 16" fill="none">
        <path
            d={up ? "M4.5 10L8 6.5 11.5 10" : "M4.5 6L8 9.5 11.5 6"}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

/* ════════════════════════════════════════════════════════════════
   Main Component
   Collapsed: single row with max 2 chips + "+N" pill
   Expanded:  structured dropdown panel below the row
   ════════════════════════════════════════════════════════════════ */
const InterventionChips = memo(({ interventions = [], compact = false }) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const mountAnimated = useRef(false);
    const busy = useRef(false);

    /* ── anime.js mount entrance ──────────────────────────── */
    useEffect(() => {
        if (mountAnimated.current || !containerRef.current || prefersReducedMotion()) return;
        mountAnimated.current = true;
        const chips = containerRef.current.querySelectorAll("[data-chip]");
        if (!chips.length) return;
        animate(chips, {
            opacity: [0, 1],
            translateY: [6, 0],
            scale: [0.9, 1],
            delay: stagger(45, { start: 20 }),
            duration: 350,
            ease: "out(3)",
        });
    }, []);

    /* ── GSAP dropdown open ───────────────────────────────── */
    useEffect(() => {
        if (!open || !dropdownRef.current || prefersReducedMotion()) {
            if (open) busy.current = false;
            return;
        }
        const el = dropdownRef.current;
        const chips = el.querySelectorAll("[data-drop-chip]");

        const tl = gsap.timeline({ onComplete: () => { busy.current = false; } });
        tl.fromTo(el,
            { height: 0, opacity: 0 },
            { height: "auto", opacity: 1, duration: 0.25, ease: "power2.out" },
        );
        if (chips.length) {
            tl.fromTo(chips,
                { opacity: 0, y: 6, scale: 0.9 },
                { opacity: 1, y: 0, scale: 1, duration: 0.25, stagger: 0.04, ease: "back.out(1.8)" },
                "-=0.12",
            );
        }
    }, [open]);

    /* ── GSAP dropdown close ──────────────────────────────── */
    const handleClose = useCallback(() => {
        if (busy.current || !dropdownRef.current) return;
        if (prefersReducedMotion()) { setOpen(false); return; }
        busy.current = true;
        const el = dropdownRef.current;

        gsap.to(el, {
            height: 0, opacity: 0,
            duration: 0.2, ease: "power2.in",
            onComplete: () => { setOpen(false); busy.current = false; },
        });
    }, []);

    const handleToggle = useCallback((e) => {
        e.stopPropagation();
        if (busy.current) return;
        if (open) { handleClose(); } else { busy.current = true; setOpen(true); }
    }, [open, handleClose]);

    const active = getActiveList(interventions);

    /* ── No T2/T3 → Universal pill ────────────────────────── */
    if (!active.length) {
        const s = CHIP.tier1;
        return (
            <div ref={containerRef} className="flex items-center">
                <span
                    data-chip
                    className={`inline-flex items-center gap-1 ${compact ? "px-1.5 py-[2px]" : "px-2 py-[3px]"} rounded-full border ${s.bg} ${s.border} transition-all duration-200`}
                >
                    <span className="text-[10px] leading-none">{UNIVERSAL_ICON}</span>
                    <span className={`font-semibold ${s.text} text-[9px] whitespace-nowrap`}>Universal</span>
                </span>
            </div>
        );
    }

    /* ── Sort by tier priority ─────────────────────────────── */
    const sorted = [...active].sort(
        (a, b) => (PRIORITY[b.tierCode] || 0) - (PRIORITY[a.tierCode] || 0),
    );

    const visible = sorted.slice(0, MAX_INLINE);
    const overflow = sorted.slice(MAX_INLINE);
    const hasOverflow = overflow.length > 0;

    return (
        <div ref={containerRef} className="relative">
            {/* ── Row: always single line, never wraps ─────────── */}
            <div className={`flex items-center ${compact ? "gap-1" : "gap-1.5"} flex-nowrap`}>
                {visible.map((iv) => (
                    <Chip key={iv.type} iv={iv} compact={compact} attrs={{ "data-chip": "" }} />
                ))}

                {hasOverflow && (
                    <button
                        type="button"
                        onClick={handleToggle}
                        className={`
                            inline-flex items-center gap-0.5 flex-shrink-0
                            ${compact ? "px-1.5 py-[2px] text-[8px]" : "px-2 py-[3px] text-[9px]"}
                            rounded-full border font-semibold
                            bg-slate-100/80 dark:bg-slate-800/40
                            border-slate-200/60 dark:border-slate-700/40
                            text-slate-500 dark:text-slate-400
                            hover:bg-slate-200/90 dark:hover:bg-slate-700/50
                            active:scale-95 transition-all duration-200 cursor-pointer
                        `}
                    >
                        +{overflow.length}
                        <Chevron up={open} className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* ── Dropdown panel: structured grid below ────────── */}
            {open && hasOverflow && (
                <div
                    ref={dropdownRef}
                    className={`overflow-hidden mt-1.5 ${compact ? "gap-1" : "gap-1.5"}`}
                    style={{ height: 0, opacity: 0 }}
                >
                    <div className={`flex flex-wrap items-center ${compact ? "gap-1" : "gap-1.5"}`}>
                        {overflow.map((iv) => (
                            <Chip key={iv.type} iv={iv} compact={compact} attrs={{ "data-drop-chip": "" }} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});

InterventionChips.displayName = "InterventionChips";
export default InterventionChips;
