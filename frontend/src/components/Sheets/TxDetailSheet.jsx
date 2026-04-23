import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, ArrowUpRight, ArrowDownLeft, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

/**
 * TxDetailSheet
 * - Bottom sheet to show transaction details
 *
 * Props:
 * - open: boolean
 * - onOpenChange: (v:boolean) => void
 * - tx: {
 *     id: string|number,
 *     title: string,
 *     amount: number,
 *     date: string, // ISO or display
 *     type: "in" | "out",
 *     method?: "wallet" | "cash",
 *     jobId?: string | number
 *   }
 */
export default function TxDetailSheet({ open, onOpenChange, tx = {} }) {
    const isIn = tx?.type === "in";
    const method = tx?.method || "wallet";
    const amountFmt = safeCurrency(tx?.amount || 0);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="absolute inset-0 bg-foreground/70 dark:bg-background/80 backdrop-blur-sm"
                        onClick={() => onOpenChange?.(false)}
                    />
                    <motion.div
                        initial={{ y: 24, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 24, opacity: 0 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        className="relative z-[86] w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl p-4 sm:p-5 shadow-xl"
                    >
                        <button
                            onClick={() => onOpenChange?.(false)}
                            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Tutup"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Header */}
                        <div className="flex items-start gap-3 pr-8">
                            <div
                                className={`grid h-10 w-10 place-items-center rounded-xl ${isIn ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                                    }`}
                                aria-hidden
                            >
                                {isIn ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-base font-semibold text-foreground">{sanitize(tx?.title)}</h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {new Date(tx?.date || Date.now()).toLocaleString("id-ID", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="mt-4 space-y-3 text-sm">
                            <Row label="Nominal">
                                <span className={`font-semibold ${isIn ? "text-emerald-400" : "text-rose-400"}`}>
                                    {isIn ? "+" : "-"} {amountFmt}
                                </span>
                            </Row>
                            <Row label="Metode">
                                <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px]">
                                    <Wallet className="h-3.5 w-3.5" /> {method === "cash" ? "Tunai" : "Wallet"}
                                </span>
                            </Row>
                            <Row label="ID Transaksi">
                                <code className="text-xs text-muted-foreground">{String(tx?.id ?? "-")}</code>
                            </Row>
                            {tx?.jobId ? (
                                <Row label="Terkait Pekerjaan">
                                    <span className="inline-flex items-center gap-1 text-xs">
                                        <Link2 className="h-3.5 w-3.5" />
                                        <span>JOB-{sanitize(String(tx.jobId))}</span>
                                    </span>
                                </Row>
                            ) : null}
                        </div>

                        {/* Actions */}
                        <div className="mt-5 grid gap-2 sm:grid-cols-2">
                            {tx?.jobId ? (
                                <Link to={`/job/${tx.jobId}/track`} onClick={() => onOpenChange?.(false)}>
                                    <Button className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-320">
                                        Lihat Pekerjaan
                                    </Button>
                                </Link>
                            ) : null}
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange?.(false)}
                                className="w-full rounded-xl hover:border-accent hover:text-accent transition-colors duration-320"
                            >
                                Tutup
                            </Button>
                        </div>

                        <p className="mt-3 text-[11px] text-muted-foreground">
                            Catatan: Simpan bukti pembayaran. Hubungi support jika terjadi perbedaan data.
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function Row({ label, children }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{label}</span>
            <div className="text-right">{children}</div>
        </div>
    );
}

function sanitize(v = "") {
    return String(v).replace(/<[^>]*>/g, "").replace(/https?:\/\/[^\s]+/gi, "").trim().slice(0, 160);
}

function safeCurrency(n = 0) {
    try {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
    } catch {
        return `Rp ${Number(n || 0).toLocaleString("id-ID")}`;
    }
}
