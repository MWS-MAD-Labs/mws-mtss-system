// src/components/Sheets/SafetyTipsSheet.jsx
import React from "react";
import * as Dialog from "@/components/ui/dialog";
import { ShieldCheck, Info, Wallet, Phone, MessageSquare } from "lucide-react";

/**
 * SafetyTipsSheet
 * - Lightweight sheet with safety guidelines for jobs
 *
 * Props:
 * - open: boolean
 * - onOpenChange: (open: boolean) => void
 */
export default function SafetyTipsSheet({ open, onOpenChange }) {
    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-lg rounded-3xl glass-strong p-0 overflow-hidden">
                <Dialog.DialogHeader className="p-4 sm:p-5 border-b border-border/50 bg-card/40 backdrop-blur-xl">
                    <Dialog.DialogTitle className="text-base sm:text-lg font-semibold inline-flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-emerald-400" /> Safety Tips
                    </Dialog.DialogTitle>
                    <Dialog.DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                        Follow these guidelines for a safe, smooth experience.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <div className="p-4 sm:p-5 space-y-3">
                    <Tip
                        icon={<MessageSquare className="h-4 w-4 text-accent" />}
                        title="Keep chats in-app"
                        desc="Keep conversations in-app for easy review if disputes occur."
                    />
                    <Tip
                        icon={<Wallet className="h-4 w-4 text-primary" />}
                        title="Prefer protected payments"
                        desc="Choose online/escrow methods for high-value jobs."
                    />
                    <Tip
                        icon={<Phone className="h-4 w-4 text-foreground/80" />}
                        title="Verify contact"
                        desc="Confirm phone number and location details match."
                    />
                    <Tip
                        icon={<Info className="h-4 w-4 text-amber-400" />}
                        title="Report issues"
                        desc="If anything seems suspicious, report or open a dispute promptly."
                    />
                </div>

                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2 flex items-center justify-end gap-2 border-t border-border/50 bg-card/40 backdrop-blur-xl">
                    <Dialog.DialogClose asChild>
                        <button className="rounded-xl bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:bg-primary/90 transition-colors duration-300">
                            Got it
                        </button>
                    </Dialog.DialogClose>
                </div>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    );
}

function Tip({ icon, title, desc }) {
    return (
        <div className="rounded-xl border border-border/50 bg-card/40 p-3">
            <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary/30">{icon}</div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
            </div>
        </div>
    );
}
