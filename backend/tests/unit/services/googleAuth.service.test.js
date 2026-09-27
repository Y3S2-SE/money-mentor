import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

const getToken = jest.fn();
const verifyIdToken = jest.fn();
const OAuth2Client = jest.fn().mockImplementation(() => ({ getToken, verifyIdToken }));

jest.unstable_mockModule('google-auth-library', () => ({ OAuth2Client }));

const { verifyGoogleCode } = await import('../../../services/googleAuth.service.js');

const originalClientId = process.env.GOOGLE_CLIENT_ID;
const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const validPayload = {
    sub: 'google-sub-123',
    email: 'User@Example.COM',
    email_verified: true
};

beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    OAuth2Client.mockClear();
    getToken.mockReset().mockResolvedValue({
        tokens: {
            id_token: 'provider-id-token',
            access_token: 'provider-access-token',
            refresh_token: 'provider-refresh-token'
        }
    });
    verifyIdToken.mockReset().mockResolvedValue({
        getPayload: () => ({ ...validPayload })
    });
});

afterAll(() => {
    if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = originalClientId;
    if (originalClientSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
    else process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
});

describe('Google authorization-code verification service', () => {
    it.each(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'])(
        'fails closed when %s is missing',
        async (name) => {
            delete process.env[name];

            await expect(verifyGoogleCode('code', 'https://frontend.test'))
                .rejects.toMatchObject({ code: 'GOOGLE_AUTH_UNAVAILABLE', status: 503 });
            expect(getToken).not.toHaveBeenCalled();
        }
    );

    it('exchanges the code for the validated origin and verifies the ID token', async () => {
        const identity = await verifyGoogleCode('one-time-code', 'https://frontend.test');

        expect(OAuth2Client).toHaveBeenCalledWith(expect.objectContaining({
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            issuers: ['accounts.google.com', 'https://accounts.google.com']
        }));
        expect(getToken).toHaveBeenCalledWith({
            code: 'one-time-code',
            redirect_uri: 'https://frontend.test'
        });
        expect(verifyIdToken).toHaveBeenCalledWith({
            idToken: 'provider-id-token',
            audience: 'test-client-id'
        });
        expect(identity).toEqual({ sub: 'google-sub-123', email: 'user@example.com' });
        expect(Object.keys(identity).sort()).toEqual(['email', 'sub']);
        expect(JSON.stringify(identity)).not.toMatch(/provider-|one-time-code|test-client-secret/);
    });

    it('rejects an exchange that has no ID token', async () => {
        getToken.mockResolvedValue({ tokens: { access_token: 'provider-access-token' } });

        await expect(verifyGoogleCode('code', 'https://frontend.test'))
            .rejects.toMatchObject({ code: 'GOOGLE_IDENTITY_INVALID', status: 401 });
        expect(verifyIdToken).not.toHaveBeenCalled();
    });

    it.each([
        [{ sub: '', email: 'user@example.com', email_verified: true }, 'missing sub'],
        [{ sub: 'google-sub-123', email: '', email_verified: true }, 'missing email'],
        [{ sub: 'google-sub-123', email: 'not-an-email', email_verified: true }, 'invalid email']
    ])('rejects %s (%s)', async (payload) => {
        verifyIdToken.mockResolvedValue({ getPayload: () => payload });

        await expect(verifyGoogleCode('code', 'https://frontend.test'))
            .rejects.toMatchObject({ code: 'GOOGLE_IDENTITY_INVALID', status: 401 });
    });

    it.each([false, undefined, 'true'])(
        'rejects email_verified=%s',
        async (emailVerified) => {
            verifyIdToken.mockResolvedValue({
                getPayload: () => ({ ...validPayload, email_verified: emailVerified })
            });

            await expect(verifyGoogleCode('code', 'https://frontend.test'))
                .rejects.toMatchObject({ code: 'GOOGLE_EMAIL_UNVERIFIED', status: 401 });
        }
    );

    it.each(['invalid code', 'replayed code'])(
        'maps a provider %s failure without exposing it',
        async (reason) => {
            getToken.mockRejectedValue(new Error(`raw provider ${reason}: provider-access-token`));

            await expect(verifyGoogleCode('code', 'https://frontend.test'))
                .rejects.toMatchObject({
                    code: 'GOOGLE_CODE_INVALID',
                    status: 400,
                    message: 'Google sign-in could not be completed'
                });
            expect(verifyIdToken).not.toHaveBeenCalled();
        }
    );

    it('maps ID-token verification failures, including a wrong audience', async () => {
        verifyIdToken.mockRejectedValue(new Error('raw provider wrong audience: provider-id-token'));

        await expect(verifyGoogleCode('code', 'https://frontend.test'))
            .rejects.toMatchObject({
                code: 'GOOGLE_IDENTITY_INVALID',
                status: 401,
                message: 'Google identity could not be verified'
            });
    });
});
