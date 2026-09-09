import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import PageLoader from '../components/PageLoader';
import { consumePendingRedirect, getDefaultPostLoginPath, sanitizeRedirectPath } from '@/utils/authRedirect';
import { setStoredAuthSession } from '@/utils/authStorage';
import { getBasePath } from '@/lib/apiBase';

// Same specifiers RouteConfig.jsx's lazy() calls use for these routes, so
// triggering the import here warms Vite's module cache under the exact key
// React.lazy will look up next - by the time navigate() below causes
// Suspense to render that route, the chunk is very likely already resolved,
// instead of Suspense falling back to <PageLoader/> a second time right
// after this component's own <PageLoader/> - the double mount is what reads
// as a flicker, not just the actual load time.
const DESTINATION_PRELOADERS = {
    '/mtss/teacher': () => import('@/pages/mtss/TeacherDashboardPage'),
    '/mtss/admin': () => import('@/pages/mtss/AdminDashboardPage'),
    '/mtss/observer': () => import('@/pages/mtss/ObserverDashboardPage'),
    '/mtss/select-role': () => import('@/pages/RoleSelectionPage'),
};

const AuthCallback = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    // StrictMode double-invokes this effect in dev (mount, cleanup, mount
    // again). The first run consumes the hash and strips it via
    // history.replaceState below - the second run then reads an
    // already-empty hash, sees no token, and navigates to the error page
    // right after the first run already navigated to the real destination.
    // Two competing navigations right after landing is exactly the visible
    // "lands on /teacher, then flickers" this guard prevents.
    const hasHandledRef = useRef(false);

    useEffect(() => {
        if (hasHandledRef.current) return;
        hasHandledRef.current = true;

        const handleCallback = async () => {
            try {
                // No token here anymore - the backend already set it as an
                // httpOnly cookie before this redirect (routes/auth.js).
                // user/redirect are just UI convenience data.
                const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
                const userData = hashParams.get('user');

                if (!userData) {
                    navigate('/mtss?error=missing_data');
                    return;
                }

                // Parse user data from hash fragment payload
                const userFromQuery = JSON.parse(decodeURIComponent(userData));

                // Use OAuth callback payload directly to avoid auth reset loops.
                let canonicalUser = userFromQuery;

                // Ensure the user has required role field
                if (!canonicalUser.role) {
                    navigate('/mtss?error=missing_role');
                    return;
                }

                setStoredAuthSession({ user: canonicalUser });
                dispatch(loginSuccess({ user: canonicalUser }));

                const redirectParam = hashParams.get('redirect');
                const safeRedirect = sanitizeRedirectPath(redirectParam);
                const pendingRedirect = consumePendingRedirect();
                const target = safeRedirect || pendingRedirect || getDefaultPostLoginPath(canonicalUser);

                console.info('MTSS auth callback redirect resolved', {
                    authMethod: canonicalUser.authMethod || null,
                    redirectParam,
                    safeRedirect,
                    pendingRedirect,
                    target
                });

                // Fire-and-forget: start fetching the destination's chunk now,
                // in parallel with the history/navigate calls below, instead
                // of waiting for Suspense to discover it needs the chunk.
                DESTINATION_PRELOADERS[target]?.().catch(() => {});

                // Remove the user/redirect params from the URL before leaving callback
                // route. This bypasses React Router, so the gateway build's /mtss
                // prefix (getBasePath()) has to be added explicitly rather than
                // coming from a router basename.
                window.history.replaceState({}, document.title, `${getBasePath()}/auth/callback`);
                navigate(target, { replace: true });

            } catch (error) {
                console.error('Auth callback error:', error);
                navigate('/mtss?error=callback_failed');
            }
        };

        handleCallback();
    }, [navigate, dispatch]);

    return <PageLoader />;
};

export default AuthCallback;
