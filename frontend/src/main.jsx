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

syncInitialTheme();

// Initialize auth state from localStorage
const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
const user = localStorage.getItem('auth_user');

if (token && user) {
    try {
        const userData = JSON.parse(user);
        store.dispatch({
            type: 'auth/setUser',
            payload: { user: userData, token }
        });
        // Validate persisted token before rendering protected pages.
        store.dispatch(fetchCurrentUser());
    } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear invalid data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        localStorage.removeItem('auth_user');
    }
}

// Service worker registration is handled by Vite PWA plugin

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
