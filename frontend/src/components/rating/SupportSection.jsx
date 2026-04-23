import React, { memo } from "react";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { sanitizeInput } from "@/lib/ratingUtils";

const SupportSection = memo(({ supportPerson, needsSupport, motivationalMessage }) => {
    // Always show the component, even if no support person is selected
    // if (!supportPerson || supportPerson === "No Need") return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="mt-6 md:mt-8 px-2"
        >
            <div className={`glass glass-card ${needsSupport
                ? 'border-2 border-accent/30 dark:border-accent/20'
                : 'border border-primary/20 dark:border-primary/15'
                } transition-all duration-300`}>
                <div className="glass__refract" />
                <div className="glass__refract--soft" />
                <div className="relative z-10 p-4 md:p-6 flex items-start gap-3 md:gap-4">
                    <div className={`flex-shrink-0 w-11 h-11 md:w-14 md:h-14 rounded-xl ${needsSupport ? 'bg-accent/20 dark:bg-accent/10' : 'bg-primary/20 dark:bg-primary/10'
                        } flex items-center justify-center shadow-sm`}>
                        <MessageSquare className={`w-5 h-5 md:w-7 md:h-7 ${needsSupport ? 'text-accent' : 'text-primary'
                            }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-lg font-semibold text-foreground mb-1.5 md:mb-2">
                            {needsSupport ? 'Priority Support Requested' : 'Support Connection'}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                            {supportPerson && supportPerson !== "No Need"
                                ? (needsSupport
                                    ? `We've notified ${sanitizeInput(supportPerson)} about your check-in. They'll reach out to you today to provide support.`
                                    : `${sanitizeInput(supportPerson)} will check in with you as requested. Feel free to reach out directly as well.`
                                )
                                : "Remember that support is always available when you need it. Your well-being is important to us."
                            }
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

SupportSection.displayName = 'SupportSection';

export default SupportSection;