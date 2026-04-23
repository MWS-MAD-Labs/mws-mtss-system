import { memo } from "react";
import { motion } from "framer-motion";

const TrustBadge = memo(({ icon: Icon, text }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full glass border border-border/50 backdrop-blur-xl"
    >
        <Icon className="w-3 h-3 md:w-4 md:h-4 text-emerald" />
        <span className="text-[10px] md:text-xs font-medium text-foreground">{text}</span>
    </motion.div>
));

TrustBadge.displayName = 'TrustBadge';

export default TrustBadge;