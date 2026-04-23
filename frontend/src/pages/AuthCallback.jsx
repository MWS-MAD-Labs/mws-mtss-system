import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import PageLoader from '../components/PageLoader';
import { consumePendingRedirect, getDefaultPostLoginPath, sanitizeRedirectPath } from '@/utils/authRedirect';

const AuthCallback = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
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

                // Persist token for API calls
                localStorage.setItem('auth_token', token);

                // Use OAuth callback payload directly to avoid auth reset loops.
                let canonicalUser = userFromQuery;

                // Ensure the user has required role field
                if (!canonicalUser.role) {
                    navigate('/?error=missing_role');
                    return;
                }

                // Persist canonical user and update Redux
                localStorage.setItem('auth_user', JSON.stringify(canonicalUser));
                dispatch(loginSuccess({ user: canonicalUser, token }));

                const redirectParam = hashParams.get('redirect');
                const safeRedirect = sanitizeRedirectPath(redirectParam);
                const pendingRedirect = consumePendingRedirect();
                const target = pendingRedirect || safeRedirect || getDefaultPostLoginPath(canonicalUser);

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
