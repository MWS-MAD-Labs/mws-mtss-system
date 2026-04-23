import api from './authService';

const withData = (response) => response?.data?.data || {};

/**
 * Get AI insights for a specific student
 */
export const getStudentInsights = (studentId, timeRange = 30) =>
    api.get(`/ai-insights/students/${studentId}/insights`, { params: { timeRange } }).then(withData);

/**
 * Generate alerts for a student (manual trigger)
 */
export const generateAlertsForStudent = (studentId) =>
    api.post(`/ai-insights/students/${studentId}/generate-alerts`).then(withData);

/**
 * Get all alerts for current teacher
 */
export const getMyAlerts = (params = {}) =>
    api.get('/ai-insights/alerts', { params }).then(withData);

/**
 * Get alerts for a specific student
 */
export const getStudentAlerts = (studentId, status = null) =>
    api.get(`/ai-insights/alerts/student/${studentId}`, { params: { status } }).then(withData);

/**
 * Mark alert as read
 */
export const markAlertAsRead = (alertId) =>
    api.patch(`/ai-insights/alerts/${alertId}/read`).then(withData);

/**
 * Add action to alert
 */
export const addAlertAction = (alertId, action, description) =>
    api.post(`/ai-insights/alerts/${alertId}/actions`, { action, description }).then(withData);

/**
 * Resolve alert
 */
export const resolveAlert = (alertId, resolutionNote) =>
    api.patch(`/ai-insights/alerts/${alertId}/resolve`, { resolutionNote }).then(withData);

/**
 * Dismiss alert
 */
export const dismissAlert = (alertId, reason) =>
    api.patch(`/ai-insights/alerts/${alertId}/dismiss`, { reason }).then(withData);

/**
 * Get alert statistics
 */
export const getAlertStatistics = (timeRange = 30) =>
    api.get('/ai-insights/alerts/statistics', { params: { timeRange } }).then(withData);

/**
 * Batch generate alerts (admin only)
 */
export const batchGenerateAlerts = () =>
    api.post('/ai-insights/batch-generate-alerts').then(withData);

export default {
    getStudentInsights,
    generateAlertsForStudent,
    getMyAlerts,
    getStudentAlerts,
    markAlertAsRead,
    addAlertAction,
    resolveAlert,
    dismissAlert,
    getAlertStatistics,
    batchGenerateAlerts
};
