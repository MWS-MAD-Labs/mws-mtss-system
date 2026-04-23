import api from './authService';

const withData = (response) => response?.data?.data || {};
const CHAT_REQUEST_CONFIG = { skipGlobalLoading: true };

/**
 * Send a message to AI and get response
 */
export const sendChatMessage = (message, sessionId = null) =>
    api.post('/ai-chat/message', { message, sessionId }, CHAT_REQUEST_CONFIG).then(response => response.data);

/**
 * Get conversation history
 */
export const getConversationHistory = (sessionId, limit = 50) =>
    api.get(`/ai-chat/conversations/${sessionId}`, { params: { limit }, ...CHAT_REQUEST_CONFIG }).then(withData);

/**
 * Get user's recent conversations
 */
export const getUserConversations = (limit = 10) =>
    api.get('/ai-chat/conversations', { params: { limit }, ...CHAT_REQUEST_CONFIG }).then(withData);

/**
 * Start a new conversation
 */
export const startNewConversation = () =>
    api.post('/ai-chat/conversations/new', {}, CHAT_REQUEST_CONFIG).then(withData);

/**
 * Archive a conversation
 */
export const archiveConversation = (sessionId) =>
    api.post(`/ai-chat/conversations/${sessionId}/archive`, {}, CHAT_REQUEST_CONFIG).then(response => response.data);

/**
 * Get personal assistant profile + daily focus
 */
export const getAssistantProfile = () =>
    api.get('/ai-chat/assistant-profile', CHAT_REQUEST_CONFIG).then(withData);

/**
 * Update personal assistant preferences
 */
export const updateAssistantProfile = (payload = {}) =>
    api.patch('/ai-chat/assistant-profile', payload, CHAT_REQUEST_CONFIG).then(withData);

/**
 * Execute whitelisted assistant automation operation
 */
export const executeAssistantOperation = (operation, payload = {}, sessionId = null) =>
    api.post('/ai-chat/execute-operation', { operation, payload, sessionId }, CHAT_REQUEST_CONFIG).then(withData);

export default {
    sendChatMessage,
    getConversationHistory,
    getUserConversations,
    startNewConversation,
    archiveConversation,
    getAssistantProfile,
    updateAssistantProfile,
    executeAssistantOperation
};
