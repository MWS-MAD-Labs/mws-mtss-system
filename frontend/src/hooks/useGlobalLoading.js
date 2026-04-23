import { useSyncExternalStore } from 'react';
import { subscribeToGlobalLoading, getGlobalLoadingSnapshot } from '@/lib/loadingManager';

const useGlobalLoading = () => {
    return useSyncExternalStore(
        subscribeToGlobalLoading,
        getGlobalLoadingSnapshot,
        () => false
    );
};

export default useGlobalLoading;
