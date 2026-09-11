const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserStudent = require('../models/UserStudent');
const { sendError } = require('../utils/response');
const { COOKIE_NAME } = require('../utils/authCookie');
const {
    buildDashboardAccessProfile,
    buildMtssAccessProfile,
    hasMtssAccess,
    hasMtssAdminAccess,
    hasMtssWriteAccess
} = require('../utils/accessControl');

const buildRequestUser = (user) => {
    const dashboardAccess = buildDashboardAccessProfile(user);
    const mtssAccess = buildMtssAccessProfile(user);

    return {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        username: user.username,
        department: user.department,
        jobLevel: user.jobLevel,
        unit: user.unit,
        jobPosition: user.jobPosition,
        googleId: user.googleId,
        classes: user.classes || [],
        // Read by applyViewerScope/ensureStudentsWithinViewerScope for
        // se_teacher's per-student scoping (see mtssAccess.js) - without
        // this, every request saw an empty array here regardless of what
        // studentSupportAssignmentSync.js had actually synced onto the
        // stored User document, and se_teacher's roster/write-guard denied
        // everyone.
        supportedStudentIds: user.supportedStudentIds || [],
        currentGrade: user.currentGrade,
        className: user.className,
        nickname: user.nickname,
        gender: user.gender || '',
        joinAcademicYear: user.joinAcademicYear,
        reportsTo: user.reportsTo,
        subordinates: user.subordinates || [],
        dashboardRole: dashboardAccess.effectiveRole,
        dashboardAccess,
        mtssRole: mtssAccess.effectiveRole,
        mtssAccess
    };
};

const resolveUserByRoleAndId = async (role, userId) => {
    let user = null;
    if (role === 'student') {
        user = await UserStudent.findById(userId);
    }
    if (!user) {
        user = await User.findById(userId);
    }
    return user;
};

// JWT Authentication Middleware
const authenticate = async (req, res, next) => {
    try {
        // Cookie first - the browser's own session, now that the token
        // lives in an httpOnly cookie instead of localStorage (see
        // utils/authCookie.js). The Authorization header stays supported
        // for non-browser callers, like the daily-checkin AI-chat proxy's
        // own outbound service token.
        const authHeader = req.headers.authorization;
        const cookieToken = req.cookies?.[COOKIE_NAME];

        let token;
        if (cookieToken) {
            token = cookieToken;
        } else if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else {
            return sendError(res, 'Access token required', 401);
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user exists and is active
        const user = await resolveUserByRoleAndId(decoded.role, decoded.userId);
        if (!user || !user.isActive) {
            return sendError(res, 'User not found or inactive', 401);
        }

        // A token minted before this field existed has no sessionVersion
        // claim at all - treat that as 0 rather than rejecting every
        // already-issued session the moment this deploys. Mismatch means
        // Hub's back-channel logout (routes/auth.js's /auth/revoke-session)
        // bumped the stored value since this token was signed.
        if ((decoded.sessionVersion || 0) !== (user.sessionVersion || 0)) {
            return sendError(res, 'Session has been revoked', 401);
        }

        // Attach user to request object
        req.user = buildRequestUser(user);

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return sendError(res, 'Token expired', 401);
        } else if (error.name === 'JsonWebTokenError') {
            return sendError(res, 'Invalid token', 401);
        }

        console.error('Auth middleware error:', error);
        return sendError(res, 'Authentication failed', 500);
    }
};

// Service-to-service authentication for the daily-checkin AI-chat proxy.
// daily-checkin and MTSS have separate MongoDBs (split 2026-09-08), so a
// user's ObjectId in one is meaningless in the other - the regular
// authenticate() above (User.findById(decoded.userId)) can't be reused for
// a request forwarded from daily-checkin's backend. This verifies a
// short-lived token signed with a dedicated shared secret (never the
// user-facing JWT_SECRET) carrying only an email claim, and resolves the
// real MTSS user by email instead - the one identifier that's guaranteed
// to mean the same person in both databases.
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

        const user = await User.findOne({ email: decoded.email });
        if (!user || !user.isActive) {
            return sendError(res, 'User not found or inactive', 401);
        }

        req.user = buildRequestUser(user);
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

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return sendError(res, 'Authentication required', 401);
        }

        if (!roles.includes(req.user.role)) {
            return sendError(res, 'Insufficient permissions', 403);
        }

        next();
    };
};

// Admin and above roles
const requireAdmin = authorize('admin', 'superadmin', 'directorate');
const requireMTSSAdmin = authorize('admin', 'superadmin', 'directorate', 'head_unit');
const requireMTSSAccess = (req, res, next) => {
    if (!req.user) {
        return sendError(res, 'Authentication required', 401);
    }
    if (!hasMtssAccess(req.user)) {
        return sendError(res, 'You do not have access to MTSS.', 403);
    }
    next();
};

const requireMTSSWriteAccess = (req, res, next) => {
    if (!req.user) {
        return sendError(res, 'Authentication required', 401);
    }
    if (!hasMtssWriteAccess(req.user)) {
        return sendError(res, 'You do not have write access to MTSS.', 403);
    }
    next();
};

const requireScopedMTSSAdmin = (req, res, next) => {
    if (!req.user) {
        return sendError(res, 'Authentication required', 401);
    }
    if (!hasMtssAdminAccess(req.user)) {
        return sendError(res, 'You do not have admin access to MTSS.', 403);
    }
    next();
};

// Super admin and directorate only
const requireSuperAdmin = authorize('superadmin', 'directorate');

// Staff and teacher access (for their own data) - now includes student for Google OAuth users
const requireStaffOrTeacher = authorize('staff', 'teacher', 'admin', 'superadmin', 'directorate', 'student', 'support_staff', 'se_teacher', 'head_unit', 'counselor');
const requireTeacherAccess = authorize('teacher', 'se_teacher');

// Any authenticated user
const requireAuthenticated = (req, res, next) => {
    if (!req.user) {
        return sendError(res, 'Authentication required', 401);
    }
    next();
};

module.exports = {
    authenticate,
    authenticateServiceRelay,
    authorize,
    requireAdmin,
    requireMTSSAdmin,
    requireMTSSAccess,
    requireMTSSWriteAccess,
    requireScopedMTSSAdmin,
    requireSuperAdmin,
    requireStaffOrTeacher,
    requireTeacherAccess,
    requireAuthenticated,
    buildRequestUser
};
