import { memo } from "react";

export const TierPill = memo(({ tier, compact = false }) => {
    const styles = {
        "Tier 1": "bg-gradient-to-r from-[#22c55e] to-[#14b8a6] text-white border border-emerald-300/45 shadow-[0_6px_15px_rgba(16,185,129,0.35)] dark:from-[#047857] dark:to-[#10b981] dark:text-white",
        "Tier 2": "bg-gradient-to-r from-[#f97316] to-[#ef4444] text-white border border-orange-300/40 shadow-[0_6px_15px_rgba(249,115,22,0.35)] dark:from-[#c2410c] dark:to-[#dc2626]",
        "Tier 3": "bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-white border border-amber-300/45 shadow-[0_6px_15px_rgba(245,158,11,0.35)] dark:from-[#b45309] dark:to-[#ea580c]",
    };

    const sizing = compact ? "text-[9px] px-2 py-0.5" : "text-xs px-3 py-1";

    return (
        <span className={`inline-flex items-center whitespace-nowrap font-semibold rounded-full ${sizing} ${styles[tier] || "bg-muted/50 text-foreground"}`}>
            {tier}
        </span>
    );
});
TierPill.displayName = "TierPill";

export const ProgressBadge = memo(({ status, compact = false }) => {
    let style = "bg-gradient-to-r from-[#16a34a] to-[#0d9488] text-white border border-emerald-300/45 shadow-[0_6px_12px_rgba(16,185,129,0.3)]";
    if (status === "Needs Attention") {
        style = "bg-gradient-to-r from-[#f87171] to-[#fb7185] text-white border border-rose-200/50 shadow-[0_6px_12px_rgba(248,113,113,0.35)]";
    } else if (status === "Improving") {
        style = "bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-white border border-amber-300/45 shadow-[0_6px_12px_rgba(249,115,22,0.3)]";
    }

    const sizing = compact ? "text-[9px] px-2 py-0.5" : "text-xs px-3 py-1";

    return (
        <span className={`inline-flex items-center whitespace-nowrap font-semibold rounded-full ${sizing} ${style}`}>
            {status}
        </span>
    );
});
ProgressBadge.displayName = "ProgressBadge";
