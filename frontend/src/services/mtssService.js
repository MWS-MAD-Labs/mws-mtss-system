import api from './authService';
import { getApiBaseUrl } from '@/lib/apiBase';

const withData = (response) => response?.data?.data || {};

const withConfig = (config = {}, params = {}) => ({ params, ...config });
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_EDGE = 1600;
const IMAGE_QUALITY = 0.82;

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
    api.post('/mtss/pilot-feedback', payload, { skipGlobalLoading: true, ...config }).then(withData);

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

const loadImageForUpload = (file) => {
    if (typeof createImageBitmap === 'function') {
        return createImageBitmap(file);
    }

    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Unable to read image'));
        };
        image.src = url;
    });
};

const canvasToBlob = (canvas, type, quality) =>
    new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Unable to prepare image upload'));
        }, type, quality);
    });

const withExtension = (name = 'evidence-image', extension = 'jpg') =>
    name.replace(/\.[^.]+$/, '') + `.${extension}`;

export const prepareEvidenceFileForUpload = async (file) => {
    if (!file || !IMAGE_TYPES.has(file.type) || typeof document === 'undefined') return file;

    let source;
    try {
        source = await loadImageForUpload(file);
        const sourceWidth = source.width || source.naturalWidth;
        const sourceHeight = source.height || source.naturalHeight;
        const longestEdge = Math.max(sourceWidth || 0, sourceHeight || 0);

        if (!longestEdge || longestEdge <= MAX_IMAGE_EDGE) return file;

        const scale = MAX_IMAGE_EDGE / longestEdge;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(sourceWidth * scale));
        canvas.height = Math.max(1, Math.round(sourceHeight * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return file;

        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        const outputType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
        const outputName = outputType === 'image/jpeg' ? withExtension(file.name, 'jpg') : file.name;
        const blob = await canvasToBlob(canvas, outputType, IMAGE_QUALITY);
        return new File([blob], outputName, { type: outputType, lastModified: file.lastModified });
    } catch {
        return file;
    } finally {
        source?.close?.();
    }
};

export const getUploadedEvidence = (uploadResult = {}) =>
    uploadResult?.data?.evidence ||
    uploadResult?.data?.data?.evidence ||
    uploadResult?.evidence ||
    [];

export const uploadEvidence = async (files, onProgress) => {
    const normalizedFiles = normalizeEvidenceFiles(files);
    const preparedFiles = await Promise.all(normalizedFiles.map(prepareEvidenceFileForUpload));

    return new Promise((resolve, reject) => {
        if (!preparedFiles.length) {
            reject(new Error('No readable evidence files selected'));
            return;
        }
        const xhr = new XMLHttpRequest();
        const fd = new FormData();
        preparedFiles.forEach((f) => fd.append('evidence', f));
        xhr.open('POST', `${getApiBaseUrl()}/mtss/upload-evidence`);
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
                if (xhr.status === 413) {
                    message = 'Upload is larger than the server limit. Please upload files up to 5 MB each, max 5 files.';
                }
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
};

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
