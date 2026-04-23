let activeRequests = 0;
const listeners = new Set();
const notify = () => {
    const isLoading = activeRequests > 0;
    listeners.forEach((listener) => {
        try {
            listener(isLoading);
        } catch (error) {
            console.error('Global loading listener error:', error);
        }
    });
};

export const startGlobalLoading = () => {
    activeRequests += 1;
    if (activeRequests === 1) {
        notify();
    }
};

export const stopGlobalLoading = () => {
    if (activeRequests > 0) {
        activeRequests -= 1;
        if (activeRequests === 0) {
            notify();
        }
    }
};

export const resetGlobalLoading = () => {
    activeRequests = 0;
    notify();
};

export const subscribeToGlobalLoading = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const getGlobalLoadingSnapshot = () => activeRequests > 0;
