const { hubSession } = require('./hubSession');
const { resolveSessionUser } = require('./hubSessionUser');
const { has } = require('./accessScope');
const { PERMISSIONS } = require('../constants/permissions');

// The rooms a live connection may join. A connection is the Hub's session like any request, and each room is checked
// against what Central gave the person, so nobody can listen to somebody else's notifications, a mentor's students or
// the topology by naming a room.
const LIVE_SCOPES = new Set(['all', 'junior-high', 'elementary', 'kindergarten', 'pelangi']);

const sameId = (a, b) => a !== undefined && a !== null && String(a) === String(b);

// kind is the join event without the "join-" part. arg is what the client sent with it.
function canJoin(kind, user, arg) {
    if (!user) return false;
    switch (kind) {
        case 'dashboard':
        case 'personal':
        case 'notifications':
            return sameId(arg, user.id);
        case 'mtss-mentor':
            return has(user, PERMISSIONS.MTSS_READ) && sameId(arg, user.id);
        case 'mtss-admin':
            return has(user, PERMISSIONS.MTSS_ADMIN);
        // Only pings that something changed, no student data, so any MTSS reader may listen to a known scope.
        case 'mtss-live':
            return has(user, PERMISSIONS.MTSS_READ) && LIVE_SCOPES.has(String(arg || 'all').trim() || 'all');
        case 'dev-topology':
            return has(user, PERMISSIONS.DEV_TOPOLOGY_READ);
        default:
            return false;
    }
}

// The person behind a socket handshake, or null. Reads the Hub cookie the browser sent with the connection.
async function userFromHandshake(handshake, deps = {}) {
    const { buildRequestUser } = require('../middleware/auth');
    const session = deps.session || hubSession();
    const resolve = deps.resolve || resolveSessionUser;
    const claims = await session.fromCookieHeader(handshake?.headers?.cookie);
    if (!claims) return null;
    const person = await resolve(claims);
    if (!person || !person.isActive) return null;
    return buildRequestUser(person);
}

module.exports = { canJoin, userFromHandshake, LIVE_SCOPES };
