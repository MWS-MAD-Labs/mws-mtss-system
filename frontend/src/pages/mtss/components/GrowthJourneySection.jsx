import { memo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { INTERVENTION_CONFIG, glassStyles } from "../config/studentProfileConfig";
import GrowthJourneyMain from "./GrowthJourneyMain";
import GrowthJourneyHistory from "./GrowthJourneyHistory";

const GrowthJourneySection = memo(({
    intervention,
    strategyLabel,
    durationLabel,
    frequencyLabel,
    mentorLabel,
    goalLabel,
    monitoringMethodLabel,
    startDateLabel,
    notesLabel,
}) => {
    const config = INTERVENTION_CONFIG[intervention?.type] || INTERVENTION_CONFIG.SEL;
    const CurrentIcon = config.icon || Sparkles;

    if (!intervention) return null;

    return (
        <motion.section
            key={intervention.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`${glassStyles.inner} rounded-xl sm:rounded-3xl p-2.5 sm:p-6`}
        >
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-6">
                <GrowthJourneyMain
                    intervention={intervention}
                    config={config}
                    CurrentIcon={CurrentIcon}
                    strategyLabel={strategyLabel}
                    durationLabel={durationLabel}
                    frequencyLabel={frequencyLabel}
                    mentorLabel={mentorLabel}
                    goalLabel={goalLabel}
                    monitoringMethodLabel={monitoringMethodLabel}
                    startDateLabel={startDateLabel}
                    notesLabel={notesLabel}
                />
                <GrowthJourneyHistory intervention={intervention} config={config} glassStyles={glassStyles} />
            </div>
        </motion.section>
    );
});

GrowthJourneySection.displayName = "GrowthJourneySection";
export default GrowthJourneySection;
