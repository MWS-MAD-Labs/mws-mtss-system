import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess, clearAuth, fetchCurrentUser } from '@/store/slices/authSlice';
import { consumePendingRedirect, getDefaultPostLoginPath } from '@/utils/authRedirect';
import { AUTH_USER_KEY, getStoredAuthToken, getStoredAuthUserRaw, isAuthStorageKey } from '@/utils/authStorage';

// Hub can silently refresh this app's session from a hidden iframe instead
// of navigating this visible tab through the whole SSO redirect chain (see
// mws-hub's AppCard.tsx) - that write lands in this origin's localStorage,
// via the exact same /auth/callback this tab would use for a normal login.
// This tab never sees that write on its own (the `storage` event only
// fires in OTHER same-origin contexts, never the one that made the
// change) - this hook is what actually picks it up and brings this tab's
// own Redux state in line, live, with no reload.
export function useCrossTabAuthSync() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

    useEffect(() => {
        const handleStorage = (event) => {
            if (!isAuthStorageKey(event.key)) return;

            const token = getStoredAuthToken();
            const userRaw = getStoredAuthUserRaw();

            if (!token || !userRaw) {
                dispatch(clearAuth());
                return;
            }

            let user;
            try {
                user = JSON.parse(userRaw);
            } catch (error) {
                console.error(`useCrossTabAuthSync: could not parse ${AUTH_USER_KEY}`, error);
                return;
            }

            dispatch(loginSuccess({ user, token }));
            dispatch(fetchCurrentUser());

            // Was logged out (or never logged in) in this tab specifically -
            // it's very likely sitting on the landing page, not a dashboard,
            // since ProtectedRoute would have bounced it there already.
            // Send it where a normal login would have.
            if (!isAuthenticated) {
                const pendingRedirect = consumePendingRedirect();
                navigate(pendingRedirect || getDefaultPostLoginPath(user), { replace: true });
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [dispatch, navigate, isAuthenticated]);
}
