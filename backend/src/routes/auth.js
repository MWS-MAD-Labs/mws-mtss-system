const express = require('express');
const router = express.Router();
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserStudent = require('../models/UserStudent');
const { sendSuccess, sendError } = require('../utils/response');
const { hasDashboardAccess, hasMtssAccess } = require('../utils/accessControl');
const { buildRequestUser } = require('../middleware/auth');
const { verifyHubRelayToken } = require('../utils/hubSsoRelay');
const { resolveOrProvisionSsoUser } = require('../utils/ssoUserResolution');
const { createUserAwareRateLimiter } = require('../middleware/rateLimiter');

const ssoLimiter = createUserAwareRateLimiter({ windowMinutes: 1, max: 20, skip: () => false });

const isCentralLookupError = (error) => {
<<<<<<< HEAD
    const baseUrl = error?.config?.baseURL;
    const path = error?.config?.url;
    return Boolean(
        baseUrl === process.env.MWS_DATA_CENTER_API_URL ||
=======
    if (error?.isCentralLookupError) return true;

    const baseUrl = error?.config?.baseURL;
    const path = error?.config?.url;
    const expectedBaseUrl = process.env.MWS_DATA_CENTER_API_URL;

    return Boolean(
        (expectedBaseUrl && baseUrl === expectedBaseUrl) ||
>>>>>>> origin/staging
        (typeof path === 'string' && /^\/(employees|students)\//.test(path))
    );
};

const getDefaultMtssRedirectTarget = (user) => {
    const profile = user?.mtssAccess || {};
    if (!profile.hasAccess) return '/select-role';
    if (profile.accessLevel === 'observer') return '/observer';
    if (profile.canAccessAdmin) return '/admin';
    return '/teacher';
};

// Hub token-relay SSO handoff. Hub authenticates Google once, then sends a
// short-lived audience-scoped token here. MTSS verifies only that email
// assertion and re-resolves the user from Central/local DB before creating
// its own JWT.
//
// app.js's global helmet() defaults Cross-Origin-Opener-Policy to
// 'same-origin'. That header forces the browser to sever this navigation
// into a brand-new browsing-context group, which breaks Hub's
// window.open(url, name) tab reuse (see mws-hub's AppCard.tsx) - every
// relaunch reopens a fresh tab instead of focusing the one already logged
// in, no matter what name Hub asks for. Hub already severs window.opener by
// hand right after opening, so COOP isn't this route's only tabnabbing
// defense; scope the relaxation to just this transient redirect hop rather
// than touching the app-wide default.
router.get('/sso', helmet.crossOriginOpenerPolicy({ policy: 'unsafe-none' }), ssoLimiter, async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5176/mtss';
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
        return res.redirect(`${frontendUrl}/?error=sso_missing_token`);
    }

    let payload;
    try {
        payload = verifyHubRelayToken(token);
    } catch (error) {
        console.error('❌ MTSS Hub SSO relay token verification failed:', error.message);
        return res.redirect(`${frontendUrl}/?error=sso_invalid_token`);
    }

    try {
        const dbUser = await resolveOrProvisionSsoUser(payload.sub, { tags: payload.tags });

        if (!dbUser) {
            console.log('❌ No active central record for MTSS Hub SSO email:', payload.sub);
            return res.redirect(`${frontendUrl}/?error=sso_account_not_found`);
        }

        if (!dbUser.isActive) {
            console.error('❌ Inactive user attempted MTSS Hub SSO login:', {
                email: dbUser.email,
                model: dbUser.constructor?.modelName,
                isActive: dbUser.isActive
            });
            return res.redirect(`${frontendUrl}/?error=account_inactive`);
        }

        const token7d = jwt.sign(
            { userId: dbUser._id, email: dbUser.email, role: dbUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const userDataForFrontend = {
            ...buildRequestUser(dbUser),
            lastLogin: dbUser.lastLogin,
            isActive: dbUser.isActive,
            emailVerified: dbUser.emailVerified,
            validatedAt: new Date().toISOString(),
            authMethod: 'hub_sso'
        };

        const redirectTarget = getDefaultMtssRedirectTarget(userDataForFrontend);
        const redirectUrl = `${frontendUrl}/auth/callback#token=${encodeURIComponent(token7d)}&user=${encodeURIComponent(JSON.stringify(userDataForFrontend))}&redirect=${encodeURIComponent(redirectTarget)}`;

        console.log('✅ MTSS Hub SSO login successful:', {
            email: dbUser.email,
            role: dbUser.role,
            redirectTarget
        });
        res.redirect(redirectUrl);
    } catch (error) {
        const centralLookupFailed = isCentralLookupError(error);
        console.error('❌ MTSS Hub SSO handoff error:', {
            email: payload.sub,
            centralLookupFailed,
            status: error?.response?.status,
            path: error?.config?.url,
            message: error?.message
        });
        res.redirect(`${frontendUrl}/?error=${centralLookupFailed ? 'sso_central_lookup_failed' : 'sso_failed'}`);
    }
});

// Manual login route
router.post('/login', require('../middleware/validation').validate(require('../utils/validationSchemas').userLoginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

        // Find user by email (staff first, then students)
        let user = await User.findOne({ email: normalizedEmail }).select('+password');
        let userModel = User;
        if (!user) {
            user = await UserStudent.findOne({ email: normalizedEmail }).select('+password');
            userModel = UserStudent;
        }

        if (!user) {
            return sendError(res, 'Invalid credentials', 401);
        }

        // Check password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return sendError(res, 'Invalid credentials', 401);
        }

        // Update last login
        await userModel.findByIdAndUpdate(user._id, { lastLogin: new Date() });

        // Generate JWT token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data and token
        const userData = {
            user: buildRequestUser({ ...user.toObject(), lastLogin: new Date() }),
            token
        };

        sendSuccess(res, 'Login successful', userData);

    } catch (error) {
        console.error('Login error:', error);
        sendError(res, 'Login failed', 500);
    }
});

