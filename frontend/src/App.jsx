import { Suspense, lazy, memo, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AppHelmet from '@/components/app/AppHelmet';
import SkipLink from '@/components/app/SkipLink';
import RouteConfig from '@/components/app/RouteConfig';

const BackgroundDecor = lazy(() => import('@/components/app/BackgroundDecor'));
const WorkforceHumanisticLayer = lazy(() => import('@/components/app/WorkforceHumanisticLayer'));
const UtilityDock = lazy(() => import('@/components/app/UtilityDock'));
const ThemeSpellOverlay = lazy(() => import('@/components/app/ThemeSpellOverlay'));
const GlobalLoadingOverlay = lazy(() => import('@/components/app/GlobalLoadingOverlay'));
const QuickLogoutButton = lazy(() => import('@/components/app/QuickLogoutButton'));

const routeMatches = (pathname, prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`);

const App = memo(() => {
    const location = useLocation();
    const aosRef = useRef(null);
    const [showEnhancements, setShowEnhancements] = useState(false);

    useEffect(() => {
        let isDisposed = false;

        const initAOS = () => {
            Promise.all([
                import('aos'),
                import('aos/dist/aos.css')
            ])
                .then(([module]) => {
                    if (isDisposed) return;
                    const AOS = module.default;
                    aosRef.current = AOS;
                    AOS.init({
                        duration: 800,
                        easing: 'ease-out-quart',
                        offset: 60,
                        once: true,
                    });
                })
                .catch(() => {});
        };

        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            const idleId = window.requestIdleCallback(initAOS, { timeout: 2000 });
            return () => {
                isDisposed = true;
                window.cancelIdleCallback?.(idleId);
            };
        }

        const timeoutId = window.setTimeout(initAOS, 600);
        return () => {
            isDisposed = true;
            window.clearTimeout(timeoutId);
        };
    }, []);

    useEffect(() => {
        aosRef.current?.refresh();
    }, [location.pathname]);

    useEffect(() => {
        let disposed = false;

        const enableEnhancements = () => {
            if (!disposed) setShowEnhancements(true);
        };

        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            const idleId = window.requestIdleCallback(enableEnhancements, { timeout: 1500 });
            return () => {
                disposed = true;
                window.cancelIdleCallback?.(idleId);
            };
        }

        const timeoutId = window.setTimeout(enableEnhancements, 280);
        return () => {
            disposed = true;
            window.clearTimeout(timeoutId);
        };
    }, []);

    // Memoize key for AnimatePresence to prevent unnecessary re-renders
    const animatePresenceKey = useMemo(() => location.pathname, [location.pathname]);
    const shouldShowWorkforceLayer = useMemo(
        () => !routeMatches(location.pathname, '/emotional-checkin/staff'),
        [location.pathname],
    );

    return (
        <>
            <AppHelmet />
            <SkipLink />

            <div className="relative min-h-screen bg-background text-foreground">
                {showEnhancements && (
                    <Suspense fallback={null}>
                        <BackgroundDecor />
                    </Suspense>
                )}

                {showEnhancements && shouldShowWorkforceLayer && (
                    <Suspense fallback={null}>
                        <WorkforceHumanisticLayer />
                    </Suspense>
                )}

                <div className="relative z-10">
                    <AnimatePresence mode="wait" key={animatePresenceKey}>
                        <RouteConfig />
                    </AnimatePresence>
                </div>

                {showEnhancements && (
                    <Suspense fallback={null}>
                        <ThemeSpellOverlay />
                        <UtilityDock />
                        <QuickLogoutButton />
                        <GlobalLoadingOverlay />
                    </Suspense>
                )}
            </div>
        </>
    );
});

App.displayName = 'App';

export default App;
