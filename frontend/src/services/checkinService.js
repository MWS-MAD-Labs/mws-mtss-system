import api from './authService';

// Check-in API functions
export const submitCheckin = async (checkinData) => {
    const response = await api.post('/checkin/submit', checkinData);
    return response;
};

export const getTodayCheckin = async () => {
    const response = await api.get('/checkin/today');
    return response;
};

export const getCheckinResults = async (checkinId) => {
    const response = await api.get(`/checkin/results/${checkinId}`);
    return response;
};

export const getCheckinHistory = async (page = 1, limit = 10, userId = null, { startDate, endDate } = {}) => {
    const params = { page, limit };
    if (userId) params.userId = userId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/checkin/history', { params });
    return response;
};

export const getTodayCheckinStatus = async () => {
    const response = await api.get('/checkin/today/status');
    const normalizedStatus = response?.data?.data?.status || response?.data?.status;
    if (normalizedStatus && !response.data.status) {
        response.data.status = normalizedStatus;
    }
    return response;
};

export const getPersonalDashboard = async () => {
    const response = await api.get('/checkin/personal/dashboard');
    return response;
};

export const getTeacherDailyCheckins = async (date = null, options = {}) => {
    const params = {};
    if (date) {
        params.date = date;
    }
    if (options.grade) {
        params.grade = options.grade;
    }
    if (options.className) {
        params.className = options.className;
    }
    if (options.unit) {
        params.unit = options.unit;
    }
    const response = await api.get('/checkin/teacher/dashboard', { params });
    return response;
};

// Default export for backward compatibility
const checkinService = {
    submitCheckin,
    getTodayCheckin,
    getCheckinResults,
    getCheckinHistory,
    getTodayCheckinStatus,
    getPersonalDashboard,
    getTeacherDailyCheckins
};

export default checkinService;
