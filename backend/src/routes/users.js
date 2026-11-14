const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUserById,
    getOrganizationStructure
} = require('../controllers/userController');
const { authenticate, requirePermission } = require('../middleware/auth');
const { validateQuery } = require('../middleware/validation');
const { paginationSchema } = require('../utils/validationSchemas');
const { PERMISSIONS } = require('../constants/permissions');

// The people of MTSS come from Central and are only read here.
router.use(authenticate);

const canReadUsers = requirePermission(PERMISSIONS.USERS_READ);

// Get organization structure
router.get('/organization', canReadUsers, getOrganizationStructure);

// Get all people with filtering and pagination
router.get('/', canReadUsers, validateQuery(paginationSchema), getUsers);

// Get a person by ID
router.get('/:id', canReadUsers, getUserById);

module.exports = router;
