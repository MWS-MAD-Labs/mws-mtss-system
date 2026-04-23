import React, { memo } from "react";
import { motion } from "framer-motion";

const DecorativeBlobs = memo(() => (
    <>
        <motion.div
            className="absolute -top-32 -left-32 w-80 h-80 md:w-96 md:h-96 bg-primary/5 dark:bg-primary/3 rounded-full blur-3xl pointer-events-none"
            animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                repeatType: "loop"
            }}
        />
        <motion.div
            className="absolute -bottom-32 -right-32 w-72 h-72 md:w-80 md:h-80 bg-accent/6 dark:bg-accent/4 rounded-full blur-3xl pointer-events-none"
            animate={{
                scale: [1, 1.15, 1],
                opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
                repeatType: "loop"
            }}
        />
        <motion.div
            className="absolute top-1/3 right-1/4 w-64 h-64 md:w-72 md:h-72 bg-gold/5 dark:bg-gold/3 rounded-full blur-3xl pointer-events-none"
            animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
                repeatType: "loop"
            }}
        />
    </>
));

const GridPattern = memo(() => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.015] dark:opacity-[0.025]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="luxury-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#luxury-grid-pattern)" className="text-foreground" />
        </svg>
    </div>
));

DecorativeBlobs.displayName = 'DecorativeBlobs';
GridPattern.displayName = 'GridPattern';

export { DecorativeBlobs, GridPattern };