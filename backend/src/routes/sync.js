const express = require('express');
const router = express.Router();
const { getSyncStatus, triggerSync } = require('../controllers/syncController');
const { authenticate } = require('../middleware/auth');

// Any logged-in user can view status or trigger a sync - not admin-gated.
// The shared cooldown (syncController.js) is what actually prevents spam.
router.use(authenticate);

router.get('/status', getSyncStatus);
router.post('/trigger', triggerSync);

module.exports = router;
