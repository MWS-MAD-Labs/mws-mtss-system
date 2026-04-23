import React, { memo } from "react";
import { motion } from "framer-motion";
import usePreferLowMotion from "@/hooks/usePreferLowMotion";

const PageTransition = memo(({ children }) => {
    const prefersReducedMotion = usePreferLowMotion();

    const variants = React.useMemo(() => ({
        initial: prefersReducedMotion ? {} : { opacity: 0, y: 8 },
        animate: prefersReducedMotion ? {} : { opacity: 1, y: 0 },
        exit: prefersReducedMotion ? {} : { opacity: 0, y: -6 },
    }), [prefersReducedMotion]);

    return (
        <motion.main
            id="content"
            role="main"
            className="relative min-h-screen"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
            transition={{ duration: prefersReducedMotion ? 0.15 : 0.32, ease: 'easeOut' }}
        >
            {children}
        </motion.main>
    );
});

PageTransition.displayName = 'PageTransition';
export default PageTransition;
