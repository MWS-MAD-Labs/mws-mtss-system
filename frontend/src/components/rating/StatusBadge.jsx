import React, { memo } from "react";
import { motion } from "framer-motion";
import { Smile, AlertCircle, Heart, Battery } from "lucide-react";

const StatusBadge = memo(({ analysis }) => {
    const badges = {
        positive: {
            text: "Positive Energy Detected",
            color: "bg-emerald/10 dark:bg-emerald/8 border-emerald/20 dark:border-emerald/15 text-emerald",
            icon: Smile
        },
        challenging: {
            text: "Support Recommended",
            color: "bg-accent/10 dark:bg-accent/8 border-accent/20 dark:border-accent/15 text-accent",
            icon: AlertCircle
        },
        balanced: {
            text: "Emotionally Balanced",
            color: "bg-primary/10 dark:bg-primary/8 border-primary/20 dark:border-primary/15 text-primary",
            icon: Heart
        },
        depleted: {
            text: "Recovery Needed",
            color: "bg-maroon/10 dark:bg-maroon/8 border-maroon/20 dark:border-maroon/15 text-maroon",
            icon: Battery
        }
    };

    const badge = badges[analysis.emotionalState];
    const Icon = badge.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="flex justify-center mb-6 md:mb-8"
        >
            <div className={`inline-flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full border ${badge.color} transition-all duration-300 hover:scale-105`}>
                <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm font-medium">{badge.text}</span>
            </div>
        </motion.div>
    );
});

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;