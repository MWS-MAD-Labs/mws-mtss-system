import api from './authService';

const withData = (response) => response?.data?.data || {};

const withConfig = (config = {}, params = {}) => ({ params, ...config });

export const fetchMentorAssignments = (params = {}, config = {}) =>
    api.get('/mtss/mentor-assignments', withConfig(config, params)).then(withData);

export const fetchMyAssignedStudents = (config = {}) =>
    api.get('/mtss/mentor-assignments/my/students', config).then(withData);

export const fetchTierMetadata = (config = {}) => api.get('/mtss/tiers', config).then(withData);

export const fetchStrategies = (params = {}, config = {}) =>
    api.get('/mtss/strategies', withConfig(config, params)).then(withData);

export const fetchMtssStudents = (params = {}, config = {}) =>
    api.get('/mtss/students', withConfig(config, params)).then(withData);

export const fetchMtssStudentById = (id, config = {}) => api.get(`/mtss/students/${id}`, config).then(withData);

export const fetchMtssMentors = (params = {}, config = {}) =>
    api.get('/mtss/mentors', withConfig(config, params)).then(withData);

export const upsertPilotFeedbackSession = (payload, config = {}) =>
    api.post('/mtss/pilot-feedback', payload, config).then(withData);

export const fetchPilotFeedbackSessions = (params = {}, config = {}) =>
    api.get('/mtss/pilot-feedback', withConfig(config, params)).then(withData);

export const createMentorAssignment = (payload, config = {}) =>
    api.post('/mtss/mentor-assignments', payload, config).then(withData);

export const updateMentorAssignment = (id, payload, config = {}) =>
    api.put(`/mtss/mentor-assignments/${id}`, payload, config).then(withData);

export const normalizeEvidenceFiles = (files = []) =>
    files
        .map((entry) => entry?.file || entry)
        .filter(Boolean);

export const getUploadedEvidence = (uploadResult = {}) =>
    uploadResult?.data?.evidence ||
    uploadResult?.data?.data?.evidence ||
    uploadResult?.evidence ||
    [];

export const uploadEvidence = (files, onProgress) =>
    new Promise((resolve, reject) => {
        const normalizedFiles = normalizeEvidenceFiles(files);
        if (!normalizedFiles.length) {
            reject(new Error('No readable evidence files selected'));
            return;
        }
        const xhr = new XMLHttpRequest();
        const fd = new FormData();
        normalizedFiles.forEach((f) => fd.append('evidence', f));
        xhr.open('POST', `${import.meta.env.VITE_API_BASE || '/api/v1'}/mtss/upload-evidence`);
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try { resolve(JSON.parse(xhr.responseText)); } catch { reject(new Error('Invalid response')); }
            } else {
                let message = `Upload failed (${xhr.status})`;
                try {
                    const payload = JSON.parse(xhr.responseText);
                    message = payload?.message || payload?.errors?.join?.(', ') || message;
                } catch { /* use default message */ }
                reject(new Error(message));
            }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(fd);
    });

export const uploadEvidenceAttachments = async (files = [], onProgress) => {
    if (!files.length) return [];
    const uploadResult = await uploadEvidence(files, onProgress);
    const evidence = getUploadedEvidence(uploadResult);
    if (!evidence.length) {
        throw new Error('Evidence upload completed without saved files. Please try again.');
    }
    return evidence;
};

export default {
    fetchMentorAssignments,
    fetchMyAssignedStudents,
    fetchTierMetadata,
    fetchStrategies,
    fetchMtssStudents,
    fetchMtssStudentById,
    fetchMtssMentors,
    upsertPilotFeedbackSession,
    fetchPilotFeedbackSessions,
    createMentorAssignment,
    updateMentorAssignment,
    uploadEvidence,
    uploadEvidenceAttachments,
};
