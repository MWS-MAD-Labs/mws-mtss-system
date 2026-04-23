import axios from 'axios';
import { startGlobalLoading, stopGlobalLoading } from '@/lib/loadingManager';

// Default to versioned API to match backend routing
const API_BASE_URL = import.meta.env.VITE_API_BASE || '/api/v1';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        if (!config?.skipGlobalLoading) {
            startGlobalLoading();
        }
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        if (!error?.config?.skipGlobalLoading) {
            stopGlobalLoading();
        }
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => {
        if (!response?.config?.skipGlobalLoading) {
            stopGlobalLoading();
        }
        return response;
    },
    (error) => {
        if (!error?.config?.skipGlobalLoading) {
            stopGlobalLoading();
        }
        if (error.response?.status === 401) {
            const requestPath = String(error?.config?.url || '');
            const isLoginRequest = /\/auth\/login$/i.test(requestPath);
            if (!isLoginRequest) {
                const msg = String(error.response?.data?.message || '').toLowerCase();
                const authFailureHints = [
                    'token expired',
                    'invalid token',
                    'jwt expired',
                    'access token required',
                    'authentication required',
                    'user not found or inactive',
                ];
                const shouldResetAuth = !msg || authFailureHints.some((hint) => msg.includes(hint));
                if (shouldResetAuth) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('auth_user');
                    localStorage.removeItem('token');
                    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
                        window.location.assign('/');
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);

// Auth API functions
export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response;
};

export const logout = async () => {
    const response = await api.post('/auth/logout');
    return response;
};

export const getCurrentUser = async () => {
    const response = await api.get('/auth/me');
    return response;
};

export const registerUser = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response;
};

export default api;
