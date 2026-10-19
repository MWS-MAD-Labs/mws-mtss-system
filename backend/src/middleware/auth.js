const jwt = require('jsonwebtoken');
const Person = require('../models/Person');
const { sendError } = require('../utils/response');
const { hubSession } = require('../utils/hubSession');
const { resolveSessionUser } = require('../utils/hubSessionUser');
const { resolveMtssScope } = require('../utils/accessScope');
const { actorKind } = require('../utils/actorKind');
const { PERMISSIONS } = require('../constants/permissions');
const { CENTRAL_STATUS } = require('../constants/person');
const { requirePermission, requireAnyPermission } = require('./permissionGuard');

// What the rest of the code sees of the person behind a request. `permissions` is what Central allows here and is
// the only thing a route or a data scope asks. `role` is a label (see utils/actorKind.js) for screens and the
// assistant, never an access check.
const buildRequestUser = (person) => {
    const user = {
        id: person._id,
        _id: person._id,
        centralPersonId: person.centralPersonId,
        personType: person.personType,
        email: person.email,
        name: person.name,
        username: person.username,
        nickname: person.nickname,
        gender: person.gender || '',
        employeeId: person.employeeId,
        department: person.department,
        unit: person.unit,
        jobLevel: person.jobLevel,
        jobPosition: person.jobPosition,
        isTeachingRole: Boolean(person.isTeachingRole),
        classes: person.classes || [],
        // Read by applyViewerScope for the students a special education teacher supports.
        supportedStudentIds: person.supportedStudentIds || [],
        currentGrade: person.currentGrade,
        className: person.className,
        joinAcademicYear: person.joinAcademicYear,
        permissions: person.centralEntitlementPermissions || [],
        entitlementRole: person.centralEntitlementRole || null,
        entitlementId: person.centralEntitlementId || null,
        entitlementVersion: person.centralEntitlementVersion ?? null,
        entitlementOrganizationId: person.centralEntitlementOrganizationId || null,
    };
    user.role = actorKind(user);
    user.mtssScope = resolveMtssScope(user);
    return user;
};

// Who is making the request: the Hub's access token (a cookie on the parent domain) says who they are, and Central
// says what they may do in this app. See utils/hubSession.js and utils/hubSessionUser.js.
const authenticate = async (req, res, next) => {
    try {
        const claims = await hubSession().fromCookieHeader(req.headers.cookie);
        if (!claims) {
            return sendError(res, 'Authentication required', 401);
        }

        const person = await resolveSessionUser(claims);
        if (!person) {
            return sendError(res, 'No access to MTSS', 403);
        }
        if (!person.isActive) {
            return sendError(res, 'Account is deactivated', 403);
        }

        req.user = buildRequestUser(person);
        req.hubClaims = claims;
        next();
    } catch (error) {
        console.error('Authentication error:', error.message);
        return sendError(res, 'Could not verify your access. Try again shortly.', 503);
    }
};

// Service-to-service authentication for the daily-checkin AI-chat proxy.
// daily-checkin and MTSS have separate MongoDBs (split 2026-09-08), so a
// person's ObjectId in one is meaningless in the other. This verifies a
// short-lived token signed with a dedicated shared secret (never a user
// session) carrying only an email claim, and resolves the real MTSS person by
// email instead - the one identifier that means the same person in both
// databases. The person still needs the access Central gave them here.
const authenticateServiceRelay = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendError(res, 'Service token required', 401);
        }

        const secret = process.env.AI_CHAT_PROXY_SECRET;
        if (!secret) {
            console.error('authenticateServiceRelay: AI_CHAT_PROXY_SECRET is not configured');
            return sendError(res, 'Service relay is not configured', 500);
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, secret);

        if (decoded.source !== 'daily-checkin' || !decoded.email) {
            return sendError(res, 'Invalid service token', 401);
        }

        const person = await Person.findOne({ email: String(decoded.email).trim().toLowerCase() });
        if (!person || !person.isActive || person.centralStatus !== CENTRAL_STATUS.ACTIVE) {
            return sendError(res, 'User not found or inactive', 401);
        }

        req.user = buildRequestUser(person);
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return sendError(res, 'Service token expired', 401);
        } else if (error.name === 'JsonWebTokenError') {
            return sendError(res, 'Invalid service token', 401);
        }

        console.error('authenticateServiceRelay error:', error);
        return sendError(res, 'Authentication failed', 500);
    }
};

// MTSS is read, written and administered through three permissions that build on each other.
const requireMtssRead = requirePermission(PERMISSIONS.MTSS_READ);
const requireMtssWrite = requirePermission(PERMISSIONS.MTSS_WRITE);
const requireMtssAdmin = requirePermission(PERMISSIONS.MTSS_ADMIN);

module.exports = {
    authenticate,
    authenticateServiceRelay,
    buildRequestUser,
    requirePermission,
    requireAnyPermission,
    requireMtssRead,
    requireMtssWrite,
    requireMtssAdmin,
};
