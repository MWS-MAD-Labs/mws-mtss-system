import { useCallback, useEffect, useRef } from 'react';

const useRafThrottle = (callback) => {
    const callbackRef = useRef(callback);
    const frameRef = useRef(null);
    const lastArgsRef = useRef(null);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => () => {
        if (frameRef.current !== null) {
            if (typeof cancelAnimationFrame === 'function') {
                cancelAnimationFrame(frameRef.current);
            } else {
                clearTimeout(frameRef.current);
            }
        }
    }, []);

    return useCallback((...args) => {
        lastArgsRef.current = args;
        if (frameRef.current !== null) return;

        const schedule = typeof requestAnimationFrame === 'function'
            ? requestAnimationFrame
            : (fn) => setTimeout(fn, 16);

        frameRef.current = schedule(() => {
            frameRef.current = null;
            const safeArgs = lastArgsRef.current || [];
            lastArgsRef.current = null;
            callbackRef.current(...safeArgs);
        });
    }, []);
};

export default useRafThrottle;
