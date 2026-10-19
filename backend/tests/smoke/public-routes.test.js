const request = require('supertest');
const { app } = require('../../src/app');

describe('routes that need no sign in', () => {
    const before = { ...process.env };
    afterEach(() => {
        process.env = { ...before };
    });

    test('public config gives HUB_BASE_URL without the trailing slash', async () => {
        process.env.HUB_BASE_URL = 'http://localhost:5175/';
        const res = await request(app).get('/api/v1/config/public').expect(200);
        expect(res.body).toMatchObject({ success: true, data: { hubBaseUrl: 'http://localhost:5175' } });
    });

    test('health reports the build the deploy waits for', async () => {
        process.env.BUILD_ID = 'abc123';
        const res = await request(app).get('/api/health').expect(200);
        expect(res.body.buildId).toBe('abc123');
    });
});
