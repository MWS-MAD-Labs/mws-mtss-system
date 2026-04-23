// src/components/Filters/ChipFilterBar.jsx
import React from "react";
import { cn } from "@/lib/utils";

/**
 * ChipFilterBar
 * - Compact segmented chip filter with liquid-glass styling
 * - Keyboard and screen-reader friendly
 *
 * Props:
 * - options: Array<{ key: string; label: string; icon?: React.ComponentType }>
 * - value: string (current key)
 * - onChange: (key: string) => void
 * - className?: string
 * - size?: "sm" | "md"
 */
export default function ChipFilterBar({
    options = [],
    value,
    onChange,
    className = "",
    size = "md",
}) {
    const isSm = size === "sm";

    return (
        <div
            role="tablist"
            aria-label="Filter"
            className={cn(
                "inline-flex w-full items-center gap-2 rounded-2xl bg-card/50 p-1 backdrop-blur-md ring-1 ring-border",
                className
            )}
        >
            {options.map((opt) => {
                const active = opt.key === value;
                const Icon = opt.icon;
                return (
                    <button
                        key={opt.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange?.(opt.key)}
                        className={cn(
                            "flex-1 rounded-xl px-3 py-1.5 font-medium transition-colors duration-300 hover:bg-card/60 hover:text-foreground",
                            isSm ? "text-xs" : "text-sm",
                            active ? "bg-accent text-accent-foreground shadow" : "text-muted-foreground"
                        )}
                    >
                        <span className="inline-flex items-center justify-center gap-1.5">
                            {Icon ? <Icon className={cn(isSm ? "h-3.5 w-3.5" : "h-4 w-4")} /> : null}
                            <span>{opt.label}</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}