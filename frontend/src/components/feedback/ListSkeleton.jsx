import React from "react";

/**
 * ListSkeleton
 * - Unified compact skeleton for list placeholders
 *
 * Props:
 * - rows?: number (default 3)
 * - className?: string
 */
export default function ListSkeleton({ rows = 3, className = "" }) {
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="h-16 rounded-2xl border border-border/30 bg-card/30 backdrop-blur animate-pulse"
                />
            ))}
        </div>
    );
}