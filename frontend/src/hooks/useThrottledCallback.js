import { useCallback, useEffect, useRef } from 'react';

const useThrottledCallback = (callback, delay = 120) => {
    const callbackRef = useRef(callback);
    const timeoutRef = useRef(null);
    const lastInvokedRef = useRef(0);
    const trailingArgsRef = useRef(null);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    return useCallback((...args) => {
        const safeDelay = Math.max(0, Number(delay) || 0);
        if (safeDelay === 0) {
            callbackRef.current(...args);
            return;
        }

        const now = Date.now();
        const elapsed = now - lastInvokedRef.current;

        if (elapsed >= safeDelay) {
            lastInvokedRef.current = now;
            callbackRef.current(...args);
            return;
        }

        trailingArgsRef.current = args;
        if (timeoutRef.current) return;

        timeoutRef.current = setTimeout(() => {
            timeoutRef.current = null;
            lastInvokedRef.current = Date.now();
            const trailingArgs = trailingArgsRef.current || [];
            trailingArgsRef.current = null;
            callbackRef.current(...trailingArgs);
        }, safeDelay - elapsed);
    }, [delay]);
};

export default useThrottledCallback;
