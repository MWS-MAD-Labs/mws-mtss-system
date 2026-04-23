// src/components/feedback/EmptyState.jsx
import React from "react";
import { cn } from "@/lib/utils";

/**
 * EmptyState
 * - Tokenized compact empty state for lists/sections
 *
 * Props:
 * - icon?: ReactNode
 * - title: string
 * - subtitle?: string
 * - action?: ReactNode (optional CTA)
 * - className?: string
 */
export default function EmptyState({ icon = null, title, subtitle, action = null, className = "" }) {
    return (
        <div
            className={cn(
                "mx-auto max-w-xs rounded-2xl border border-dashed border-border/50 bg-card/50 backdrop-blur-md p-6 sm:p-8 text-center",
                className
            )}
        >
            {icon ? <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">{icon}</div> : null}
            <p className="text-sm font-medium text-foreground">{title}</p>
            {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
            {action ? <div className="mt-3">{action}</div> : null}
        </div>
    );
}