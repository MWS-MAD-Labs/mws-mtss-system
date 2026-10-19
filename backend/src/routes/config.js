const express = require('express');
const { sendSuccess } = require('../utils/response');

const router = express.Router();

const normalizeBaseUrl = (value = '') => String(value || '').trim().replace(/\/+$/, '');

// What the page needs before anybody is signed in: where the Hub is, so it can send people there.
router.get('/public', (req, res) => {
    sendSuccess(res, 'Public configuration retrieved', {
        hubBaseUrl: normalizeBaseUrl(process.env.HUB_BASE_URL)
    });
});

module.exports = router;