// Logout — JWT auth is stateless; client drops the token.
router.post('/logout', (req, res) => {
    // Signing out here should also end the Hub session, otherwise the user
    // lands back on the hub still logged in and one click re-enters this app.
    //
    // Hub's session is a cookie on Hub's domain, so only the browser can
    // clear it - no server-to-server call can. We hand the client a URL to
    // navigate to instead of trying to do it from here.
    const hubBaseUrl = process.env.HUB_BASE_URL;
    // Trailing slash is load-bearing: this becomes a real top-level
    // navigation, and the gateway/dev server serves this app at /mtss/,
    // not /mtss (Vite's strict base-path match rejects the latter).
    const frontendBase = (
        process.env.FRONTEND_URL || 'https://app.millenniaws.sch.id/mtss'
    ).replace(/\/+$/, '');
    const hubLogoutUrl = hubBaseUrl
        ? `${hubBaseUrl.replace(/\/$/, '')}/auth/logout?redirect=${encodeURIComponent(
              `${frontendBase}/`
          )}`
        : null;

    sendSuccess(res, 'Logged out successfully', hubLogoutUrl ? { hubLogoutUrl } : null);
});

// The other half of Hub <-> MTSS logout: MTSS's session is a self-contained
// JWT in this app's own localStorage, on this app's own origin - Hub's page
// can never reach in and clear it directly (cross-origin). Hub loads this
// page in a hidden iframe when the person signs out there, so signing out
// of Hub actually signs out of every satellite app they opened, not just
// Hub itself (see mintRelayToken's sibling concern - own-origin-only
// storage - documented in mws-hub/backend/src/type/catalog-type.ts).
//
// No auth middleware: this must work whether or not a local session exists.
// Helmet's default X-Frame-Options: SAMEORIGIN would otherwise block Hub
// from framing this at all, so it's replaced here with a CSP frame-ancestors
// scoped to Hub's own origin specifically - not a blanket "allow everyone".
router.get('/logout-silent', (req, res) => {
    const hubOrigin = (process.env.HUB_BASE_URL || '').replace(/\/$/, '');
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', `frame-ancestors 'self'${hubOrigin ? ` ${hubOrigin}` : ''}`);
    res.type('html').send(
<<<<<<< HEAD
        `<!doctype html><html><body><script>try{localStorage.removeItem('auth_token');localStorage.removeItem('auth_user');}catch(e){}</script></body></html>`
=======
        `<!doctype html><html><body><script>try{localStorage.removeItem('auth_token');localStorage.removeItem('auth_user');localStorage.removeItem('token');sessionStorage.removeItem('auth_token');sessionStorage.removeItem('auth_user');sessionStorage.removeItem('token');}catch(e){}</script></body></html>`
>>>>>>> origin/staging
    );
});

// Get current user info
router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
    try {
        // Fetch fresh user data from database for security
        const userModel = req.user.role === 'student' ? UserStudent : User;
        const user = await userModel.findById(req.user.id).select('-password -googleProfile');

        if (!user) {
            console.error('❌ User not found in /auth/me endpoint:', req.user.id);
            return sendError(res, 'User not found', 404);
        }

        // Additional security check - ensure user is still active
        if (!user.isActive) {
            console.error('❌ Inactive user accessed /auth/me:', user.email);
            return sendError(res, 'Account is deactivated', 403);
        }

        const responseUser = buildRequestUser(user);

        // Log role access for security monitoring
        const canViewDashboard = hasDashboardAccess(responseUser);
        console.log('🔐 /auth/me access - Role validation:', {
            userId: user._id,
            email: user.email,
            role: responseUser.role,
            dashboardRole: responseUser.dashboardRole,
            delegatedFrom: responseUser.dashboardAccess?.delegatedFromEmail || null,
            hasDashboardAccess: canViewDashboard,
            hasMtssAccess: hasMtssAccess(responseUser),
            mtssRole: responseUser.mtssRole || null,
            department: responseUser.department,
            unit: responseUser.unit
        });

        sendSuccess(res, 'User info retrieved', { user: responseUser });
    } catch (error) {
        console.error('❌ /auth/me error:', error);
        sendError(res, 'Failed to get user info', 500);
    }
});

module.exports = router;
