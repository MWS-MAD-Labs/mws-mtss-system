/**
 * MTSS Redux Slice
 * Manages intervention plans, students, strategies, and assignments
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    fetchMtssStudents,
    fetchStrategies,
    fetchMentorAssignments,
    createMentorAssignment,
    updateMentorAssignment,
    fetchMtssStudentById,
} from '../../services/mtssService';

// Default form state for intervention plans
export const createDefaultInterventionForm = () => ({
    studentId: '',
    studentName: '',
    grade: '',
    className: '',
    type: '',
    strategyId: '',
    strategyName: '',
    tier: 'tier2',
    goal: '',
    notes: '',
    startDate: '',
    duration: '',
    monitorFrequency: '',
    customFrequencyDays: [],
    customFrequencyNote: '',
    monitorMethod: '',
    baselineValue: '',
    baselineUnit: 'score',
    targetValue: '',
    targetUnit: 'score',
});

// Default form state for progress updates
export const createDefaultProgressForm = () => ({
    studentId: '',
    assignmentId: '',
    studentName: '',
    date: new Date().toISOString().split('T')[0],
    performed: true,
    scoreValue: '',
    scoreUnit: 'score',
    celebration: '',
    summary: '',
    nextSteps: '',
});

// Async Thunks
export const fetchStudents = createAsyncThunk(
    'mtss/fetchStudents',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await fetchMtssStudents(params);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch students');
        }
    }
);

export const fetchStudentById = createAsyncThunk(
    'mtss/fetchStudentById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await fetchMtssStudentById(id);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch student');
        }
    }
);

export const fetchMtssStrategies = createAsyncThunk(
    'mtss/fetchStrategies',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await fetchStrategies(params);
            return response?.strategies || [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch strategies');
        }
    }
);

export const fetchAssignments = createAsyncThunk(
    'mtss/fetchAssignments',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await fetchMentorAssignments(params);
            return response?.assignments || [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch assignments');
        }
    }
);

export const createInterventionPlan = createAsyncThunk(
    'mtss/createInterventionPlan',
    async (formData, { rejectWithValue, getState }) => {
        try {
            const { auth } = getState();
            const mentorId = auth.user?.id || auth.user?._id;

            // Map form data to API payload
            const payload = {
                mentorId,
                studentIds: [formData.studentId],
                tier: formData.tier?.toLowerCase?.().replace(/\s+/g, '') || 'tier2',
                focusAreas: formData.type ? [formData.type] : ['Universal Supports'],
                startDate: formData.startDate || new Date().toISOString(),
                duration: formData.duration || undefined,
                strategyId: formData.strategyId || undefined,
                strategyName: formData.strategyName || undefined,
                monitoringMethod: formData.monitorMethod || undefined,
                monitoringFrequency: formData.monitorFrequency || undefined,
                customFrequencyDays: formData.monitorFrequency === 'Custom' && formData.customFrequencyDays?.length ? formData.customFrequencyDays : undefined,
                customFrequencyNote: formData.monitorFrequency === 'Custom' && formData.customFrequencyNote ? formData.customFrequencyNote : undefined,
                metricLabel: formData.baselineUnit || formData.targetUnit || 'score',
                baselineScore: formData.baselineValue
                    ? { value: Number(formData.baselineValue), unit: formData.baselineUnit || 'score' }
                    : undefined,
                targetScore: formData.targetValue
                    ? { value: Number(formData.targetValue), unit: formData.targetUnit || 'score' }
                    : undefined,
                notes: formData.notes || undefined,
                goals: formData.goal
                    ? [{ description: formData.goal, successCriteria: '' }]
                    : undefined,
            };

            const response = await createMentorAssignment(payload);
            return response?.assignment || response;
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to create intervention plan';
            return rejectWithValue(message);
        }
    }
);

export const submitProgressUpdate = createAsyncThunk(
    'mtss/submitProgressUpdate',
    async (formData, { rejectWithValue }) => {
        try {
            const payload = {
                checkIns: [{
                    date: formData.date || new Date().toISOString(),
                    summary: formData.summary || 'Progress update',
                    nextSteps: formData.nextSteps || undefined,
                    value: formData.scoreValue ? Number(formData.scoreValue) : undefined,
                    unit: formData.scoreUnit || 'score',
                    performed: formData.performed !== false,
                    skipReason: formData.performed === false ? (formData.skipReason || undefined) : undefined,
                    skipReasonNote: formData.performed === false && formData.skipReason === 'other' ? (formData.skipReasonNote || undefined) : undefined,
                    celebration: formData.celebration || undefined,
                }],
            };

            const response = await updateMentorAssignment(formData.assignmentId, payload);
            return response?.assignment || response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to submit progress update');
        }
    }
);

// Initial state
const initialState = {
    // Students
    students: [],
    studentsLoading: false,
    studentsError: null,
    studentsPagination: { total: 0, page: 1, pages: 1, limit: 500 },
    studentsSummary: null,

    // Selected student (for profile view)
    selectedStudent: null,
    selectedStudentLoading: false,
    selectedStudentError: null,

    // Strategies
    strategies: [],
    strategiesLoading: false,
    strategiesError: null,

    // Assignments
    assignments: [],
    assignmentsLoading: false,
    assignmentsError: null,

    // Intervention form
    interventionForm: createDefaultInterventionForm(),
    interventionSubmitting: false,
    interventionError: null,
    interventionSuccess: false,

    // Progress form
    progressForm: createDefaultProgressForm(),
    progressSubmitting: false,
    progressError: null,
    progressSuccess: false,

    // UI state
    lastRefresh: null,
};

// Slice
const mtssSlice = createSlice({
    name: 'mtss',
    initialState,
    reducers: {
        // Form state management
        updateInterventionForm: (state, action) => {
            const { field, value } = action.payload;
            state.interventionForm[field] = value;
        },
        setInterventionForm: (state, action) => {
            state.interventionForm = { ...state.interventionForm, ...action.payload };
        },
        resetInterventionForm: (state) => {
            state.interventionForm = createDefaultInterventionForm();
            state.interventionError = null;
            state.interventionSuccess = false;
        },
        updateProgressForm: (state, action) => {
            const { field, value } = action.payload;
            state.progressForm[field] = value;
        },
        setProgressForm: (state, action) => {
            state.progressForm = { ...state.progressForm, ...action.payload };
        },
        resetProgressForm: (state) => {
            state.progressForm = createDefaultProgressForm();
            state.progressError = null;
            state.progressSuccess = false;
        },
        // Clear errors
        clearInterventionError: (state) => {
            state.interventionError = null;
        },
        clearProgressError: (state) => {
            state.progressError = null;
        },
        clearStudentError: (state) => {
            state.selectedStudentError = null;
        },
        // Set selected student from list (optimization to avoid refetch)
        setSelectedStudentFromList: (state, action) => {
            const studentId = action.payload;
            const found = state.students.find((s) => s.id === studentId || s._id === studentId);
            if (found) {
                state.selectedStudent = found;
            }
        },
        clearSelectedStudent: (state) => {
            state.selectedStudent = null;
            state.selectedStudentError = null;
        },
        // Prefill form from student selection
        prefillInterventionFromStudent: (state, action) => {
            const student = action.payload;
            if (student) {
                state.interventionForm.studentId = student.id || student._id;
                state.interventionForm.studentName = student.name || '';
                state.interventionForm.grade = student.grade || student.currentGrade || '';
                state.interventionForm.className = student.className || '';
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch students
            .addCase(fetchStudents.pending, (state) => {
                state.studentsLoading = true;
                state.studentsError = null;
            })
            .addCase(fetchStudents.fulfilled, (state, action) => {
                state.studentsLoading = false;
                state.students = action.payload?.students || [];
                state.studentsPagination = action.payload?.pagination || state.studentsPagination;
                state.studentsSummary = action.payload?.summary || null;
                state.lastRefresh = Date.now();
            })
            .addCase(fetchStudents.rejected, (state, action) => {
                state.studentsLoading = false;
                state.studentsError = action.payload;
            })
            // Fetch student by ID
            .addCase(fetchStudentById.pending, (state) => {
                state.selectedStudentLoading = true;
                state.selectedStudentError = null;
            })
            .addCase(fetchStudentById.fulfilled, (state, action) => {
                state.selectedStudentLoading = false;
                state.selectedStudent = action.payload?.student || action.payload;
            })
            .addCase(fetchStudentById.rejected, (state, action) => {
                state.selectedStudentLoading = false;
                state.selectedStudentError = action.payload;
            })
            // Fetch strategies
            .addCase(fetchMtssStrategies.pending, (state) => {
                state.strategiesLoading = true;
                state.strategiesError = null;
            })
            .addCase(fetchMtssStrategies.fulfilled, (state, action) => {
                state.strategiesLoading = false;
                state.strategies = action.payload || [];
            })
            .addCase(fetchMtssStrategies.rejected, (state, action) => {
                state.strategiesLoading = false;
                state.strategiesError = action.payload;
            })
            // Fetch assignments
            .addCase(fetchAssignments.pending, (state) => {
                state.assignmentsLoading = true;
                state.assignmentsError = null;
            })
            .addCase(fetchAssignments.fulfilled, (state, action) => {
                state.assignmentsLoading = false;
                state.assignments = action.payload || [];
            })
            .addCase(fetchAssignments.rejected, (state, action) => {
                state.assignmentsLoading = false;
                state.assignmentsError = action.payload;
            })
            // Create intervention plan
            .addCase(createInterventionPlan.pending, (state) => {
                state.interventionSubmitting = true;
                state.interventionError = null;
                state.interventionSuccess = false;
            })
            .addCase(createInterventionPlan.fulfilled, (state, action) => {
                state.interventionSubmitting = false;
                state.interventionSuccess = true;
                state.interventionForm = createDefaultInterventionForm();
                // Add new assignment to list
                if (action.payload) {
                    state.assignments = [action.payload, ...state.assignments];
                }
            })
            .addCase(createInterventionPlan.rejected, (state, action) => {
                state.interventionSubmitting = false;
                state.interventionError = action.payload;
            })
            // Submit progress update
            .addCase(submitProgressUpdate.pending, (state) => {
                state.progressSubmitting = true;
                state.progressError = null;
                state.progressSuccess = false;
            })
            .addCase(submitProgressUpdate.fulfilled, (state, action) => {
                state.progressSubmitting = false;
                state.progressSuccess = true;
                state.progressForm = createDefaultProgressForm();
                // Update assignment in list
                if (action.payload?._id) {
                    const idx = state.assignments.findIndex((a) => a._id === action.payload._id);
                    if (idx !== -1) {
                        state.assignments[idx] = action.payload;
                    }
                }
            })
            .addCase(submitProgressUpdate.rejected, (state, action) => {
                state.progressSubmitting = false;
                state.progressError = action.payload;
            });
    },
});

// Export actions
export const {
    updateInterventionForm,
    setInterventionForm,
    resetInterventionForm,
    updateProgressForm,
    setProgressForm,
    resetProgressForm,
    clearInterventionError,
    clearProgressError,
    clearStudentError,
    setSelectedStudentFromList,
    clearSelectedStudent,
    prefillInterventionFromStudent,
} = mtssSlice.actions;

// Selectors
export const selectStudents = (state) => state.mtss.students;
export const selectStudentsLoading = (state) => state.mtss.studentsLoading;
export const selectStudentsError = (state) => state.mtss.studentsError;
export const selectStudentsSummary = (state) => state.mtss.studentsSummary;
export const selectSelectedStudent = (state) => state.mtss.selectedStudent;
export const selectSelectedStudentLoading = (state) => state.mtss.selectedStudentLoading;
export const selectStrategies = (state) => state.mtss.strategies;
export const selectStrategiesLoading = (state) => state.mtss.strategiesLoading;
export const selectAssignments = (state) => state.mtss.assignments;
export const selectInterventionForm = (state) => state.mtss.interventionForm;
export const selectInterventionSubmitting = (state) => state.mtss.interventionSubmitting;
export const selectInterventionError = (state) => state.mtss.interventionError;
export const selectInterventionSuccess = (state) => state.mtss.interventionSuccess;
export const selectProgressForm = (state) => state.mtss.progressForm;
export const selectProgressSubmitting = (state) => state.mtss.progressSubmitting;
export const selectProgressError = (state) => state.mtss.progressError;
export const selectProgressSuccess = (state) => state.mtss.progressSuccess;

export default mtssSlice.reducer;
