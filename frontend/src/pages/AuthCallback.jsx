import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import PageLoader from '../components/PageLoader';
import { consumePendingRedirect, getDefaultPostLoginPath, sanitizeRedirectPath } from '@/utils/authRedirect';
import { setStoredAuthSession } from '@/utils/authStorage';

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
                const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
                const token = hashParams.get('token');
                const userData = hashParams.get('user');

                if (!token || !userData) {
                    navigate('/?error=missing_data');
                    return;
                }

                // Parse user data from hash fragment payload
                const userFromQuery = JSON.parse(decodeURIComponent(userData));

                // Use OAuth callback payload directly to avoid auth reset loops.
                let canonicalUser = userFromQuery;

                // Ensure the user has required role field
                if (!canonicalUser.role) {
                    navigate('/?error=missing_role');
                    return;
                }

                setStoredAuthSession({ token, user: canonicalUser });
                dispatch(loginSuccess({ user: canonicalUser, token }));

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

                // Remove sensitive token/user params from URL before leaving callback route
                window.history.replaceState({}, document.title, '/auth/callback');
                navigate(target, { replace: true });

            } catch (error) {
                console.error('Auth callback error:', error);
                navigate('/?error=callback_failed');
            }
        };

        handleCallback();
    }, [navigate, dispatch]);

    return <PageLoader />;
};

export default AuthCallback;
