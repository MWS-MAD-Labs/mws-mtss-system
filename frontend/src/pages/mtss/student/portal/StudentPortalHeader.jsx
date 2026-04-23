import { memo } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { resolveStudentTitle } from "./studentPortalUtils";

const StudentPortalHeader = ({
    isHeaderSnapped,
    currentStudent,
    tierLabel,
    tierShortLabel,
    gradeLabel,
    classLabel,
    refreshPortal,
    isLoadingList,
    isLoadingDetail,
}) => {
    return (
        <>
            <motion.div
                aria-hidden
                initial={false}
                animate={isHeaderSnapped ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.5 }}
                className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[calc(env(safe-area-inset-top)+20px)]"
            >
                <div className="relative h-full w-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/78 via-white/38 to-transparent backdrop-blur-[8px] dark:from-slate-950/72 dark:via-slate-950/34 dark:to-transparent" />
                    <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-300/45 to-transparent dark:via-violet-200/25" />
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={isHeaderSnapped ? { opacity: 1, y: -6, scale: 0.972 } : { opacity: 1, y: 0, scale: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 34,
                    mass: 0.52,
                }}
                className="sticky top-2 z-20 ios-glass rounded-[30px] border border-white/70 bg-white/80 px-4 py-4 shadow-[0_16px_40px_rgba(91,33,182,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 md:rounded-[34px] md:px-4 md:py-5"
            >
                <div className="relative flex items-start justify-end gap-2">
                    <motion.p
                        animate={isHeaderSnapped ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 5, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.4 }}
                        className="pointer-events-none absolute left-1/2 top-1/2 max-w-[58%] -translate-x-1/2 -translate-y-1/2 truncate text-[13px] font-bold text-slate-700 dark:text-slate-100"
                    >
                        {resolveStudentTitle(currentStudent)}
                    </motion.p>

                    {isHeaderSnapped && (
                        <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 320, damping: 30, mass: 0.45 }}
                            className="inline-flex md:hidden ios-glass-soft items-center gap-1.5 rounded-2xl border border-white/75 bg-white/72 p-1 shadow-[0_8px_20px_rgba(99,102,241,0.14)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/58"
                        >
                            <span className="inline-flex min-h-[34px] items-center rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-2.5 py-1 text-[10px] font-extrabold text-white shadow-sm">
                                {tierShortLabel}
                            </span>
                            <motion.button
                                onClick={refreshPortal}
                                whileTap={{ scale: 0.96 }}
                                className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-xl border border-white/70 bg-white/92 text-slate-700 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-white/20 dark:bg-white/10 dark:text-slate-100"
                                title="Refresh data"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingList || isLoadingDetail ? "animate-spin" : ""}`} />
                            </motion.button>
                        </motion.div>
                    )}

                    <motion.div
                        animate={isHeaderSnapped ? { y: 0, scale: 0.99 } : { y: 2, scale: 1 }}
                        transition={{ type: "spring", stiffness: 340, damping: 30, mass: 0.45 }}
                        className="hidden md:inline-flex ios-glass-soft items-center gap-1.5 rounded-[20px] border border-white/75 bg-white/70 p-1.5 shadow-[0_10px_24px_rgba(99,102,241,0.12)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/52"
                    >
                        <motion.span
                            animate={{ y: [0, -1.5, 0] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                            className="inline-flex min-h-[44px] items-center rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-3.5 py-2 text-xs font-black text-white shadow-md"
                        >
                            {tierLabel}
                        </motion.span>
                        <motion.button
                            onClick={refreshPortal}
                            whileTap={{ scale: 0.97 }}
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/20 dark:bg-white/10 dark:text-slate-100"
                            title="Refresh data"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingList || isLoadingDetail ? "animate-spin" : ""}`} />
                            Sync
                        </motion.button>
                    </motion.div>
                </div>

                <motion.div
                    animate={isHeaderSnapped ? { opacity: 0, maxHeight: 0, marginTop: 0 } : { opacity: 1, maxHeight: 120, marginTop: 16 }}
                    transition={{ type: "spring", stiffness: 360, damping: 32, mass: 0.42 }}
                    className="mt-4 overflow-hidden text-center"
                >
                    <div className="space-y-1 pb-1">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500 dark:text-slate-300">My MTSS Portal</p>
                        <h1 className="text-[2.05rem] leading-[1.06] font-black bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-fuchsia-300 dark:via-violet-300 dark:to-indigo-300 sm:text-[2.25rem]">
                            {resolveStudentTitle(currentStudent)}
                        </h1>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{gradeLabel} - {classLabel}</p>
                        <div className="mt-2.5 flex items-center justify-center gap-2 md:hidden">
                            <span className="inline-flex min-h-[32px] items-center rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 px-3 py-1 text-[11px] font-extrabold text-white shadow-sm">
                                {tierLabel}
                            </span>
                            <motion.button
                                onClick={refreshPortal}
                                whileTap={{ scale: 0.96 }}
                                className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-full border border-white/70 bg-white/88 text-slate-700 shadow-sm transition hover:-translate-y-0.5 dark:border-white/20 dark:bg-white/10 dark:text-slate-100"
                                title="Refresh data"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingList || isLoadingDetail ? "animate-spin" : ""}`} />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
};

StudentPortalHeader.displayName = "StudentPortalHeader";
export default memo(StudentPortalHeader);
