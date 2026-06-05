import { motion } from "framer-motion";
import { Sparkles, CalendarDays, TrendingUp } from "lucide-react";
import EvidenceViewer from "./EvidenceViewer";

const GrowthJourneyHistory = ({ intervention, config, glassStyles }) => {
    const history = Array.isArray(intervention?.history) ? intervention.history : [];

    return (
        <div className="lg:w-80 xl:w-96">
            <div className={`${glassStyles.inner} rounded-xl sm:rounded-2xl p-2.5 sm:p-4 h-full`}>
                <div className="flex items-center gap-2 sm:gap-3 mb-2.5 sm:mb-4">
                    <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <Sparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[8px] sm:text-xs uppercase tracking-wider text-muted-foreground">Check-in History</p>
                        <h4 className="text-xs sm:text-base font-bold text-foreground dark:text-white">
                            Recent Reflections
                        </h4>
                    </div>
                </div>

                <div className="space-y-1.5 sm:space-y-3 max-h-48 sm:max-h-80 overflow-y-auto pr-0 sm:pr-1 custom-scroll">
                    {history.length > 0 ? (
                        history.map((entry, idx) => (
                            <motion.div
                                key={`${entry.date || "entry"}-${idx}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + idx * 0.05 }}
                                className={`${config.lightBg} rounded-lg sm:rounded-xl p-2 sm:p-3 ${config.border} border`}
                            >
                                <div className="flex items-center justify-between gap-1.5 mb-0.5 sm:mb-1">
                                    <span className="flex items-center gap-1 text-[8px] sm:text-[10px] uppercase tracking-wider text-muted-foreground">
                                        <CalendarDays className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        {entry.date}
                                    </span>
                                    {entry.score != null && entry.score !== "-" && (
                                        <span className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 rounded-full ${config.lightBg} ${config.text} text-[9px] sm:text-xs font-medium`}>
                                            <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                            {entry.score} {intervention.progressUnit || "pts"}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] sm:text-sm text-foreground dark:text-white line-clamp-3 leading-snug">
                                    {entry.summary || entry.notes || entry.observation || "Check-in recorded"}
                                </p>
                                    {(entry.nextSteps || entry.nextStep) && (
                                        <p className="mt-1 text-[9px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                            Next steps: {entry.nextSteps || entry.nextStep}
                                        </p>
                                    )}
                                    {entry.lateReason && (
                                        <p className="mt-1 text-[9px] sm:text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                                            Late reason: {entry.lateReason}
                                        </p>
                                    )}
                                    {entry.celebration && (
                                    <div className="mt-1 sm:mt-2 text-[9px] sm:text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full inline-flex items-center gap-0.5 sm:gap-1">
                                        {entry.celebration}
                                    </div>
                                )}
                                {entry.evidence?.length > 0 && <EvidenceViewer evidence={entry.evidence} />}
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-4 sm:py-8 text-muted-foreground">
                            <p className="text-sm sm:text-base font-semibold text-foreground dark:text-white mb-1">
                                No check-ins yet
                            </p>
                            <p className="text-[11px] sm:text-xs opacity-75">
                                Progress history will appear after the first check-in is logged.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GrowthJourneyHistory;
