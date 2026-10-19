const { sendError } = require('../utils/response');
const { hubSession } = require('../utils/hubSession');
const { resolveSessionUser } = require('../utils/hubSessionUser');
const { resolveMtssScope } = require('../utils/accessScope');
const { actorKind } = require('../utils/actorKind');
const { PERMISSIONS } = require('../constants/permissions');
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

// MTSS is read, written and administered through three permissions that build on each other.
const requireMtssRead = requirePermission(PERMISSIONS.MTSS_READ);
const requireMtssWrite = requirePermission(PERMISSIONS.MTSS_WRITE);
const requireMtssAdmin = requirePermission(PERMISSIONS.MTSS_ADMIN);

module.exports = {
    authenticate,
    buildRequestUser,
    requirePermission,
    requireAnyPermission,
    requireMtssRead,
    requireMtssWrite,
    requireMtssAdmin,
};
