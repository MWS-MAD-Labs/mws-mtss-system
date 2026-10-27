const { app } = require('../../src/app');
const { PERMISSION_VALUES } = require('../../src/constants/permissions');

// Routes that need no permission: they are public, or only say who the caller is.
const OPEN = new Set([
    'GET /sso',
    'GET /me',
    'GET /public',
    'GET /health',
    'GET /ready',
    // Each person's own notifications, always filtered to the caller.
    'GET /',
    'GET /stats',
    'PATCH /:notificationId/read',
    'PATCH /read-all',
    'DELETE /:notificationId',
    'GET /preferences',
    'PUT /preferences',
]);

// Permissions no route asks for: the screens use them, or they only widen what a route returns (utils/accessScope.js).
const SCREEN_ONLY = new Set([
    'mtss.scope.unit',
    'mtss.scope.all',
    'emotional-dashboard.read',
    'hub.support.access',
]);

function walk(stack, inherited, found) {
    let guarded = inherited;
    for (const layer of stack) {
        if (layer.route) {
            const own = layer.route.stack.some((handler) => handler.handle.permissions);
            for (const method of Object.keys(layer.route.methods)) {
                found.push({ key: `${method.toUpperCase()} ${layer.route.path}`, guarded: guarded || own });
            }
            layer.route.stack.forEach((handler) => handler.handle.permissions && found.permissions.push(...handler.handle.permissions));
        } else if (layer.handle?.permissions) {
            guarded = true;
            found.permissions.push(...layer.handle.permissions);
        } else if (layer.handle?.stack) {
            walk(layer.handle.stack, guarded, found);
        }
    }
}

describe('route permissions', () => {
    const found = [];
    found.permissions = [];
    walk(app.router.stack, false, found);

    test('every route asks for a permission or is on the open list', () => {
        const bare = found.filter((route) => !route.guarded && !OPEN.has(route.key)).map((route) => route.key);
        expect(bare).toEqual([]);
    });

    test('every permission is asked for by a route or a screen', () => {
        const used = new Set([...found.permissions, ...SCREEN_ONLY]);
        const unused = PERMISSION_VALUES.filter((permission) => !used.has(permission));
        expect(unused).toEqual([]);
    });
});
