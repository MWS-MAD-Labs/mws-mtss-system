const { createHubSession } = require('mws-central-auth/server');

let session;

// The name of the Hub's access cookie. Staging and production Hubs share a parent domain, so each environment sets its
// own (for example hub_at_stg) and the cookies stop overwriting each other. Unset means the Hub's default, hub_at.
function accessCookieName(env = process.env) {
    return (env.HUB_ACCESS_COOKIE_NAME || '').trim() || undefined;
}

// The Hub's shared session: a short access token in a cookie on the parent domain, checked against the Hub's keys.
// The app keeps no session of its own and has no sign-in or sign-out: signing out of the Hub ends it everywhere.
function hubSession() {
    if (!session) {
        if (!process.env.HUB_BASE_URL) throw new Error('HUB_BASE_URL is not configured');
        session = createHubSession({ hubBaseUrl: process.env.HUB_BASE_URL, cookieName: accessCookieName() });
    }
    return session;
}

module.exports = { hubSession, accessCookieName };
