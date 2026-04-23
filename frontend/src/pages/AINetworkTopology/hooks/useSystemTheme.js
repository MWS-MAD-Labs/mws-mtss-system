import { useState, useEffect } from 'react';

export function useSystemTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia?.('(prefers-color-scheme: light)').matches
      ? 'light' : 'dark';
  });

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: light)');
    if (!mq) return;
    const handler = (e) => setTheme(e.matches ? 'light' : 'dark');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return [theme, setTheme];
}
