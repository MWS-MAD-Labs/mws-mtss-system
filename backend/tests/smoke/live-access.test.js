const { canJoin, userFromHandshake } = require('../../src/utils/socketAccess');
const { studentInViewerScope } = require('../../src/utils/insightAccess');
const { buildRequestUser } = require('../../src/middleware/auth');

const person = (permissions = [], over = {}) => ({
    _id: 'p1',
    personType: 'employee',
    isActive: true,
    unit: 'Junior High',
    centralEntitlementPermissions: permissions,
    ...over,
});
const user = (permissions = [], over = {}) => buildRequestUser(person(permissions, over));

describe('live rooms (socket access)', () => {
    test('own personal, dashboard and notification rooms only', () => {
        const me = user(['mtss.read']);
        for (const kind of ['dashboard', 'personal', 'notifications']) {
            expect(canJoin(kind, me, 'p1')).toBe(true);
            expect(canJoin(kind, me, 'someone-else')).toBe(false);
            expect(canJoin(kind, me, undefined)).toBe(false);
        }
    });

    test('a mentor room is the mentor\'s own, and only for someone who may read MTSS', () => {
        expect(canJoin('mtss-mentor', user(['mtss.read']), 'p1')).toBe(true);
        expect(canJoin('mtss-mentor', user(['mtss.read']), 'p2')).toBe(false);
        expect(canJoin('mtss-mentor', user([]), 'p1')).toBe(false);
    });

    test('the admin room needs mtss.admin', () => {
        expect(canJoin('mtss-admin', user(['mtss.read', 'mtss.write']))).toBe(false);
        expect(canJoin('mtss-admin', user(['mtss.read', 'mtss.admin']))).toBe(true);
    });

    test('live pings need mtss.read and a known scope', () => {
        expect(canJoin('mtss-live', user(['mtss.read']), 'junior-high')).toBe(true);
        expect(canJoin('mtss-live', user(['mtss.read']), undefined)).toBe(true);
        expect(canJoin('mtss-live', user(['mtss.read']), 'made-up')).toBe(false);
        expect(canJoin('mtss-live', user([]), 'all')).toBe(false);
    });

    test('the topology needs dev_topology.read, and an unknown room is refused', () => {
        expect(canJoin('dev-topology', user(['mtss.admin']))).toBe(false);
        expect(canJoin('dev-topology', user(['dev_topology.read']))).toBe(true);
        expect(canJoin('something-else', user(['mtss.admin']), 'p1')).toBe(false);
        expect(canJoin('personal', null, 'p1')).toBe(false);
    });
});

describe('socket handshake', () => {
    const handshake = { headers: { cookie: 'hub_at=x' } };

    test('no valid Hub cookie means no connection', async () => {
        const session = { fromCookieHeader: async () => null };
        expect(await userFromHandshake(handshake, { session })).toBeNull();
    });

    test('a person Central gave nothing, or a deactivated one, is refused', async () => {
        const session = { fromCookieHeader: async () => ({ sub: 'p1' }) };
        expect(await userFromHandshake(handshake, { session, resolve: async () => null })).toBeNull();
        expect(await userFromHandshake(handshake, { session, resolve: async () => person([], { isActive: false }) })).toBeNull();
    });

    test('a valid person becomes the request user', async () => {
        const session = { fromCookieHeader: async () => ({ sub: 'p1' }) };
        const resolved = await userFromHandshake(handshake, { session, resolve: async () => person(['mtss.read']) });
        expect(resolved.permissions).toContain('mtss.read');
        expect(String(resolved.id)).toBe('p1');
    });
});

describe('AI insights scope', () => {
    const student = { currentGrade: 'Grade 8' };

    test('all students for the all scope', () => {
        expect(studentInViewerScope(user(['mtss.read', 'mtss.scope.all']), student)).toBe(true);
    });

    test('a unit scope reaches only the students of its own unit', () => {
        const viewer = user(['mtss.read', 'mtss.scope.unit'], { unit: 'Junior High' });
        expect(studentInViewerScope(viewer, student)).toBe(true);
        expect(studentInViewerScope(viewer, { currentGrade: 'Grade 3' })).toBe(false);
        expect(studentInViewerScope(viewer, {})).toBe(false);
    });

    test('nobody else is in scope by default', () => {
        expect(studentInViewerScope(user(['mtss.read']), student)).toBe(false);
    });

    test('the request user carries _id, which the insight queries use', () => {
        expect(String(user(['mtss.read'])._id)).toBe('p1');
    });
});
