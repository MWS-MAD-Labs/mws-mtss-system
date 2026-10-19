const { createHubSession } = require('mws-central-auth/server');

let session;

// The Hub's shared session: a short access token in a cookie on the parent domain, checked against the Hub's keys.
// The app keeps no session of its own and has no sign-in or sign-out: signing out of the Hub ends it everywhere.
function hubSession() {
    if (!session) {
        if (!process.env.HUB_BASE_URL) throw new Error('HUB_BASE_URL is not configured');
        session = createHubSession({ hubBaseUrl: process.env.HUB_BASE_URL });
    }
    return session;
}

module.exports = { hubSession };
