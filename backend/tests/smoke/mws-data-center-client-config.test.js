const { getCentralClient } = require('../../src/services/mwsDataCenterClient');

describe('mwsDataCenterClient configuration', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    test('reports a clear error when MWS_DATA_CENTER_API_URL is missing', () => {
        delete process.env.MWS_DATA_CENTER_API_URL;
        delete process.env.CENTRAL_API_BASE_URL;
        process.env.MWS_DATA_CENTER_API_TOKEN = 'token.prefix';

        expect(() => getCentralClient()).toThrow('MWS_DATA_CENTER_API_URL/CENTRAL_API_BASE_URL is not configured');
    });

    test('reports a clear error when MWS_DATA_CENTER_API_URL is invalid', () => {
        process.env.MWS_DATA_CENTER_API_URL = 'central/api/internal';
        process.env.MWS_DATA_CENTER_API_TOKEN = 'token.prefix';

        expect(() => getCentralClient()).toThrow('MWS_DATA_CENTER_API_URL/CENTRAL_API_BASE_URL is invalid');
    });

    test('reports a clear error when MWS_DATA_CENTER_API_TOKEN is missing', () => {
        process.env.MWS_DATA_CENTER_API_URL = 'https://central.example.test/api/internal';
        delete process.env.CENTRAL_API_TOKEN;
        delete process.env.MWS_DATA_CENTER_API_TOKEN;

        expect(() => getCentralClient()).toThrow('MWS_DATA_CENTER_API_TOKEN/CENTRAL_API_TOKEN is not configured');
    });

    test('normalizes a valid base URL before creating the client', () => {
        process.env.MWS_DATA_CENTER_API_URL = 'https://central.example.test/api/internal/';
        process.env.MWS_DATA_CENTER_API_TOKEN = 'token.prefix';

        expect(getCentralClient().defaults.baseURL).toBe('https://central.example.test/api/internal');
    });

    test('accepts Hub-style Central env aliases', () => {
        delete process.env.MWS_DATA_CENTER_API_URL;
        delete process.env.MWS_DATA_CENTER_API_TOKEN;
        process.env.CENTRAL_API_BASE_URL = 'https://central.example.test/api/internal';
        process.env.CENTRAL_API_TOKEN = 'token.prefix';

        expect(getCentralClient().defaults.baseURL).toBe('https://central.example.test/api/internal');
    });
});
