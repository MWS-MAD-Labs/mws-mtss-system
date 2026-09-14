import api from './authService';

// skipGlobalLoading: the status check fires silently every time the quick
// menu opens - without this it flashes the app-wide loading overlay on
// every single open, which reads as the whole page flickering.
export const getSyncStatus = () => api.get('/sync/status', { skipGlobalLoading: true });

export const triggerSync = () => api.post('/sync/trigger', {}, { skipGlobalLoading: true });
