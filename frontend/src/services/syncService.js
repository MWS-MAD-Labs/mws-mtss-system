import api from './authService';

export const getSyncStatus = () => api.get('/sync/status');

export const triggerSync = () => api.post('/sync/trigger');
