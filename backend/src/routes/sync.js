const express = require('express');
const router = express.Router();
const { getSyncStatus } = require('../controllers/syncController');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../constants/permissions');

// MTSS syncs with Central by itself (jobs/centralSync.js). There is nothing to trigger, only to look at.
router.use(authenticate);

router.get('/status', requirePermission(PERMISSIONS.SYNC_READ), getSyncStatus);

module.exports = router;
