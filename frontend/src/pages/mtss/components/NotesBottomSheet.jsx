import { memo, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Copy, CheckCircle2, Sparkles } from "lucide-react";
import usePreferLowMotion from "@/hooks/usePreferLowMotion";

const NotesBottomSheet = memo(({ open, onOpenChange, notes, interventionLabel }) => {
    const reduce = usePreferLowMotion();
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (typeof document === "undefined") return undefined;
        const root = document.documentElement;
        if (open) {
            root.dataset.sheetOpen = "true";
        } else {
            delete root.dataset.sheetOpen;
        }
        return () => {
            delete root.dataset.sheetOpen;
        };
    }, [open]);

    const handleCopy = useCallback(() => {
        if (!notes) return;
        navigator.clipboard
            .writeText(notes)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => {});
    }, [notes]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[95] flex items-end justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    aria-modal="true"
                    role="dialog"
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/30 dark:from-black/75 dark:via-black/60 dark:to-black/40 backdrop-blur-lg"
                        onClick={() => onOpenChange(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                    <motion.div
                        initial={reduce ? { opacity: 0 } : { y: "100%" }}
                        animate={reduce ? { opacity: 1 } : { y: 0 }}
                        exit={reduce ? { opacity: 0 } : { y: "100%" }}
                        transition={
                            reduce
                                ? { duration: 0.15 }
                                : { type: "spring", damping: 30, stiffness: 320, mass: 0.75 }
                        }
                        className={`relative z-[96] w-full max-w-lg overflow-hidden rounded-t-[32px] border border-white/30 dark:border-white/[0.08] glass-strong glass--liquid ${reduce ? "" : "sheen-animate"} shadow-[0_-35px_90px_rgba(15,23,42,0.35)]`}
                    >
                        <div className="glass__noise" />
                        <div className="glass__refract glass__refract--soft" />
                        {!reduce && (
                            <>
                                <div className="glass__caustic" />
                                <div
                                    className="glass__bubble pointer-events-none"
                                    style={{ "--glass-bubble-top": "18%", "--glass-bubble-left": "10%" }}
                                />
                                <div
                                    className="glass__orb pointer-events-none"
                                    style={{ "--glass-orb-bottom": "14%", "--glass-orb-right": "8%" }}
                                />
                                <div className="glass__wave pointer-events-none opacity-70" />
                                <motion.div
                                    className="absolute -top-16 left-1/2 h-28 w-[120%] -translate-x-1/2 rounded-full bg-gradient-to-r from-white/60 via-white/20 to-transparent opacity-60 blur-3xl pointer-events-none"
                                    animate={{ x: ["-6%", "6%", "-6%"] }}
                                    transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                                />
                            </>
                        )}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,188,220,0.35),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(125,211,252,0.3),transparent_55%),radial-gradient(circle_at_45%_80%,rgba(253,224,71,0.25),transparent_60%)] opacity-70 pointer-events-none" />
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
                        <div className="relative">
                            <div className="flex justify-center pt-3 pb-1.5">
                                <motion.div
                                    className="w-9 h-1 rounded-full bg-slate-300/80 dark:bg-slate-500/50 shadow-[0_0_12px_rgba(255,255,255,0.45)]"
                                    initial={{ width: 20 }}
                                    animate={{ width: 36 }}
                                    transition={{ delay: 0.2, duration: 0.3, ease: "easeOut" }}
                                />
                            </div>
                            <div className="flex items-center justify-between px-5 pb-3">
                                <motion.div
                                    className="flex items-center gap-3"
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1, duration: 0.3 }}
                                >
                                    <span className="relative w-11 h-11 rounded-[18px] bg-gradient-to-br from-pink-500 via-amber-400 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/25">
                                        <FileText className="w-5 h-5" />
                                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-gradient-to-r from-yellow-300 to-amber-400 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                            <Sparkles className="w-1.5 h-1.5 text-amber-800" />
                                        </span>
                                    </span>
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.24em] font-semibold bg-gradient-to-r from-rose-500 via-amber-500 to-sky-500 dark:from-pink-300 dark:via-amber-300 dark:to-sky-300 text-transparent bg-clip-text">
                                            Intervention Notes
                                        </p>
                                        <p className="text-sm font-bold text-foreground dark:text-white truncate max-w-[180px] sm:max-w-[280px]">
                                            {interventionLabel || "Notes"}
                                        </p>
                                    </div>
                                </motion.div>

                                <motion.button
                                    onClick={() => onOpenChange(false)}
                                    whileTap={{ scale: 0.85 }}
                                    className="w-8 h-8 rounded-full bg-white/60 dark:bg-white/[0.08] backdrop-blur-sm border border-slate-200/60 dark:border-white/[0.1] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/80 dark:hover:bg-white/[0.14] transition-colors shadow-sm"
                                    aria-label="Close"
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </div>
                            <div className="mx-5 h-[1px] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
                            <motion.div
                                className="px-5 py-4 max-h-[55vh] overflow-y-auto custom-scroll"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15, duration: 0.3 }}
                            >
                                {notes ? (
                                    <div className="rounded-2xl bg-white/55 dark:bg-white/[0.05] border border-white/70 dark:border-white/[0.08] p-4 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                                        <p className="text-sm sm:text-base text-foreground dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                                            {notes}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center">
                                            <FileText className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            No notes recorded for this intervention.
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                            {notes && (
                                <motion.div
                                    className="px-5 pb-5 pt-2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.25 }}
                                >
                                    <div className="mb-3 h-[1px] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
                                    <motion.button
                                        onClick={handleCopy}
                                        whileTap={{ scale: 0.97 }}
                                        whileHover={reduce ? {} : { y: -1 }}
                                        className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 border backdrop-blur-sm shadow-sm ${
                                            copied
                                                ? "bg-emerald-500/15 dark:bg-emerald-500/10 border-emerald-300/50 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-emerald-500/10"
                                                : "bg-gradient-to-r from-white/80 via-white/65 to-white/75 dark:from-white/[0.08] dark:via-white/[0.06] dark:to-white/[0.05] border-white/70 dark:border-white/[0.12] text-slate-700 dark:text-slate-200 hover:from-white/90 hover:to-white/80 dark:hover:from-white/[0.12] dark:hover:to-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                                        }`}
                                    >
                                        {copied ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copy Notes
                                            </>
                                        )}
                                    </motion.button>
                                </motion.div>
                            )}
                            <div className="h-[env(safe-area-inset-bottom,0px)]" />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

NotesBottomSheet.displayName = "NotesBottomSheet";
export default NotesBottomSheet;
