const express = require('express');
const request = require('supertest');
const { ssoLandingUrl } = require('../../src/utils/frontendUrl');
const authRouter = require('../../src/routes/auth');

describe('where the Hub card sends the browser', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    test('uses the configured address, adding the /mtss/ base path to a bare origin', () => {
        process.env.FRONTEND_URL = 'https://app-stg.mws.web.id';
        expect(ssoLandingUrl()).toBe('https://app-stg.mws.web.id/mtss/');
        process.env.FRONTEND_URL = 'https://apps.example.com/mtss';
        expect(ssoLandingUrl()).toBe('https://apps.example.com/mtss/');
    });

    test('stays on the gateway host in production when nothing is configured', () => {
        process.env.NODE_ENV = 'production';
        delete process.env.FRONTEND_URL;
        expect(ssoLandingUrl()).toBe('/mtss/');
    });

    test('goes to the dev server locally', () => {
        process.env.NODE_ENV = 'development';
        delete process.env.FRONTEND_URL;
        expect(ssoLandingUrl()).toBe('http://localhost:5176/mtss/');
    });

    test('GET /auth/sso redirects there, without a sign-in', async () => {
        process.env.NODE_ENV = 'production';
        delete process.env.FRONTEND_URL;
        const app = express();
        app.use('/auth', authRouter);
        const response = await request(app).get('/auth/sso');
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/mtss/');
    });
});
