import React, { memo } from "react";
import { motion } from "framer-motion";
import usePreferLowMotion from "@/hooks/usePreferLowMotion";

const BackgroundDecor = memo(() => {
    const prefersReducedMotion = usePreferLowMotion();

    return (
        <div className="absolute inset-0 overflow-hidden">
            {/* Subtle grid */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(to right, hsl(var(--foreground)/0.045) 0 1px, transparent 1px 56px), repeating-linear-gradient(to bottom, hsl(var(--foreground)/0.045) 0 1px, transparent 1px 56px)',
                }}
            />

            {/* Radial accents */}
            <motion.div
                aria-hidden
                className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-[hsl(var(--accent))]/25 blur-3xl z-0"
                initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
                animate={prefersReducedMotion ? {} : { opacity: 0.55, y: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: 'easeOut' }}
            />
            <motion.div
                aria-hidden
                className="absolute bottom-[-4rem] right-[-3rem] h-96 w-96 rounded-full bg-[hsl(var(--ring))]/25 blur-3xl z-0"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={prefersReducedMotion ? {} : { opacity: 0.5, y: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.28, delay: prefersReducedMotion ? 0 : 0.05, ease: 'easeOut' }}
            />
        </div>
    );
});

BackgroundDecor.displayName = 'BackgroundDecor';
export default BackgroundDecor;
