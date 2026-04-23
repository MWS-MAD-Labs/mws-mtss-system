import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ShieldCheck, Wallet as WalletIcon, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * DepositSheet
 * - Reusable bottom sheet to suggest a small deposit for high-value cash jobs
 *
 * Props:
 * - open: boolean
 * - onOpenChange: (v:boolean) => void
 * - amount: number (agreed price)
 * - threshold?: number (default 300000)
 * - onWallet: () => void  // navigate to wallet / top-up
 * - onContinue: () => void // proceed without deposit
 */
export default function DepositSheet({
    open,
    onOpenChange,
    amount = 0,
    threshold = 300000,
    onWallet,
    onContinue,
}) {
    const reduce = useReducedMotion();
    const needs = Number(amount || 0) >= Number(threshold || 0);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    aria-modal="true"
                    role="dialog"
                >
                    <div
                        className="absolute inset-0 bg-foreground/70 dark:bg-background/80 backdrop-blur-sm"
                        onClick={() => onOpenChange?.(false)}
                    />
                    <motion.div
                        initial={reduce ? { opacity: 0 } : { y: 24, opacity: 0 }}
                        animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
                        exit={reduce ? { opacity: 0 } : { y: 24, opacity: 0 }}
                        transition={{ duration: reduce ? 0.001 : 0.28, ease: "easeOut" }}
                        className="relative z-[81] w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl p-4 sm:p-5 shadow-xl"
                    >
                        <button
                            onClick={() => onOpenChange?.(false)}
                            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="flex items-start gap-3 pr-8">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-base font-semibold text-foreground">Payment Safety</h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {needs
                                        ? "High-value job. A small deposit is recommended for safety."
                                        : "For cash payments, consider a small deposit for added safety."}
                                </p>
                                <p className="mt-2 text-xs text-foreground">
                                    Estimasi:{" "}
                                    <span className="font-semibold">
                                        {new Intl.NumberFormat("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                            maximumFractionDigits: 0,
                                        }).format(Number(amount || 0))}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <Button
                                onClick={onWallet}
                                className="flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-320"
                            >
                                <WalletIcon className="h-4 w-4" />
                                Open Wallet
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onContinue}
                                className="flex items-center justify-center gap-2 rounded-xl hover:border-accent hover:text-accent transition-colors duration-320"
                            >
                                Continue
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <p className="mt-3 text-[11px] text-muted-foreground">
                            Tip: Avoid full upfront payment. Keep your payment receipts.
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
