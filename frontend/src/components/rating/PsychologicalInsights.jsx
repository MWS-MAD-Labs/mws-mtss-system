import React, { memo } from "react";
import { motion } from "framer-motion";
import { Brain, Heart } from "lucide-react";

const PsychologicalInsights = memo(({ insights, confidence }) => {
    if (!insights) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mt-6 md:mt-8 px-2"
        >
            <div className="glass glass-card border border-primary/20 dark:border-primary/15 transition-all duration-300">
                <div className="glass__refract" />
                <div className="glass__refract--soft" />
                <div className="relative z-10 p-4 md:p-6">
                    <div className="flex items-start gap-3 md:gap-4">
                        <div className="flex-shrink-0 w-11 h-11 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/15 dark:to-primary/8 flex items-center justify-center shadow-sm">
                            <Brain className="w-5 h-5 md:w-7 md:h-7 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-sm md:text-lg font-semibold text-foreground">
                                    Psychological Insights
                                </h3>
                                {confidence && (
                                    <span className="text-xs px-2 py-1 bg-primary/10 dark:bg-primary/8 text-primary rounded-full font-medium">
                                        {confidence}% confidence
                                    </span>
                                )}
                            </div>
                            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                                {insights}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

PsychologicalInsights.displayName = 'PsychologicalInsights';

export default PsychologicalInsights;