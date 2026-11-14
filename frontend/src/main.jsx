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
import { clearStoredAuthSession, getStoredAuthUserRaw } from '@/utils/authStorage';
import { stripRestoredMarker } from '@/utils/hubSession';

syncInitialTheme();

// The session is the Hub's cookie, which this code cannot read, so the backend is asked who is signed in. A cached
// copy of the person keeps protected pages from flashing a loading screen while it answers.
const cachedUser = getStoredAuthUserRaw();
if (cachedUser) {
    try {
        store.dispatch({ type: 'auth/setUser', payload: { user: JSON.parse(cachedUser) } });
    } catch (error) {
        console.error('Error parsing stored user data:', error);
        clearStoredAuthSession();
    }
}
store.dispatch(fetchCurrentUser()).then((action) => {
    if (fetchCurrentUser.fulfilled.match(action)) stripRestoredMarker();
});

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

    // The browser only re-checks the SW script on a genuine network
    // navigation - a tab or installed PWA left open/backgrounded for days
    // (the common case on mobile, where people rarely force-quit) never
    // triggers that check on its own, so controllerchange above never
    // fires and the page keeps running whatever bundle it booted with.
    // Force a check whenever the tab actually becomes visible again.
    navigator.serviceWorker.ready.then((registration) => {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                registration.update().catch(() => {});
            }
        });
    }).catch(() => {});
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
