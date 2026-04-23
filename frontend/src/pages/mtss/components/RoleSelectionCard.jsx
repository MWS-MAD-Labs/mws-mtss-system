import { memo } from "react";
import { motion } from "framer-motion";

const RoleSelectionCard = memo(({ role, onClick, delay = 0 }) => (
    <motion.button
        key={role.key}
        className="group relative p-[1px] rounded-[38px] transition-transform duration-300 hover:-translate-y-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 mtss-card-pop"
        onClick={() => onClick(role.key)}
        whileTap={{ scale: 0.98 }}
        data-aos="zoom-in-up"
        data-aos-delay={delay}
    >
        <div
            className="relative rounded-[38px] p-7 md:p-8 min-h-[240px] flex flex-col mtss-liquid"
            style={{ background: role.gradient, color: role.textColor || "var(--mtss-text-ink)" }}
        >
            <div className="absolute inset-0 bg-white/35 dark:bg-black/25 rounded-[38px] pointer-events-none" />
            <span className="mtss-liquid-hover-blob" />
            <div className="relative z-10 flex flex-col gap-5 h-full">
                <div className="flex items-start justify-between gap-3">
                    <div className="w-14 h-14 rounded-[30px] bg-white/40 dark:bg-white/10 flex items-center justify-center shadow-inner text-foreground dark:text-white">
                        <role.icon className="w-7 h-7" />
                    </div>
                    <span
                        className="px-3 py-1 rounded-full text-[0.65rem] font-black uppercase tracking-[0.4em]"
                        style={{ color: role.textColor || "var(--mtss-text-ink)", background: "var(--mtss-chip-gradient)" }}
                    >
                        {role.badge}
                    </span>
                </div>
                <div className="space-y-2 text-left">
                    <h3 className="text-2xl font-black leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                        <span
                            className="mtss-gradient-text"
                            style={{ backgroundImage: role.titleGradient, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" }}
                        >
                            {role.title}
                        </span>
                    </h3>
                    <p
                        className="text-base md:text-[1rem] leading-relaxed"
                        style={{ color: role.textColor || "var(--mtss-text-ink-soft)" }}
                    >
                        {role.description}
                    </p>
                </div>
                <div className="mt-auto">
                    <span
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full border text-sm font-semibold shadow-[0_18px_30px_rgba(15,23,42,0.15)]"
                        style={{
                            backgroundImage: role.buttonGradient,
                            borderColor: "rgba(255,255,255,0.6)",
                            color: role.textColor || "var(--mtss-text-ink)",
                        }}
                    >
                        Explore
                        <motion.span className="font-black" animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.4 }}>
                            {"\u2192"}
                        </motion.span>
                    </span>
                </div>
            </div>
        </div>
        <div className="absolute inset-0 rounded-[38px] border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.button>
));

RoleSelectionCard.displayName = "RoleSelectionCard";
export default RoleSelectionCard;
