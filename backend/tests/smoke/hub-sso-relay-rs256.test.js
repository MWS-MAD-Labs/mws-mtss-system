const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cacheService = require('../../src/services/cacheService');
const { verifyHubRelayToken } = require('../../src/utils/hubSsoRelay');

const ISSUER = 'mws-hub';
const AUDIENCE = 'mtss';

function base64UrlJson(value) {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signHs256WithPublicKeyAsSecret(payload, publicKey) {
    const header = base64UrlJson({ alg: 'HS256', typ: 'JWT' });
    const body = base64UrlJson(payload);
    const signature = crypto
        .createHmac('sha256', publicKey)
        .update(`${header}.${body}`)
        .digest('base64url');

    return `${header}.${body}.${signature}`;
}

describe('Hub SSO relay verifier', () => {
    let privateKey;
    let publicKey;

    beforeAll(() => {
        const pair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });

        privateKey = pair.privateKey;
        publicKey = pair.publicKey;
    });

    beforeEach(() => {
        process.env.HUB_SSO_PUBLIC_KEY = publicKey.replace(/\n/g, '\\n');
        cacheService.hasSeenSsoJti = jest.fn().mockReturnValue(false);
        cacheService.markSsoJtiSeen = jest.fn();
    });

    test('accepts a Hub-style RS256 relay token', () => {
        const token = jwt.sign(
            {
                sub: 'teacher@millennia21.id',
                jti: crypto.randomUUID(),
            },
            privateKey,
            {
                algorithm: 'RS256',
                issuer: ISSUER,
                audience: AUDIENCE,
                expiresIn: '30s',
                keyid: 'test-hub-key',
            },
        );

        const payload = verifyHubRelayToken(token);

        expect(payload.sub).toBe('teacher@millennia21.id');
        expect(payload.aud).toBe(AUDIENCE);
        expect(cacheService.markSsoJtiSeen).toHaveBeenCalledWith(payload.jti);
    });

    test('rejects an HS256 token signed with the public key as its HMAC secret', () => {
        const maliciousToken = signHs256WithPublicKeyAsSecret(
            {
                iss: ISSUER,
                aud: AUDIENCE,
                sub: 'attacker@millennia21.id',
                jti: crypto.randomUUID(),
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 30,
            },
            publicKey,
        );

        expect(() => verifyHubRelayToken(maliciousToken)).toThrow();
        expect(cacheService.markSsoJtiSeen).not.toHaveBeenCalled();
    });
});
