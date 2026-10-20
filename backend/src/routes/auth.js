const express = require('express');
const router = express.Router();
const Person = require('../models/Person');
const { sendSuccess, sendError } = require('../utils/response');
const { PERMISSIONS } = require('../constants/permissions');
const { authenticate, buildRequestUser } = require('../middleware/auth');
const { ssoLandingUrl } = require('../utils/frontendUrl');

// Signing in and out belong to the Hub. The Hub keeps a short access token in a cookie on the parent domain, every
// request is checked against it (middleware/auth.js), and the page keeps it fresh (see the frontend keepFresh).
// So this app has no sign-in, sign-out or session-revocation routes: signing out of the Hub signs out of every app.

// Where the Hub's card opens MTSS. There is nothing to sign in to: the Hub's session is read from its cookie by
// the pages and the API. This only sends the browser to the app.
router.get('/sso', (req, res) => {
    res.redirect(ssoLandingUrl());
});

// Get current user info
router.get('/me', authenticate, async (req, res) => {
    try {
        // Fetch fresh data from the database for security
        const person = await Person.findById(req.user.id);

        if (!person) {
            console.error('❌ User not found in /auth/me endpoint:', req.user.id);
            return sendError(res, 'User not found', 404);
        }

        // Additional security check - ensure the person is still active
        if (!person.isActive) {
            console.error('❌ Inactive user accessed /auth/me:', person.email);
            return sendError(res, 'Account is deactivated', 403);
        }

        const user = buildRequestUser(person);
        // The screens open or hide the emotional dashboard from this, next to the permissions themselves.
        user.hasDashboardAccess = user.permissions.includes(PERMISSIONS.EMOTIONAL_DASHBOARD_READ);

        sendSuccess(res, 'User info retrieved', { user });
    } catch (error) {
        console.error('❌ /auth/me error:', error);
        sendError(res, 'Failed to get user info', 500);
    }
});

module.exports = router;
