const { centralHeaders } = require('../../src/utils/centralHeaders');

const KEYS = ['CENTRAL_API_BASE_URL', 'CENTRAL_API_TOKEN', 'MWS_DATA_CENTER_API_URL', 'MWS_DATA_CENTER_API_TOKEN', 'CENTRAL_ORGANIZATION_ID'];
const saved = {};

beforeEach(() => {
    KEYS.forEach((key) => {
        saved[key] = process.env[key];
        delete process.env[key];
    });
});
afterEach(() => {
    KEYS.forEach((key) => {
        if (saved[key] === undefined) delete process.env[key];
        else process.env[key] = saved[key];
    });
});

describe('the client of Central', () => {
    it('reads the names Central writes first, and the older names only when those are empty', () => {
        const { getCentralClient } = require('../../src/services/mwsDataCenterClient');
        process.env.MWS_DATA_CENTER_API_URL = 'https://old.example.org/api/internal';
        process.env.MWS_DATA_CENTER_API_TOKEN = 'old-token';
        expect(getCentralClient().defaults.baseURL).toBe('https://old.example.org/api/internal');
        process.env.CENTRAL_API_BASE_URL = 'https://new.example.org/api/internal/';
        process.env.CENTRAL_API_TOKEN = 'new-token';
        const client = getCentralClient();
        expect(client.defaults.baseURL).toBe('https://new.example.org/api/internal');
        expect(client.defaults.headers.Authorization).toBe('Bearer new-token');
    });

    it('sends the Organization ID with the token when there is one', () => {
        expect(centralHeaders('t')).toEqual({ Authorization: 'Bearer t' });
        process.env.CENTRAL_ORGANIZATION_ID = ' org_x ';
        expect(centralHeaders('t')).toEqual({ Authorization: 'Bearer t', 'X-Central-Organization-Id': 'org_x' });
    });

    it('says what is wrong when the address or the token is missing', () => {
        const { getCentralClient } = require('../../src/services/mwsDataCenterClient');
        expect(() => getCentralClient()).toThrow(/not configured/);
        process.env.CENTRAL_API_BASE_URL = 'ftp://example.org';
        process.env.CENTRAL_API_TOKEN = 't';
        expect(() => getCentralClient()).toThrow(/invalid/);
    });
});
