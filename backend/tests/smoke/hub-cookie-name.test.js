const { accessCookieName } = require('../../src/utils/hubSession');

describe('Hub access cookie name', () => {
    const before = { ...process.env };
    afterEach(() => {
        process.env = { ...before };
        jest.resetModules();
    });

    test('is left to the Hub default when HUB_ACCESS_COOKIE_NAME is empty', () => {
        expect(accessCookieName({})).toBeUndefined();
        expect(accessCookieName({ HUB_ACCESS_COOKIE_NAME: '  ' })).toBeUndefined();
    });

    test('is the configured name, trimmed', () => {
        expect(accessCookieName({ HUB_ACCESS_COOKIE_NAME: ' hub_at_stg ' })).toBe('hub_at_stg');
    });

    test('reaches the session that reads the cookie', () => {
        process.env.HUB_BASE_URL = 'https://hub.test';
        process.env.HUB_ACCESS_COOKIE_NAME = 'hub_at_stg';
        const { hubSession } = require('../../src/utils/hubSession');
        expect(hubSession().cookieName).toBe('hub_at_stg');
    });

    test('is hub_at on the session when nothing is configured', () => {
        process.env.HUB_BASE_URL = 'https://hub.test';
        delete process.env.HUB_ACCESS_COOKIE_NAME;
        const { hubSession } = require('../../src/utils/hubSession');
        expect(hubSession().cookieName).toBe('hub_at');
    });
});
