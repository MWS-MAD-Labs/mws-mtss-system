import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { watchSession } from 'mws-central-auth/client';
import { fetchCurrentUser } from '@/store/slices/authSlice';

// The session can end elsewhere (signing out of another app through the Hub). The shared watcher asks the
// backend when the tab comes back into view; a revoked session answers 401, and the handler in authService.js
// then clears it and sends the person to the Hub.
export function useSessionRecheck() {
    const dispatch = useDispatch();
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

    useEffect(() => {
        if (!isAuthenticated) return undefined;
        return watchSession({
            check: async () => {
                const action = await dispatch(fetchCurrentUser());
                return !fetchCurrentUser.rejected.match(action) || action.payload?.status !== 401;
            },
            onRevoked: () => {},
        });
    }, [dispatch, isAuthenticated]);
}
