const { PERMISSION_VALUES } = require('../../src/constants/permissions');
const { buildManifest, connection, flagNumber, withRetries, explain, DESCRIPTIONS } = require('../../src/scripts/syncPermissions');

describe('permission sync', () => {
    it('sends every permission of the code, each with a description, and nothing else', () => {
        const manifest = buildManifest();
        expect(manifest.map((entry) => entry.key)).toEqual(PERMISSION_VALUES);
        expect(manifest.every((entry) => entry.description.length > 3)).toBe(true);
        // A new permission without a written description still goes out, with one made from its name.
        expect(buildManifest(['reports.export'])).toEqual([{ key: 'reports.export', description: 'Reports export' }]);
        // No description is kept for a permission the code no longer has.
        expect(Object.keys(DESCRIPTIONS).every((key) => PERMISSION_VALUES.includes(key))).toBe(true);
    });

    it('reads the address and token from the names the app uses, the new names first', () => {
        expect(connection({ CENTRAL_API_BASE_URL: 'https://db.example.com/api/internal/', CENTRAL_API_TOKEN: 't' })).toEqual({
            url: 'https://db.example.com/api/internal/application-permissions/me',
            token: 't',
        });
        expect(
            connection({ MWS_DATA_CENTER_API_URL: 'http://old/api/internal', MWS_DATA_CENTER_API_TOKEN: 'old', CENTRAL_API_BASE_URL: 'new', CENTRAL_API_TOKEN: 'new' }).token,
        ).toBe('new');
        expect(connection({ MWS_DATA_CENTER_API_URL: 'http://old/api/internal/', MWS_DATA_CENTER_API_TOKEN: 'old' })).toEqual({
            url: 'http://old/api/internal/application-permissions/me',
            token: 'old',
        });
        expect(() => connection({})).toThrow(/must be set/);
    });

    it('says where a call went when the answer is not one of Central\'s own', () => {
        const call = { method: 'put', url: 'https://db.example.com/application-permissions/me' };
        expect(explain({ response: { status: 404, data: { errors: 'Application not found' } }, config: call })).toBe(
            'Central said 404: Application not found (PUT https://db.example.com/application-permissions/me)',
        );
        expect(explain({ response: { status: 404, data: '<html>Not   Found</html>' }, config: call })).toBe(
            'Central said 404 (PUT https://db.example.com/application-permissions/me) <html>Not Found</html>',
        );
        expect(explain({ message: 'timeout' })).toBe('timeout');
    });

    it('reads its flags', () => {
        expect(flagNumber(['--retries', '5'], '--retries', 0)).toBe(5);
        expect(flagNumber([], '--retries', 0)).toBe(0);
        expect(flagNumber(['--retries', 'x'], '--retries', 2)).toBe(2);
    });

    it('asks again when Central cannot be reached, and gives up on a no', async () => {
        let calls = 0;
        const flaky = async () => {
            calls += 1;
            if (calls < 3) throw Object.assign(new Error('down'), { response: { status: 503 } });
            return 'ok';
        };
        await expect(withRetries(flaky, { retries: 3, wait: 0 })).resolves.toBe('ok');

        calls = 0;
        const refused = async () => {
            calls += 1;
            throw Object.assign(new Error('no'), { response: { status: 401 } });
        };
        await expect(withRetries(refused, { retries: 3, wait: 0 })).rejects.toThrow('no');
        expect(calls).toBe(1);
    });

    it('does not stop dev when Central is off: --soft only warns', () => {
        const { spawnSync } = require('child_process');
        const run = (args, env = {}) =>
            spawnSync('node', ['src/scripts/syncPermissions.js', ...args], {
                cwd: require('path').resolve(__dirname, '../..'),
                env: { PATH: process.env.PATH, DOTENV_CONFIG_PATH: '/nonexistent', MWS_DATA_CENTER_API_URL: 'http://127.0.0.1:1/api/internal', MWS_DATA_CENTER_API_TOKEN: 't', ...env },
                encoding: 'utf8',
            });
        const soft = run(['--soft']);
        expect(soft.status).toBe(0);
        expect(soft.stderr).toContain('permissions not sent, continuing');
        expect(run([]).status).toBe(1);
        // With nothing configured, dev still starts.
        expect(run(['--soft'], { MWS_DATA_CENTER_API_URL: '', MWS_DATA_CENTER_API_TOKEN: '' }).status).toBe(0);
    });
});
