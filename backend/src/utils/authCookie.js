const COOKIE_NAME = 'mtss_token';

// Parses the same shorthand JWT_EXPIRES_IN already uses ('1d', '8h', '90m',
// '30s') into milliseconds for cookie maxAge. Not the full jsonwebtoken/ms
// grammar - just the units this app's env files actually use - so this
// doesn't depend on an undeclared transitive dependency.
function parseExpiresInMs(expiresIn) {
    const match = /^(\d+)\s*(d|h|m|s)$/i.exec(String(expiresIn || '').trim());
    if (!match) return 7 * 24 * 60 * 60 * 1000; // 7 day fallback, matches this app's JWT default

    const value = Number(match[1]);
    const unitMs = { d: 86400000, h: 3600000, m: 60000, s: 1000 }[match[2].toLowerCase()];
    return value * unitMs;
}

// httpOnly so page JavaScript can never read it (the whole point - an XSS
// payload can no longer exfiltrate the session token the way it could with
// localStorage). sameSite:'lax' is enough here because the frontend and
// this API are same-site (both under app.millenniaws.sch.id) - no need for
// the more fragile cross-site sameSite:'none'.
function cookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    };
}

function setAuthCookie(res, token) {
    res.cookie(COOKIE_NAME, token, {
        ...cookieOptions(),
        maxAge: parseExpiresInMs(process.env.JWT_EXPIRES_IN || '7d'),
    });
}

function clearAuthCookie(res) {
    res.clearCookie(COOKIE_NAME, cookieOptions());
}

module.exports = { COOKIE_NAME, setAuthCookie, clearAuthCookie };
