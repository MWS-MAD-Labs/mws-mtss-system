const express = require('express');
const router = express.Router();
const devTopologyController = require('../controllers/devTopologyController');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../constants/permissions');

router.use(authenticate);
router.use(requirePermission(PERMISSIONS.DEV_TOPOLOGY_READ));

router.get('/snapshot', devTopologyController.getSnapshot);
router.get('/health', devTopologyController.getHealth);

module.exports = router;
