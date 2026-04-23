import React from 'react';
import { motion } from 'framer-motion';
import usePreferLowMotion from '@/hooks/usePreferLowMotion';

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    in: {
        opacity: 1,
        y: 0,
    },
    out: {
        opacity: 0,
        y: -20,
    },
};

const baseTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5,
};

const AnimatedPage = ({ children }) => {
    const lowMotion = usePreferLowMotion();
    const transition = lowMotion ? { duration: 0.15, ease: 'easeOut', type: 'tween' } : baseTransition;
    const variants = lowMotion ? { initial: { opacity: 0 }, in: { opacity: 1 }, out: { opacity: 0 } } : pageVariants;
    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={variants}
            transition={transition}
        >
            {children}
        </motion.div>
    );
};

export default AnimatedPage;
