// AnimatedSlidePage.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import usePreferLowMotion from "@/hooks/usePreferLowMotion";

const slideVariants = {
    initial: {
        x: "100%",
        opacity: 0,
        scale: 0.98,
    },
    in: {
        x: 0,
        opacity: 1,
        scale: 1,
    },
    out: {
        x: "100%",
        opacity: 0,
        scale: 0.98,
    },
};

const slideTransition = {
    type: "spring",
    stiffness: 260,
    damping: 25,
};

export default function AnimatedSlidePage({ children, onSwipeBack }) {
    const lowMotion = usePreferLowMotion();
    const [showHint, setShowHint] = useState(true);

    // Auto-hide hint setelah 3 detik
    useEffect(() => {
        const timer = setTimeout(() => setShowHint(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div
            className="relative h-full w-full"
            initial="initial"
            animate="in"
            exit="out"
            variants={lowMotion ? { initial: { opacity: 0 }, in: { opacity: 1 }, out: { opacity: 0 } } : slideVariants}
            transition={lowMotion ? { duration: 0.15, ease: 'easeOut' } : slideTransition}
            drag={lowMotion ? false : "x"}
            dragConstraints={lowMotion ? undefined : { left: 0, right: 0 }}
            dragElastic={lowMotion ? 0 : 0.2}
            onDragEnd={(e, info) => {
                if (info?.offset?.x > 100) {
                    onSwipeBack?.(); // trigger callback kalau swipe kanan cukup jauh
                }
            }}
        >
            {children}

            {/* Hint swipe */}
            {showHint && !lowMotion && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full border border-border/50 bg-card/90 px-3 py-1 text-xs font-medium text-foreground shadow-glass-sm backdrop-blur"
                >
                    ?? Swipe kanan untuk kembali
                </motion.div>
            )}
        </motion.div>
    );
}

