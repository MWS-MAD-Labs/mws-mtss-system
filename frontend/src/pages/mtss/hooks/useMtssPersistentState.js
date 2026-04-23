import { useCallback, useEffect, useMemo, useState } from "react";

const resolveValue = (value) => (typeof value === "function" ? value() : value);

const readStoredValue = (storageKey, fallbackValue) => {
    if (typeof window === "undefined" || !storageKey) {
        return fallbackValue;
    }

    try {
        const raw = window.sessionStorage.getItem(storageKey);
        if (!raw) {
            return fallbackValue;
        }
        return JSON.parse(raw);
    } catch {
        return fallbackValue;
    }
};

export const useMtssPersistentState = (storageKey, initialValue) => {
    const resolvedInitialValue = useMemo(() => resolveValue(initialValue), [initialValue]);

    const [state, setState] = useState(() => {
        return readStoredValue(storageKey, resolvedInitialValue);
    });

    useEffect(() => {
        setState(readStoredValue(storageKey, resolvedInitialValue));
    }, [resolvedInitialValue, storageKey]);

    useEffect(() => {
        if (typeof window === "undefined" || !storageKey) {
            return;
        }

        try {
            window.sessionStorage.setItem(storageKey, JSON.stringify(state));
        } catch {
            // Ignore storage quota or serialization issues for view-state memory.
        }
    }, [state, storageKey]);

    const resetState = useCallback(() => {
        setState(resolvedInitialValue);
    }, [resolvedInitialValue]);

    return [state, setState, resetState];
};

export default useMtssPersistentState;
