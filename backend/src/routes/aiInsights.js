const express = require('express');
const router = express.Router();
const aiInsightController = require('../controllers/aiInsightController');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../constants/permissions');
const devTopologyTelemetryService = require('../services/devTopologyTelemetryService');

/**
 * AI Insights Routes - Phase 2
 * Pattern detection, learning style profiling, and teacher alerts
 */

// Get insights for a specific student (teachers/mentors only)
router.get(
    '/students/:studentId/insights',
    authenticate,
    requirePermission(PERMISSIONS.AI_INSIGHTS_READ),
    devTopologyTelemetryService.instrumentedHandler('ai_insights_student_insights', aiInsightController.getStudentInsights)
);

// Generate alerts for a specific student (manual trigger)
router.post(
    '/students/:studentId/generate-alerts',
    authenticate,
    requirePermission(PERMISSIONS.AI_INSIGHTS_WRITE),
    devTopologyTelemetryService.instrumentedHandler('ai_insights_generate_alerts', aiInsightController.generateAlertsForStudent)
);

// Get all alerts for current teacher
router.get(
    '/alerts',
    authenticate,
    requirePermission(PERMISSIONS.AI_INSIGHTS_READ),
    devTopologyTelemetryService.instrumentedHandler('ai_insights_alert_list', aiInsightController.getMyAlerts)
);

// Get alerts for a specific student
router.get(
    '/alerts/student/:studentId',
    authenticate,
    requirePermission(PERMISSIONS.AI_INSIGHTS_READ),
    aiInsightController.getStudentAlerts
);

// Mark alert as read
router.patch(
    '/alerts/:alertId/read',
    authenticate,
    requirePermission(PERMISSIONS.AI_INSIGHTS_WRITE),
    aiInsightController.markAlertAsRead
);

// Add action to alert
router.post(
    '/alerts/:alertId/actions',
    authenticate,
    requirePermission(PERMISSIONS.AI_INSIGHTS_WRITE),
    aiInsightController.addAlertAction
);

// Resolve alert
router.patch(
    '/alerts/:alertId/resolve',
    authenticate,
    requirePermission(PERMISSIONS.AI_INSIGHTS_WRITE),
    aiInsightController.resolveAlert
);

// Dismiss alert
router.patch(
    '/alerts/:alertId/dismiss',
    authenticate,
    requirePermission(PERMISSIONS.AI_INSIGHTS_WRITE),
    aiInsightController.dismissAlert
);

// Get alert statistics
router.get(
    '/alerts/statistics',
    authenticate,
    requirePermission(PERMISSIONS.AI_INSIGHTS_READ),
    devTopologyTelemetryService.instrumentedHandler('ai_insights_alert_statistics', aiInsightController.getAlertStatistics)
);

// Batch generate alerts (admin only, for cron job)
router.post(
    '/batch-generate-alerts',
    authenticate,
    requirePermission(PERMISSIONS.MTSS_ADMIN),
    aiInsightController.batchGenerateAlerts
);

module.exports = router;
