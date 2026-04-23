// src/components/Banners/KYCStatusBanner.jsx
import React from "react";
import { ShieldCheck, ShieldAlert, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * KYCStatusBanner
 * - Compact, token-driven banner to indicate account verification tier and gating
 * - Use this at the top of Wallet, WorkerDashboard, PostJob, OffersInbox
 *
 * Props:
 * - tier: "L0" | "L1" | "L2" (string)
 * - message?: string (optional override copy)
 * - onVerify?: () => void (CTA handler)
 * - className?: string
 */
export function KYCStatusBanner({ tier = "L0", message, onVerify, className = "" }) {
    const copy = (() => {
        if (message) return message;
        if (tier === "L2") return "Account verified. Full transaction limits enabled.";
        if (tier === "L1") return "Verification in progress: limited transaction limits. Complete to unlock all features.";
        return "Account not verified. Some features and payment limits are restricted.";
    })();

    const tone =
        tier === "L2"
            ? { ring: "ring-emerald-500/30", bg: "bg-emerald-500/10", icon: ShieldCheck, iconTone: "text-emerald-400" }
            : tier === "L1"
                ? { ring: "ring-amber-500/30", bg: "bg-amber-500/10", icon: Info, iconTone: "text-amber-400" }
                : { ring: "ring-rose-500/30", bg: "bg-rose-500/10", icon: ShieldAlert, iconTone: "text-rose-400" };

    const Icon = tone.icon;

    return (
        <div
            className={cn(
                "rounded-2xl border border-border/60 glass-strong p-3 sm:p-4 ring-1",
                tone.ring,
                className
            )}
            role="note"
            aria-live="polite"
        >
            <div className="flex items-start gap-3">
                <div className={cn("grid h-9 w-9 place-items-center rounded-lg", tone.bg, tone.iconTone)}>
                    <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">Verification Status: {tier}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{copy}</p>
                </div>
                {tier !== "L2" && (
                    <Button
                        size="sm"
                        className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={onVerify}
                    >
                        Verify
                    </Button>
                )}
            </div>
        </div>
    );
}

/**
 * DepositPromptBanner
 * - Educates users when cash is selected for high-value jobs; suggests deposit for protection
 *
 * Props:
 * - show: boolean (controls visibility)
 * - thresholdIDR: number (e.g., 300000)
 * - estimateIDR: number (estimated job value)
 * - onDeposit?: () => void
 * - className?: string
 */
export function DepositPromptBanner({
    show,
    thresholdIDR = 300000,
    estimateIDR = 0,
    onDeposit,
    className = "",
}) {
    if (!show) return null;
    const needsDeposit = estimateIDR >= thresholdIDR;

    return (
        <div
            className={cn(
                "rounded-2xl border border-border/60 glass-strong p-3 sm:p-4 ring-1 ring-accent/30",
                className
            )}
            role="note"
        >
            <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent/10 text-accent">
                    <Info className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">Payment Safety</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {needsDeposit
                            ? "High-value job. A small deposit is recommended to prevent unilateral cancellation."
                            : "For cash payments, consider a small deposit for added safety."}
                    </p>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg hover:text-accent hover:border-accent"
                    onClick={onDeposit}
                >
                    Deposit
                </Button>
            </div>
        </div>
    );
}

export default KYCStatusBanner;
