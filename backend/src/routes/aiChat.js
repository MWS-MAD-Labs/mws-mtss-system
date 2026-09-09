const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { authenticate, authenticateServiceRelay } = require('../middleware/auth');
const aiChatController = require('../controllers/aiChatController');
const devTopologyTelemetryService = require('../services/devTopologyTelemetryService');

// All routes require authentication - either a real MTSS user session, or
// (for now) a forwarded request from daily-checkin's AI-chat proxy, which
// carries its own separately-signed service token instead of an MTSS
// session cookie/JWT. Tries the user session first since that's the
// overwhelmingly common caller; falls back to the service-relay check only
// when there's no ordinary Bearer JWT to verify in the first place, so a
// genuinely invalid user token still fails as "invalid token", not a
// confusing "service token required".
router.use((req, res, next) => {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        return authenticate(req, res, next);
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
        decoded = jwt.decode(token);
    } catch (error) {
        decoded = null;
    }

    if (decoded && decoded.source === 'daily-checkin') {
        return authenticateServiceRelay(req, res, next);
    }

    return authenticate(req, res, next);
});

/**
 * @route   POST /api/v1/ai-chat/message
 * @desc    Send a message and get AI response
 * @access  Private (authenticated users only)
 */
router.post('/message', devTopologyTelemetryService.instrumentedHandler('ai_chat_message', aiChatController.sendMessage));

/**
 * @route   GET /api/v1/ai-chat/conversations
 * @desc    Get user's recent conversations
 * @access  Private
 */
router.get('/conversations', aiChatController.getUserConversations);

/**
 * @route   POST /api/v1/ai-chat/conversations/new
 * @desc    Start a new conversation
 * @access  Private
 */
router.post('/conversations/new', aiChatController.startNewConversation);

/**
 * @route   GET /api/v1/ai-chat/conversations/:sessionId
 * @desc    Get conversation history by session ID
 * @access  Private
 */
router.get('/conversations/:sessionId', aiChatController.getConversationHistory);

/**
 * @route   POST /api/v1/ai-chat/conversations/:sessionId/archive
 * @desc    Archive a conversation
 * @access  Private
 */
router.post('/conversations/:sessionId/archive', aiChatController.archiveConversation);

/**
 * @route   GET /api/v1/ai-chat/assistant-profile
 * @desc    Get personal assistant profile and daily focus
 * @access  Private (all authenticated roles)
 */
router.get('/assistant-profile', devTopologyTelemetryService.instrumentedHandler('ai_chat_assistant_profile', aiChatController.getAssistantProfile));

/**
 * @route   PATCH /api/v1/ai-chat/assistant-profile
 * @desc    Update personal assistant preferences
 * @access  Private (all authenticated roles)
 */
router.patch('/assistant-profile', aiChatController.updateAssistantProfile);

/**
 * @route   POST /api/v1/ai-chat/execute-operation
 * @desc    Execute whitelisted assistant automation operation
 * @access  Private (authenticated users)
 */
router.post('/execute-operation', devTopologyTelemetryService.instrumentedHandler('ai_chat_execute_operation', aiChatController.executeOperation));

/**
 * @route   POST /api/v1/ai-chat/feedback
 * @desc    Submit feedback for an assistant response
 * @access  Private (authenticated users)
 */
router.post('/feedback', aiChatController.submitFeedback);

module.exports = router;
