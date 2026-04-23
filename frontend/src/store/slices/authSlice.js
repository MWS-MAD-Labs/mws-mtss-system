import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { login as loginApi, logout as logoutApi, getCurrentUser } from '../../services/authService';

// Async thunks
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const response = await loginApi(email, password);
            // Extract data from the nested response structure
            const { data } = response.data;
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Login failed');
        }
    }
);

export const logoutUser = createAsyncThunk(
    'auth/logoutUser',
    async (_, { rejectWithValue }) => {
        try {
            await logoutApi();
            return null;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Logout failed');
        }
    }
);

export const fetchCurrentUser = createAsyncThunk(
    'auth/fetchCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getCurrentUser();
            return response.data?.data || response.data;
        } catch (error) {
            return rejectWithValue({
                status: error.response?.status || null,
                message: error.response?.data?.message || 'Failed to fetch user'
            });
        }
    }
);

// Initial state
const initialState = {
    user: null,
    token: null,
    loading: false,
    error: null,
    isAuthenticated: false,
};

// Slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setUser: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
        },
        loginSuccess: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
            // Store in localStorage
            localStorage.setItem('auth_token', action.payload.token);
            localStorage.setItem('auth_user', JSON.stringify(action.payload.user));
        },
        clearAuth: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.error = null;
                // Store in localStorage
                localStorage.setItem('auth_token', action.payload.token);
                localStorage.setItem('auth_user', JSON.stringify(action.payload.user));
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
            })
            // Logout
            .addCase(logoutUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.error = null;
                // Clear localStorage
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                localStorage.removeItem('token');
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                // Still clear auth state even if logout API fails
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                localStorage.removeItem('token');
            })
            // Fetch current user
            .addCase(fetchCurrentUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                const userData = action.payload?.user || action.payload?.data?.user;
                state.user = userData || null;
                state.isAuthenticated = !!userData;
                state.error = null;
                if (userData) {
                    localStorage.setItem('auth_user', JSON.stringify(userData));
                }
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.loading = false;
                const payload = action.payload || {};
                const message = typeof payload === 'string' ? payload : payload?.message;
                const status = typeof payload === 'string' ? null : payload?.status;
                state.error = message || 'Failed to fetch user';

                const normalizedMessage = String(message || '').toLowerCase();
                const shouldClearAuth =
                    status === 401 ||
                    status === 403 ||
                    normalizedMessage.includes('unauthorized') ||
                    normalizedMessage.includes('token expired') ||
                    normalizedMessage.includes('invalid token') ||
                    normalizedMessage.includes('access token required') ||
                    normalizedMessage.includes('authentication required');

                if (shouldClearAuth) {
                    state.isAuthenticated = false;
                    state.user = null;
                    state.token = null;
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('auth_user');
                    localStorage.removeItem('token');
                }
            });
    },
});

export const { clearError, setUser, clearAuth, loginSuccess } = authSlice.actions;
export default authSlice.reducer;
