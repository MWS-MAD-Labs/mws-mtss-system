import api from './authService';

// The sync with Central runs by itself on the server. This only reads how it is doing.
export const getSyncStatus = async () => {
    const response = await api.get('/sync/status', { skipGlobalLoading: true });
    return response.data?.data || null;
};
