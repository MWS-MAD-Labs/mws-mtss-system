// PageLoader.jsx
import React, { memo } from "react";
import { motion } from "framer-motion";
import usePreferLowMotion from "@/hooks/usePreferLowMotion";

const PageLoader = memo(() => {
    const lowMotion = usePreferLowMotion();
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
            {/* Background grid with liquid glass mask */}
            <div className="absolute inset-0 bg-grid-small [mask-image:radial-gradient(circle_at_center,white,transparent)] opacity-25 pointer-events-none" />

            {/* Glassmorphic loader container */}
            <motion.div
                initial={lowMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9, y: 15 }}
                animate={lowMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                exit={lowMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 15 }}
                transition={{ duration: lowMotion ? 0.12 : 0.35, ease: "easeOut" }}
                className="
          relative flex flex-col items-center gap-4 sm:gap-5
          rounded-2xl sm:rounded-3xl
          bg-card/40 px-6 py-7 sm:px-8 sm:py-10
          shadow-xl backdrop-blur-2xl
          border border-border/50
        "
            >
                {/* Enhanced CSS-based loader spinner - guaranteed to animate */}
                <div className="relative w-12 h-12 sm:w-16 sm:h-16">
                    {/* Outer spinning ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
                         style={{ animationDuration: '1s' }} />

                    {/* Inner counter-rotating ring */}
                    <div className="absolute inset-2 rounded-full border-4 border-primary/30 border-b-primary animate-spin-reverse"
                         style={{ animationDuration: '1.5s' }} />

                    {/* Center pulse */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 bg-primary rounded-full animate-pulse"
                             style={{ animationDuration: '2s' }} />
                    </div>
                </div>

                {/* Loading text with CSS pulse animation */}
                <p className="text-sm sm:text-base font-medium text-foreground tracking-wide animate-pulse"
                   style={{ animationDuration: '2s' }}>
                    Loading...
                </p>

                {/* Animated loading dots */}
                <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: '0s', animationDuration: '1.4s' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s', animationDuration: '1.4s' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: '0.4s', animationDuration: '1.4s' }} />
                </div>

                {/* Glowing accent ring with CSS animation */}
                <div className="absolute -inset-3 sm:-inset-4 rounded-3xl border-2 border-accent/40 blur-xl animate-glow-pulse" />
            </motion.div>

            {/* CSS animations for guaranteed performance */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes spin-reverse {
                        from { transform: rotate(360deg); }
                        to { transform: rotate(0deg); }
                    }
                    @keyframes glow-pulse {
                        0%, 100% {
                            opacity: 0.4;
                            transform: scale(0.95);
                        }
                        50% {
                            opacity: 0.75;
                            transform: scale(1.05);
                        }
                    }
                    .animate-spin-reverse {
                        animation: spin-reverse 1.5s linear infinite;
                    }
                    .animate-glow-pulse {
                        animation: glow-pulse 3s ease-in-out infinite;
                    }
                `
            }} />
        </div>
    );
});

PageLoader.displayName = 'PageLoader';

export default PageLoader;
