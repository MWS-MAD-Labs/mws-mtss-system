import React, { memo, useEffect, useRef, useState, useCallback } from "react";

const CARD_STYLES = [
    {
        gradient: "from-[#6366f1] via-[#818cf8] to-[#a78bfa]",
        iconBg: "bg-white/20",
        glow: "shadow-[0_16px_40px_rgba(99,102,241,0.3)]",
        darkGlow: "dark:shadow-[0_16px_40px_rgba(99,102,241,0.2)]",
    },
    {
        gradient: "from-[#f59e0b] via-[#f97316] to-[#ef4444]",
        iconBg: "bg-white/20",
        glow: "shadow-[0_16px_40px_rgba(249,115,22,0.3)]",
        darkGlow: "dark:shadow-[0_16px_40px_rgba(249,115,22,0.2)]",
    },
    {
        gradient: "from-[#10b981] via-[#14b8a6] to-[#06b6d4]",
        iconBg: "bg-white/20",
        glow: "shadow-[0_16px_40px_rgba(20,184,166,0.3)]",
        darkGlow: "dark:shadow-[0_16px_40px_rgba(20,184,166,0.2)]",
    },
];

const DURATION = 1200;
const EASE_OUT_QUART = (t) => 1 - Math.pow(1 - t, 4);

/** Parse "7%" → { num: 7, suffix: "%" } or 14 → { num: 14, suffix: "" } */
const parseValue = (val) => {
    const str = String(val);
    const match = str.match(/^(\d+)(.*)$/);
    if (!match) return { num: 0, suffix: str };
    return { num: parseInt(match[1], 10), suffix: match[2] || "" };
};

const AnimatedNumber = memo(({ value }) => {
    const { num: target, suffix } = parseValue(value);
    const [display, setDisplay] = useState(0);
    const rafRef = useRef(null);
    const startRef = useRef(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (hasAnimated.current) {
            setDisplay(target);
            return;
        }
        hasAnimated.current = true;
        if (target === 0) { setDisplay(0); return; }

        const animate = (ts) => {
            if (!startRef.current) startRef.current = ts;
            const elapsed = ts - startRef.current;
            const progress = Math.min(elapsed / DURATION, 1);
            const eased = EASE_OUT_QUART(progress);
            setDisplay(Math.round(eased * target));
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };
        rafRef.current = requestAnimationFrame(animate);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [target]);

    return <>{display}{suffix}</>;
});
AnimatedNumber.displayName = "AnimatedNumber";

const TeacherStatCards = ({ statCards }) => (
    <section className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
        {statCards.map((card, index) => {
            const style = CARD_STYLES[index % CARD_STYLES.length];
            const Icon = card.icon;
            return (
                <div
                    key={card.label}
                    className={`group relative overflow-hidden rounded-xl sm:rounded-3xl bg-gradient-to-br ${style.gradient} p-2.5 sm:p-5 lg:p-6 ${style.glow} ${style.darkGlow} transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02]`}
                    data-aos="fade-up"
                    data-aos-delay={50 + index * 40}
                    data-aos-duration="500"
                >
                    {/* Background decorations */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-8 -right-8 w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-white/10 blur-xl" />
                        <div className="absolute -bottom-6 -left-6 w-16 h-16 sm:w-28 sm:h-28 rounded-full bg-white/5 blur-lg" />
                    </div>
                    {/* Shimmer sweep */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
                            backgroundSize: "200% 100%",
                            animation: "mtssShimmer 1.5s ease-in-out",
                        }}
                    />
                    <div className="relative flex items-start justify-between gap-1 sm:gap-2">
                        <div className="min-w-0 flex-1">
                            {/* Label */}
                            <p
                                className="text-[8px] sm:text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.35em] text-white/80 truncate animate-[mtssSlideUp_0.5s_ease-out_both]"
                                style={{ animationDelay: `${index * 100 + 200}ms` }}
                            >
                                <span className="sm:hidden">{card.shortLabel || card.label}</span>
                                <span className="hidden sm:inline">{card.label}</span>
                            </p>
                            {/* Animated number */}
                            <p
                                className="text-xl sm:text-3xl lg:text-4xl font-black text-white mt-0.5 sm:mt-2 drop-shadow-sm animate-[mtssSlideUp_0.6s_ease-out_both]"
                                style={{ animationDelay: `${index * 100 + 350}ms` }}
                            >
                                <AnimatedNumber value={card.value} />
                            </p>
                            {/* Subtitle */}
                            <p
                                className="hidden sm:block text-xs lg:text-sm text-white/75 mt-0.5 lg:mt-1 animate-[mtssSlideUp_0.5s_ease-out_both]"
                                style={{ animationDelay: `${index * 100 + 500}ms` }}
                            >
                                {card.sub}
                            </p>
                        </div>
                        {/* Animated icon */}
                        <span
                            className={`${style.iconBg} flex-shrink-0 w-7 h-7 sm:w-11 sm:h-11 lg:w-[3.25rem] lg:h-[3.25rem] rounded-lg sm:rounded-2xl inline-flex items-center justify-center text-white animate-[mtssIconPop_0.6s_ease-out_both] group-hover:animate-[mtssIconWiggle_0.5s_ease-in-out]`}
                            style={{ animationDelay: `${index * 100 + 400}ms` }}
                        >
                            <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                        </span>
                    </div>
                </div>
            );
        })}
    </section>
);

export default memo(TeacherStatCards);
