const express = require('express');
const request = require('supertest');

jest.mock('../../src/models/User', () => ({}));
jest.mock('../../src/models/UserStudent', () => ({}));
jest.mock('../../src/utils/hubCodeExchange', () => ({ exchangeHubCode: jest.fn() }));
jest.mock('../../src/utils/hubSsoRelay', () => ({ verifyHubRelayToken: jest.fn() }));
jest.mock('../../src/utils/ssoUserResolution', () => ({ resolveOrProvisionSsoUser: jest.fn() }));

const { exchangeHubCode } = require('../../src/utils/hubCodeExchange');
const { verifyHubRelayToken } = require('../../src/utils/hubSsoRelay');
const { resolveOrProvisionSsoUser } = require('../../src/utils/ssoUserResolution');
const authRouter = require('../../src/routes/auth');

const app = express();
app.use('/auth', authRouter);

describe('GET /auth/sso', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.FRONTEND_URL = 'http://front.test/mtss';
        process.env.JWT_SECRET = 'test-secret';
    });

    it('redirects with sso_missing_token when there is no code or token', async () => {
        const res = await request(app).get('/auth/sso');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('http://front.test/mtss/?error=sso_missing_token');
    });

    it('exchanges the code and verifies the token it gets back', async () => {
        exchangeHubCode.mockResolvedValue('relay.jwt');
        verifyHubRelayToken.mockReturnValue({ sub: 'a@b.c', tags: [], source: 'employee' });
        resolveOrProvisionSsoUser.mockResolvedValue(null);
        const res = await request(app).get('/auth/sso?code=c1&state=s1');
        expect(exchangeHubCode).toHaveBeenCalledWith('c1', 's1');
        expect(verifyHubRelayToken).toHaveBeenCalledWith('relay.jwt');
        expect(res.headers.location).toBe('http://front.test/mtss/?error=sso_account_not_found');
    });

    it('redirects with sso_invalid_token when Hub refuses the code', async () => {
        exchangeHubCode.mockRejectedValue(new Error('Hub code exchange answered 400'));
        const res = await request(app).get('/auth/sso?code=bad');
        expect(res.headers.location).toBe('http://front.test/mtss/?error=sso_invalid_token');
        expect(verifyHubRelayToken).not.toHaveBeenCalled();
    });

    it('still accepts a ?token= relay token', async () => {
        verifyHubRelayToken.mockReturnValue({ sub: 'a@b.c', tags: [] });
        resolveOrProvisionSsoUser.mockResolvedValue(null);
        await request(app).get('/auth/sso?token=old.jwt');
        expect(exchangeHubCode).not.toHaveBeenCalled();
        expect(verifyHubRelayToken).toHaveBeenCalledWith('old.jwt');
    });
});
