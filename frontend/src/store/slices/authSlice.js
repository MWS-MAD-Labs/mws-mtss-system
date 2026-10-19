import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCurrentUser } from '../../services/authService';
import { goToHubHome } from '@/utils/hubSession';
import { clearStoredAuthSession, setStoredAuthSession, setStoredAuthUser } from '@/utils/authStorage';

// There is no sign-out here: the Hub owns it. This goes to the Hub front page and leaves the page as it is.
export const leaveToHub = createAsyncThunk('auth/leaveToHub', async () => {
    // False when the Hub address is not known, then the person stays here.
    return goToHubHome();
});

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
// No token field: the session is the Hub's cookie. isAuthenticated is the one source of truth for whether this
// tab has a session.
const initialState = {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    // The Hub knows the person but Central gave them no access to this app.
    noAccess: false,
    // On the way to the Hub: the page must not treat the missing session as a reason to ask the Hub for it back.
    leaving: false,
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
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
        },
        loginSuccess: (state, action) => {
            state.user = action.payload.user;
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
            setStoredAuthSession(action.payload);
        },
        clearAuth: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(leaveToHub.pending, (state) => {
                state.leaving = true;
            })
            // The page is being left, so what it holds stays until it is gone.
            .addCase(leaveToHub.fulfilled, (state, action) => {
                state.leaving = action.payload !== false;
            })
            // Fetch current user
            // Asking again while someone is signed in (the tab came back into view) happens quietly. Only the first
            // check shows the loader, otherwise the page under it is taken apart and what was typed is lost.
            .addCase(fetchCurrentUser.pending, (state) => {
                state.loading = !state.isAuthenticated;
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                const userData = action.payload?.user || action.payload?.data?.user;
                // Keep the existing object when nothing changed: callers that list `user` (or something derived from
                // it) in an effect or memo array re-run on every new object, even with identical values, and
                // dashboards that refetch this on mount would spin.
                const unchanged =
                    userData && state.user && JSON.stringify(userData) === JSON.stringify(state.user);
                if (!unchanged) {
                    state.user = userData || null;
                }
                state.isAuthenticated = !!userData;
                state.noAccess = false;
                state.error = null;
                if (userData && !unchanged) {
                    setStoredAuthUser(userData);
                }
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.loading = false;
                const payload = action.payload || {};
                const message = typeof payload === 'string' ? payload : payload?.message;
                const status = typeof payload === 'string' ? null : payload?.status;
                state.error = message || 'Failed to fetch user';
                state.noAccess = status === 403;

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
                    clearStoredAuthSession();
                }
            });
    },
});

export const { clearError, setUser, clearAuth, loginSuccess } = authSlice.actions;
export default authSlice.reducer;
