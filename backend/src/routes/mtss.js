const express = require('express');
const router = express.Router();

const {
    getTierMetadata,
    upsertTier,
    getStrategies,
    getStrategyById,
    createStrategy,
    updateStrategy,
    deleteStrategy,
    createMentorAssignment,
    getMentorAssignments,
    getAssignmentsNeedingReassignment,
    getMentorAssignmentById,
    updateMentorAssignment,
    getMyAssignedStudents,
    listMentors
} = require('../controllers/mtssController');
const {
    upsertPilotFeedbackSession,
    listPilotFeedbackSessions
} = require('../controllers/mtssPilotFeedbackController');
const {
    listStudents,
    getStudent,
    createStudent,
    updateStudent
} = require('../controllers/mtssStudentController');

const multer = require('multer');
const { uploadEvidence } = require('../controllers/mtssUploadController');
const { ALLOWED_TYPES, MAX_FILE_SIZE, MAX_FILES } = require('../services/cloudinaryUploadService');

const evidenceUpload = multer({
    dest: 'uploads/',
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => cb(null, ALLOWED_TYPES.has(file.mimetype))
});

const {
    authenticate,
    requireMtssRead,
    requireMtssWrite,
    requireMtssAdmin
} = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
    mtssStrategyCreateSchema,
    mtssStrategyUpdateSchema,
    mentorAssignmentCreateSchema,
    mentorAssignmentUpdateSchema,
    mtssStudentCreateSchema,
    mtssStudentUpdateSchema
} = require('../utils/validationSchemas');

router.use(authenticate);

router.get('/tiers', requireMtssRead, getTierMetadata);
router.post('/tiers', requireMtssAdmin, upsertTier);

router.get('/strategies', requireMtssRead, getStrategies);
router.get('/strategies/:id', requireMtssRead, getStrategyById);
router.post('/strategies', requireMtssAdmin, validate(mtssStrategyCreateSchema), createStrategy);
router.put('/strategies/:id', requireMtssAdmin, validate(mtssStrategyUpdateSchema), updateStrategy);
router.delete('/strategies/:id', requireMtssAdmin, deleteStrategy);

router.get('/students', requireMtssRead, listStudents);
router.get('/students/:id', requireMtssRead, getStudent);
router.post('/students', requireMtssAdmin, validate(mtssStudentCreateSchema), createStudent);
router.put('/students/:id', requireMtssAdmin, validate(mtssStudentUpdateSchema), updateStudent);

router.get('/mentors', requireMtssAdmin, listMentors);

router.post('/pilot-feedback', requireMtssRead, upsertPilotFeedbackSession);
router.get('/pilot-feedback', requireMtssAdmin, listPilotFeedbackSessions);

router.post('/upload-evidence', requireMtssWrite, evidenceUpload.array('evidence', MAX_FILES), uploadEvidence);

router.get('/mentor-assignments', requireMtssRead, getMentorAssignments);
// Must come before the /:id route below - same path shape, and Express
// matches registration order, so /:id would otherwise swallow this first.
router.get('/mentor-assignments/needs-reassignment', requireMtssAdmin, getAssignmentsNeedingReassignment);
router.get('/mentor-assignments/:id', requireMtssRead, getMentorAssignmentById);
// Allow teachers to create intervention plans for students (they must assign themselves as mentor)
router.post('/mentor-assignments', requireMtssWrite, validate(mentorAssignmentCreateSchema), createMentorAssignment);
router.put('/mentor-assignments/:id', requireMtssWrite, validate(mentorAssignmentUpdateSchema), updateMentorAssignment);
router.get('/mentor-assignments/my/students', requireMtssRead, getMyAssignedStudents);

module.exports = router;
