const express = require('express');
const router = express.Router();
const {
    getUserNotifications,
    getNotificationStats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createSystemNotification,
    // createSupportRequestNotification, // Feature 2 disabled 2026-09-07 - see below
    // handleSlackAction, // Feature 2 disabled 2026-09-07 - see below
} = require('../controllers/notificationController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateQuery } = require('../middleware/validation');
const {
    getNotificationPreferences,
    updateNotificationPreferences,
} = require('../controllers/notificationPreferenceController');

// All notification routes require authentication
router.use(authenticate);

// Get user's notifications with pagination and filtering
router.get('/', validateQuery({
    page: 'number',
    limit: 'number',
    isRead: 'boolean',
    category: 'string',
    priority: 'string'
}), getUserNotifications);

// Get notification statistics for the authenticated user
router.get('/stats', getNotificationStats);

// Mark a specific notification as read
router.patch('/:notificationId/read', markAsRead);

// Mark all notifications as read for the authenticated user
router.patch('/read-all', markAllAsRead);

// Delete a notification
router.delete('/:notificationId', deleteNotification);

// Admin-only routes for creating notifications
router.post('/system', requireAdmin, createSystemNotification);
// Feature 2 disabled 2026-09-07: support-request notifications reference
// EmotionalCheckin/StudentEmotionalCheckin, which MTSS shouldn't read
// directly (Central-source-of-truth rule) - see routes/index.js for the
// fuller note.
// router.post('/support-request', requireAdmin, createSupportRequestNotification);

// Notification preferences (teacher alert delivery settings)
router.get('/preferences', getNotificationPreferences);
router.put('/preferences', updateNotificationPreferences);

// Slack interactive actions (no authentication required for Slack webhooks)
// router.post('/slack/actions', handleSlackAction);

module.exports = router;