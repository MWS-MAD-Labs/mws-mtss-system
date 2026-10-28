const { exchangeHubCode } = require('../../src/utils/hubCodeExchange');

describe('exchangeHubCode', () => {
    const env = { ...process.env };
    beforeEach(() => {
        process.env.HUB_BASE_URL = 'http://hub.test/api/';
        process.env.HUB_INTERNAL_SECRET = 'secret-x';
        process.env.HUB_SSO_APP_ID = 'mtss';
        global.fetch = jest.fn();
    });
    afterEach(() => {
        process.env = { ...env };
        delete global.fetch;
    });

    it('posts the code with the internal secret and returns the token', async () => {
        global.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: { token: 'relay.jwt' } }) });
        await expect(exchangeHubCode('c1', 's1')).resolves.toBe('relay.jwt');
        const [url, init] = global.fetch.mock.calls[0];
        expect(url).toBe('http://hub.test/api/sso/exchange');
        expect(init.headers['x-hub-internal-secret']).toBe('secret-x');
        expect(JSON.parse(init.body)).toEqual({ code: 'c1', appId: 'mtss', state: 's1' });
    });

    it('omits state when there is none', async () => {
        global.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: { token: 't' } }) });
        await exchangeHubCode('c1');
        expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({ code: 'c1', appId: 'mtss' });
    });

    it('throws when Hub refuses the code', async () => {
        global.fetch.mockResolvedValue({ ok: false, status: 400 });
        await expect(exchangeHubCode('bad')).rejects.toThrow('400');
    });

    it('throws when the answer has no token', async () => {
        global.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: {} }) });
        await expect(exchangeHubCode('c')).rejects.toThrow('no token');
    });

    it('throws when the secret is not configured', async () => {
        delete process.env.HUB_INTERNAL_SECRET;
        await expect(exchangeHubCode('c')).rejects.toThrow('HUB_INTERNAL_SECRET');
    });
});
