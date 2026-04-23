import React, { memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import PageLoader from '@/components/PageLoader';
import useGlobalLoading from '@/hooks/useGlobalLoading';

const GlobalLoadingOverlay = memo(() => {
    const isLoading = useGlobalLoading();

    return (
        <AnimatePresence>
            {isLoading && (
                <PageLoader key="global-page-loader" />
            )}
        </AnimatePresence>
    );
});

GlobalLoadingOverlay.displayName = 'GlobalLoadingOverlay';

export default GlobalLoadingOverlay;
