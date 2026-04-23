import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import usePreferLowMotion from "@/hooks/usePreferLowMotion";

const InfoCardDetailSheet = memo(({ open, onOpenChange, icon: Icon, label, gradient, children }) => {
    const reduce = usePreferLowMotion();

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[95] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    aria-modal="true"
                    role="dialog"
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                        onClick={() => onOpenChange(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 10 }}
                        animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 10 }}
                        transition={
                            reduce
                                ? { duration: 0.12 }
                                : { type: "spring", damping: 28, stiffness: 340, mass: 0.7 }
                        }
                        className="relative z-[96] w-full max-w-sm overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 shadow-[0_25px_60px_rgba(0,0,0,0.25)]"
                    >
                        {/* Top gradient bar */}
                        <div className={`h-1 bg-gradient-to-r ${gradient}`} />

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 pt-4 pb-3">
                            <div className="flex items-center gap-3">
                                <span className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
                                    <Icon className="w-5 h-5" />
                                </span>
                                <p className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground">
                                    {label}
                                </p>
                            </div>
                            <motion.button
                                onClick={() => onOpenChange(false)}
                                whileTap={{ scale: 0.85 }}
                                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </motion.button>
                        </div>

                        {/* Divider */}
                        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

                        {/* Content */}
                        <motion.div
                            className="px-5 py-4 max-h-[50vh] overflow-y-auto"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08, duration: 0.2 }}
                        >
                            {children}
                        </motion.div>

                        {/* Bottom safe area */}
                        <div className="h-2" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

InfoCardDetailSheet.displayName = "InfoCardDetailSheet";
export default InfoCardDetailSheet;
