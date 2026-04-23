import api from './authService';

const REQUEST_CONFIG = { skipGlobalLoading: true };

const toBooleanQuery = (value) => {
    if (value === true) return 'true';
    if (value === false) return 'false';
    return undefined;
};

const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toText = (value) => String(value || '').trim();

const extractData = (response) => response?.data?.data || {};

export const getNotifications = async (options = {}) => {
    const params = {
        page: toNumber(options.page, 1),
        limit: toNumber(options.limit, 40),
        category: toText(options.category) || undefined,
        priority: toText(options.priority) || undefined,
        isRead: toBooleanQuery(options.isRead)
    };

    const response = await api.get('/notifications', { params, ...REQUEST_CONFIG });
    const data = extractData(response);

    return {
        notifications: Array.isArray(data.notifications) ? data.notifications : [],
        pagination: data.pagination || {
            page: params.page,
            limit: params.limit,
            total: Array.isArray(data.notifications) ? data.notifications.length : 0,
            pages: 1
        }
    };
};

export const getNotificationStats = async () => {
    const response = await api.get('/notifications/stats', REQUEST_CONFIG);
    return extractData(response);
};

export const markNotificationAsRead = async (notificationId) => {
    const id = toText(notificationId);
    if (!id) throw new Error('notificationId is required');
    const response = await api.patch(`/notifications/${id}/read`, {}, REQUEST_CONFIG);
    return extractData(response);
};

export const markAllNotificationsAsRead = async () => {
    const response = await api.patch('/notifications/read-all', {}, REQUEST_CONFIG);
    return extractData(response);
};

export const deleteNotificationById = async (notificationId) => {
    const id = toText(notificationId);
    if (!id) throw new Error('notificationId is required');
    const response = await api.delete(`/notifications/${id}`, REQUEST_CONFIG);
    return extractData(response);
};

export default {
    getNotifications,
    getNotificationStats,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById
};
