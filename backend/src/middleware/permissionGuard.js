const { sendError } = require('../utils/response');

// A route is gated by what Central gave the person, never by a role kept here. The guard remembers what it asks for
// so a test can walk the routes and check that every one has one.
const requireAnyPermission = (...permissions) => {
    const guard = (req, res, next) => {
        if (!req.user) return sendError(res, 'Authentication required', 401);
        const held = Array.isArray(req.user.permissions) ? req.user.permissions : [];
        if (!permissions.some((permission) => held.includes(permission))) {
            return sendError(res, 'Insufficient permissions', 403);
        }
        next();
    };
    guard.permissions = permissions;
    return guard;
};

const requirePermission = (permission) => requireAnyPermission(permission);

module.exports = { requirePermission, requireAnyPermission };
