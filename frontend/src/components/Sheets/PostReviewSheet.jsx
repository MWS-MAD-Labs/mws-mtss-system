// src/components/Sheets/PostReviewSheet.jsx
import React from "react";
import * as Dialog from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WalletMinimal, HandCoins, Clock3, Tag, Calendar, MapPin } from "lucide-react";

/**
 * PostReviewSheet
 * - Compact liquid-glass confirmation before posting a job
 * - Present key fields and allow confirm or edit
 *
 * Props:
 * - open: boolean
 * - onOpenChange: (open: boolean) => void
 * - data: {
 *     title, description, category, skills, budget, duration, payment, deadline, location
 *   }
 * - onConfirm: () => void
 */
export default function PostReviewSheet({ open, onOpenChange, data = {}, onConfirm }) {
    const {
        title = "",
        description = "",
        category = "",
        skills = "",
        budget = "",
        duration = "",
        payment = "",
        deadline = "",
        location = "",
    } = data;

    const PayIcon = payment === "cash" ? HandCoins : WalletMinimal;

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="max-w-lg rounded-3xl glass-strong p-0 overflow-hidden">
                <Dialog.DialogHeader className="p-4 sm:p-5 border-b border-border/50 bg-card/40 backdrop-blur-xl">
                    <Dialog.DialogTitle className="text-base sm:text-lg font-semibold">
                        Confirm Posting
                    </Dialog.DialogTitle>
                    <Dialog.DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                        Review short details before publishing.
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <div className="p-4 sm:p-5 space-y-3">
                    <Row label="Title">
                        <p className="text-sm font-medium text-foreground line-clamp-2">{title || "-"}</p>
                    </Row>

                    <Row label="Description">
                        <p className="text-xs sm:text-sm text-foreground/90 line-clamp-4">{description || "-"}</p>
                    </Row>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Row label="Category" icon={<Tag className="h-4 w-4 text-primary" />}>
                            <p className="text-xs sm:text-sm">{category || "-"}</p>
                        </Row>
                        <Row label="Skill">
                            <p className="text-xs sm:text-sm truncate">{skills || "-"}</p>
                        </Row>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Row label="Budget">
                            <p className="text-sm font-semibold">{budget || "-"}</p>
                        </Row>
                        <Row label="Duration" icon={<Clock3 className="h-4 w-4 text-accent" />}>
                            <p className="text-xs sm:text-sm">{duration || "-"}</p>
                        </Row>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Row label="Payment" icon={<PayIcon className="h-4 w-4 text-secondary-foreground" />}>
                            <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${payment === "cash"
                                        ? "bg-accent text-accent-foreground"
                                        : "bg-primary text-primary-foreground"
                                    }`}
                            >
                                {payment === "cash" ? "Cash" : "Wallet"}
                            </span>
                        </Row>
                        <Row label="Deadline" icon={<Calendar className="h-4 w-4 text-muted-foreground" />}>
                            <p className="text-xs sm:text-sm">{deadline || "-"}</p>
                        </Row>
                    </div>

                    <Row label="Location" icon={<MapPin className="h-4 w-4 text-accent" />}>
                        <p className="text-xs sm:text-sm truncate">{location || "-"}</p>
                    </Row>

                    {/* Safety note */}
                    <div className="mt-1 rounded-xl border border-border/50 bg-card/40 p-2.5">
                        <p className="text-[11px] text-muted-foreground">
                            For high value, consider escrow or a small deposit.
                        </p>
                    </div>
                </div>

                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2 flex items-center justify-end gap-2 border-t border-border/50 bg-card/40 backdrop-blur-xl">
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onOpenChange(false)}>
                        Edit
                    </Button>
                    <Button
                        size="sm"
                        className="rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground"
                        onClick={() => {
                            onConfirm?.();
                            onOpenChange(false);
                        }}
                    >
                        Publish
                    </Button>
                </div>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    );
}

function Row({ label, children, icon = null }) {
    return (
        <div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {icon}
                <span className="uppercase">{label}</span>
            </div>
            <div className="mt-1">{children}</div>
        </div>
    );
}
