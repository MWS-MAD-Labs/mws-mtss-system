import React, { memo, useEffect, useMemo, useState } from 'react';
import { Sparkles, WandSparkles } from 'lucide-react';
import { useSelector } from 'react-redux';
import usePreferLowMotion from '@/hooks/usePreferLowMotion';
import { THEME_SPELL_EVENT } from '@/lib/theme';
import { selectAssistantProfile } from '@/store/slices/aiChatSlice';

const SPELL_LAYOUT = [
    { angle: -42, distance: 54, delay: 0.02 },
    { angle: -8, distance: 68, delay: 0.05 },
    { angle: 22, distance: 58, delay: 0.08 },
    { angle: 55, distance: 62, delay: 0.11 },
    { angle: 96, distance: 50, delay: 0.14 },
    { angle: 135, distance: 56, delay: 0.18 },
    { angle: 176, distance: 60, delay: 0.2 },
    { angle: -128, distance: 52, delay: 0.23 }
];

const clampPercent = (value) => Math.max(8, Math.min(92, value));

const ThemeSpellOverlay = memo(() => {
    const lowMotion = usePreferLowMotion();
    const assistantProfile = useSelector(selectAssistantProfile);
    const assistantName = useMemo(() => {
        const name = assistantProfile?.assistant?.assistantName;
        if (typeof name === 'string' && name.trim().length > 0) return name.trim();
        return 'AI Assistant';
    }, [assistantProfile]);

    const [spellState, setSpellState] = useState({
        active: false,
        theme: 'light',
        incantation: '',
        xPercent: 50,
        yPercent: 50,
        id: 0
    });

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const onThemeSpell = (event) => {
            const detail = event?.detail || {};
            const width = window.innerWidth || 1;
            const height = window.innerHeight || 1;
            const xPercent = clampPercent(((typeof detail.x === 'number' ? detail.x : width * 0.5) / width) * 100);
            const yPercent = clampPercent(((typeof detail.y === 'number' ? detail.y : height * 0.5) / height) * 100);

            setSpellState((prev) => ({
                active: true,
                theme: detail.theme === 'dark' ? 'dark' : 'light',
                incantation: detail.incantation || (detail.theme === 'dark' ? 'Nox' : 'Lumos Maxima'),
                xPercent,
                yPercent,
                id: prev.id + 1
            }));
        };

        window.addEventListener(THEME_SPELL_EVENT, onThemeSpell);
        return () => window.removeEventListener(THEME_SPELL_EVENT, onThemeSpell);
    }, []);

    useEffect(() => {
        if (!spellState.active) return undefined;
        const timeoutId = window.setTimeout(
            () => setSpellState((prev) => ({ ...prev, active: false })),
            lowMotion ? 520 : 1180
        );
        return () => window.clearTimeout(timeoutId);
    }, [lowMotion, spellState.active, spellState.id]);

    if (!spellState.active) return null;

    return (
        <div
            className={`theme-spell-layer ${spellState.theme === 'dark' ? 'theme-spell-layer--nox' : 'theme-spell-layer--lumos'} ${lowMotion ? 'theme-spell-layer--reduced' : ''}`}
            style={{
                '--spell-x': `${spellState.xPercent}%`,
                '--spell-y': `${spellState.yPercent}%`
            }}
        >
            <div className="theme-spell-aura" aria-hidden="true" />
            <div className="theme-spell-sparks" aria-hidden="true">
                {!lowMotion && SPELL_LAYOUT.map((spark, index) => (
                    <span
                        key={`${spellState.id}-${index}`}
                        className="theme-spell-spark"
                        style={{
                            '--spark-angle': `${spark.angle}deg`,
                            '--spark-distance': `${spark.distance}px`,
                            '--spark-delay': `${spark.delay}s`
                        }}
                    />
                ))}
            </div>

            <div className="theme-spell-bubble" role="status" aria-live="polite">
                <span className="theme-spell-bubble__icon">
                    <WandSparkles className="h-4 w-4" />
                </span>
                <div className="theme-spell-bubble__copy">
                    <p className="theme-spell-bubble__name">{assistantName}</p>
                    <p className="theme-spell-bubble__spell">{spellState.incantation}</p>
                </div>
                <Sparkles className="h-3.5 w-3.5 opacity-80" />
            </div>
        </div>
    );
});

ThemeSpellOverlay.displayName = 'ThemeSpellOverlay';

export default ThemeSpellOverlay;

