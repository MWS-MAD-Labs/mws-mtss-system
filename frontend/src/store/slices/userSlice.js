import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/authService';

// Async thunks
export const fetchUsers = createAsyncThunk(
    'users/fetchUsers',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await api.get('/users', { params });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
        }
    }
);

export const fetchUserById = createAsyncThunk(
    'users/fetchUserById',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/users/${userId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
        }
    }
);

export const fetchOrganizationStructure = createAsyncThunk(
    'users/fetchOrganizationStructure',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/users/organization');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch organization structure');
        }
    }
);

export const getOrganizationMembers = createAsyncThunk(
    'users/getOrganizationMembers',
    async (organizationId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/users/organization/${organizationId}/members`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to get organization members');
        }
    }
);

export const getUserOrganizations = createAsyncThunk(
    'users/getUserOrganizations',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/users/${userId}/organizations`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to get user organizations');
        }
    }
);

// Initial state
const initialState = {
    users: [],
    currentUser: null,
    organizationStructure: null,
    organizationMembers: null,
    userOrganizations: null,
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        hasNext: false,
        hasPrev: false
    },
    filters: {
        role: '',
        personType: '',
        department: '',
        unit: '',
        jobLevel: '',
        employmentStatus: '',
        search: '',
        isActive: true
    },
    loading: false,
    error: null,
    lastUpdated: null
};

// Slice
const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        resetFilters: (state) => {
            state.filters = initialState.filters;
        },
        setCurrentUser: (state, action) => {
            state.currentUser = action.payload;
        },
        clearCurrentUser: (state) => {
            state.currentUser = null;
        },
        updateUserInList: (state, action) => {
            const index = state.users.findIndex(user => user.id === action.payload.id);
            if (index !== -1) {
                state.users[index] = { ...state.users[index], ...action.payload };
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch users
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload.data?.users || action.payload.users || [];
                state.pagination = action.payload.data?.pagination || action.payload.pagination || initialState.pagination;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch user by ID
            .addCase(fetchUserById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUser = action.payload.user;
            })
            .addCase(fetchUserById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Organization structure
            .addCase(fetchOrganizationStructure.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrganizationStructure.fulfilled, (state, action) => {
                state.loading = false;
                state.organizationStructure = action.payload;
            })
            .addCase(fetchOrganizationStructure.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Organization members
            .addCase(getOrganizationMembers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getOrganizationMembers.fulfilled, (state, action) => {
                state.loading = false;
                state.organizationMembers = action.payload.data;
            })
            .addCase(getOrganizationMembers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Get user organizations
            .addCase(getUserOrganizations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getUserOrganizations.fulfilled, (state, action) => {
                state.loading = false;
                state.userOrganizations = action.payload.data;
            })
            .addCase(getUserOrganizations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const {
    clearError,
    setFilters,
    resetFilters,
    setCurrentUser,
    clearCurrentUser,
    updateUserInList
} = userSlice.actions;

export default userSlice.reducer;
