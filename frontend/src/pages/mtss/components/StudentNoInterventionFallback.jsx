import { motion } from "framer-motion";
import { Star } from "lucide-react";

const StudentNoInterventionFallback = ({ glassStyles }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`${glassStyles.inner} rounded-2xl p-8 text-center`}
    >
        <Star className="w-16 h-16 mx-auto mb-4 text-amber-400" />
        <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">
            Universal Supports Active
        </h3>
        <p className="text-muted-foreground">
            This student is receiving Tier 1 universal classroom supports. No targeted interventions are currently assigned.
        </p>
    </motion.div>
);

export default StudentNoInterventionFallback;
