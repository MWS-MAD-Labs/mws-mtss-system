import React, { memo } from "react";
import { motion } from "framer-motion";
import { Heart, Shield, Brain, Target, Battery, TrendingUp, Sparkles } from "lucide-react";

const RecommendationCard = memo(({ recommendation, index }) => {
    const iconMap = {
        "Heart": Heart,
        "Shield": Shield,
        "Brain": Brain,
        "Target": Target,
        "Battery": Battery,
        "TrendingUp": TrendingUp,
        "Sparkles": Sparkles
    };

    const Icon = iconMap[recommendation.icon] || Heart;
    const priorityBorder = {
        high: recommendation.borderColor || "border-accent/30 dark:border-accent/20",
        medium: "border-border/40 dark:border-border/25",
        low: "border-border/30 dark:border-border/20"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 + (index * 0.1) }}
            whileHover={{ scale: 1.01, y: -2 }}
            className={`glass glass-card hover-lift border ${priorityBorder[recommendation.priority]} transition-all duration-300`}
        >
            <div className="glass__refract" />
            <div className="glass__refract--soft" />
            <div className="glass__noise" />

            <div className="relative z-10 p-4 md:p-6">
                <div className="flex items-start gap-3 md:gap-4">
                    <motion.div
                        className={`flex-shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br ${recommendation.color} flex items-center justify-center shadow-md`}
                        whileHover={{ rotate: 5, scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Icon className="w-5 h-5 md:w-7 md:h-7 text-foreground/80" />
                    </motion.div>
                    <div className="flex-1 min-w-0 space-y-1.5 md:space-y-2">
                        <h3 className="text-sm md:text-lg font-semibold text-foreground leading-tight">
                            {recommendation.title}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                            {recommendation.description}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

RecommendationCard.displayName = 'RecommendationCard';

export default RecommendationCard;