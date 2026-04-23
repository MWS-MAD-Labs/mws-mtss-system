import React, { memo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Quote } from "lucide-react";

const MotivationalMessage = memo(({ message }) => {
    if (!message) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="mt-6 md:mt-8 px-2"
        >
            <div className="glass glass-card border border-accent/20 dark:border-accent/15 transition-all duration-300">
                <div className="glass__refract" />
                <div className="glass__refract--soft" />
                <div className="relative z-10 p-4 md:p-6">
                    <div className="flex items-start gap-3 md:gap-4">
                        <div className="flex-shrink-0 w-11 h-11 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 dark:from-accent/15 dark:to-accent/8 flex items-center justify-center shadow-sm">
                            <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <Quote className="w-4 h-4 text-accent/60" />
                                <h3 className="text-sm md:text-lg font-semibold text-foreground">
                                    Motivational Message
                                </h3>
                            </div>
                            <div className="bg-accent/5 dark:bg-accent/10 rounded-lg p-3 border border-accent/20 dark:border-accent/15">
                                <p className="text-xs md:text-sm text-accent dark:text-accent/90 italic leading-relaxed">
                                    "{message}"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

MotivationalMessage.displayName = 'MotivationalMessage';

export default MotivationalMessage;