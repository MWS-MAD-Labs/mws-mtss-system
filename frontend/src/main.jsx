import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import App from '@/App';
import '@/index.css';
import { Toaster } from '@/components/ui/toaster';
import { syncInitialTheme } from '@/lib/theme';
import { fetchCurrentUser } from '@/store/slices/authSlice';
import { clearStoredAuthSession, getStoredAuthToken, getStoredAuthUserRaw } from '@/utils/authStorage';

syncInitialTheme();

// Optimistically seed auth state from the cached user profile so protected
// pages don't flash a login screen while fetchCurrentUser() below confirms
// the real session - which lives in an httpOnly cookie now, not here.
// hasSessionMarker is a non-sensitive marker (see utils/authStorage.js),
// not a credential.
const hasSessionMarker = getStoredAuthToken();
const user = getStoredAuthUserRaw();

if (hasSessionMarker && user) {
    try {
        const userData = JSON.parse(user);
        store.dispatch({
            type: 'auth/setUser',
            payload: { user: userData }
        });
        // Validate against the actual cookie-backed session before
        // rendering protected pages.
        store.dispatch(fetchCurrentUser());
    } catch (error) {
        console.error('Error parsing stored user data:', error);
        clearStoredAuthSession();
    }
}

// Service worker registration is handled by Vite PWA plugin
if ('serviceWorker' in navigator) {
    let refreshedForServiceWorker = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshedForServiceWorker) return;
        refreshedForServiceWorker = true;
        window.location.reload();
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'LEGACY_SW_UNREGISTERED') {
            window.location.reload();
        }
    });
}

// No React Router basename here on purpose. MTSS's own route paths already
// bake in a literal "/mtss" prefix (RouteConfig.jsx - a leftover from before
// the app was migrated under the gateway's /mtss/* path, never cleaned up),
// so a basename would double it into /mtss/mtss/... Vite's own asset `base`
// (import.meta.env.BASE_URL = '/mtss/', used via lib/apiBase.js) is a
// separate, independent mechanism for JS/CSS/image URLs and is unaffected.
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <App />
                <Toaster />
            </BrowserRouter>
        </Provider>
    </React.StrictMode>
);
