// DataLoader.jsx - Interactive loading component with guaranteed CSS animations
import React from "react";
import { motion } from "framer-motion";

const DataLoader = ({ message = "Loading...", fullScreen = false, className = "" }) => {
    const containerClasses = fullScreen
        ? "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        : `flex items-center justify-center py-12 ${className}`;

    return (
        <div className={containerClasses}>
            <div className="flex flex-col items-center gap-5">
                {/* Animated pulse rings */}
                <div className="relative flex items-center justify-center w-24 h-24">
                    {/* Outer pulsing ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"
                         style={{ animationDuration: '2s' }} />

                    {/* Middle rotating ring */}
                    <div className="absolute inset-2 rounded-full border-4 border-t-primary border-r-primary/40 border-b-primary/20 border-l-primary/40 animate-spin"
                         style={{ animationDuration: '1.5s' }} />

                    {/* Inner rotating dots */}
                    <div className="relative w-12 h-12">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full animate-bounce"
                             style={{ animationDelay: '0s', animationDuration: '1s' }} />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary/70 rounded-full animate-bounce"
                             style={{ animationDelay: '0.2s', animationDuration: '1s' }} />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary/50 rounded-full animate-bounce"
                             style={{ animationDelay: '0.4s', animationDuration: '1s' }} />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary/30 rounded-full animate-bounce"
                             style={{ animationDelay: '0.6s', animationDuration: '1s' }} />
                    </div>

                    {/* Center glow effect */}
                    <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse"
                         style={{ animationDuration: '2.5s' }} />
                </div>

                {/* Animated loading text */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-2"
                >
                    <p className="text-base font-medium text-foreground animate-pulse"
                       style={{ animationDuration: '2s' }}>
                        {message}
                    </p>

                    {/* Loading dots animation */}
                    <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce"
                              style={{ animationDelay: '0s', animationDuration: '1.4s' }} />
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce"
                              style={{ animationDelay: '0.2s', animationDuration: '1.4s' }} />
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce"
                              style={{ animationDelay: '0.4s', animationDuration: '1.4s' }} />
                    </div>
                </motion.div>

                {/* Progress bar */}
                <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 animate-loading-bar" />
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes loading-bar {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                    .animate-loading-bar {
                        animation: loading-bar 1.5s ease-in-out infinite;
                    }
                `
            }} />
        </div>
    );
};

export default DataLoader;
