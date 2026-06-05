import { useState, useEffect } from 'react';
import { THEME_SPELL_EVENT } from '@/lib/theme';

/**
 * Returns true when the app is in dark mode.
 * Reacts to the custom THEME_SPELL_EVENT so charts and inline-styled
 * components re-render whenever the user toggles the theme.
 */
export function useAppTheme() {
    const [isDark, setIsDark] = useState(() =>
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
    );

    useEffect(() => {
        const handler = (e) => setIsDark(e.detail?.theme === 'dark');
        window.addEventListener(THEME_SPELL_EVENT, handler);
        return () => window.removeEventListener(THEME_SPELL_EVENT, handler);
    }, []);

    return isDark;
}
