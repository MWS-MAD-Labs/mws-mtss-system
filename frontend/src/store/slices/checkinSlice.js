import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    submitCheckin as submitCheckinApi,
    getTodayCheckin as getTodayCheckinApi,
    getCheckinResults as getCheckinResultsApi,
    getCheckinHistory as getCheckinHistoryApi,
    getPersonalDashboard as getPersonalDashboardApi
} from '../../services/checkinService';

// Async thunks
export const submitCheckin = createAsyncThunk(
    'checkin/submitCheckin',
    async (checkinData, { rejectWithValue }) => {
        try {
            console.log('Submitting check-in data:', checkinData);
            const response = await submitCheckinApi(checkinData);
            console.log('Check-in response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Check-in submission error:', error.response?.data);
            return rejectWithValue(error.response?.data?.message || 'Failed to submit check-in');
        }
    }
);

export const getTodayCheckin = createAsyncThunk(
    'checkin/getTodayCheckin',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getTodayCheckinApi();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch today\'s check-in');
        }
    }
);

export const getCheckinResults = createAsyncThunk(
    'checkin/getCheckinResults',
    async (checkinId, { rejectWithValue }) => {
        try {
            const response = await getCheckinResultsApi(checkinId);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch check-in results');
        }
    }
);

export const getCheckinHistory = createAsyncThunk(
    'checkin/getCheckinHistory',
    async ({ page = 1, limit = 10, userId = null, startDate, endDate } = {}, { rejectWithValue }) => {
        try {
            const response = await getCheckinHistoryApi(page, limit, userId, { startDate, endDate });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch check-in history');
        }
    }
);

export const getPersonalDashboard = createAsyncThunk(
    'checkin/getPersonalDashboard',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getPersonalDashboardApi();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load personal dashboard');
        }
    }
);

// Initial state
const initialState = {
    todayCheckin: null,
    checkinResults: null,
    checkinHistory: [],
    currentCheckin: null,
    loading: false,
    error: null,
    personalDashboard: null,
    personalLoading: false,
    pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    }
};

// Slice
const checkinSlice = createSlice({
    name: 'checkin',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentCheckin: (state) => {
            state.currentCheckin = null;
        },
        setCurrentCheckin: (state, action) => {
            state.currentCheckin = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Submit check-in
            .addCase(submitCheckin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(submitCheckin.fulfilled, (state, action) => {
                state.loading = false;
                const checkin = action.payload?.data?.checkin || action.payload?.checkin || null;
                state.currentCheckin = checkin;
                state.todayCheckin = checkin;
                state.error = null;
            })
            .addCase(submitCheckin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Get today's check-in
            .addCase(getTodayCheckin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getTodayCheckin.fulfilled, (state, action) => {
                state.loading = false;
                state.todayCheckin = action.payload?.data?.checkin || action.payload?.checkin || null;
                state.error = null;
            })
            .addCase(getTodayCheckin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.todayCheckin = null;
            })
            // Get check-in results
            .addCase(getCheckinResults.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getCheckinResults.fulfilled, (state, action) => {
                state.loading = false;
                state.checkinResults = action.payload.data.checkin;
                state.error = null;
            })
            .addCase(getCheckinResults.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.checkinResults = null;
            })
            // Get check-in history
            .addCase(getCheckinHistory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getCheckinHistory.fulfilled, (state, action) => {
                state.loading = false;
                state.checkinHistory = action.payload.data?.checkins || action.payload.checkins || [];
                state.pagination = action.payload.data?.pagination || action.payload.pagination || {
                    page: 1,
                    limit: 10,
                    total: 0,
                    pages: 0
                };
                state.error = null;
            })
            .addCase(getCheckinHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.checkinHistory = [];
            })
            // Personal dashboard
            .addCase(getPersonalDashboard.pending, (state) => {
                state.personalLoading = true;
                state.error = null;
            })
            .addCase(getPersonalDashboard.fulfilled, (state, action) => {
                state.personalLoading = false;
                const payload = action.payload?.data || action.payload || null;
                state.personalDashboard = payload;
                if (payload?.today?.checkin) {
                    state.todayCheckin = payload.today.checkin;
                }
            })
            .addCase(getPersonalDashboard.rejected, (state, action) => {
                state.personalLoading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError, clearCurrentCheckin, setCurrentCheckin } = checkinSlice.actions;
export default checkinSlice.reducer;
