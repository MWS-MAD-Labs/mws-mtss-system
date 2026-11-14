import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { keepFresh } from 'mws-central-auth/client';
import { clearAuth } from '@/store/slices/authSlice';
import { clearStoredAuthSession } from '@/utils/authStorage';
import { getHubBaseUrl } from '@/utils/hubConfig';

// While a page is open the Hub's access token is renewed shortly before it ends (the Hub turns the refresh token
// over each time). When the Hub says the session is over (signed out, or the account is no longer active), this
// tab leaves for the Hub front page.
export function useHubSessionKeeper() {
    const dispatch = useDispatch();
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

    useEffect(() => {
        if (!isAuthenticated) return undefined;
        let stop = () => {};
        let cancelled = false;
        getHubBaseUrl().then((base) => {
            if (cancelled || !base) return;
            stop = keepFresh({
                refreshUrl: `${base}/auth/refresh`,
                onEnded: () => {
                    clearStoredAuthSession();
                    dispatch(clearAuth());
                    window.location.replace(`${base}/`);
                },
            });
        });
        return () => {
            cancelled = true;
            stop();
        };
    }, [dispatch, isAuthenticated]);
}
