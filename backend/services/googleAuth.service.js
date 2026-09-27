import { OAuth2Client } from 'google-auth-library';

export class GoogleAuthError extends Error {
    constructor(code, status, message) {
        super(message);
        this.name = 'GoogleAuthError';
        this.code = code;
        this.status = status;
    }
}

export const verifyGoogleCode = async (code, redirectUri) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new GoogleAuthError(
            'GOOGLE_AUTH_UNAVAILABLE',
            503,
            'Google sign-in is temporarily unavailable'
        );
    }

    const client = new OAuth2Client({
        clientId,
        clientSecret,
        issuers: ['accounts.google.com', 'https://accounts.google.com']
    });

    let tokens;
    try {
        ({ tokens } = await client.getToken({
            code,
            redirect_uri: redirectUri
        }));
    } catch {
        throw new GoogleAuthError(
            'GOOGLE_CODE_INVALID',
            400,
            'Google sign-in could not be completed'
        );
    }

    if (!tokens?.id_token) {
        throw new GoogleAuthError(
            'GOOGLE_IDENTITY_INVALID',
            401,
            'Google identity could not be verified'
        );
    }

    let payload;
    try {
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: clientId
        });
        payload = ticket.getPayload();
    } catch {
        throw new GoogleAuthError(
            'GOOGLE_IDENTITY_INVALID',
            401,
            'Google identity could not be verified'
        );
    }

    const sub = typeof payload?.sub === 'string' ? payload.sub.trim() : '';
    const email = typeof payload?.email === 'string'
        ? payload.email.trim().toLowerCase()
        : '';

    if (!sub || !/^\S+@\S+$/.test(email)) {
        throw new GoogleAuthError(
            'GOOGLE_IDENTITY_INVALID',
            401,
            'Google identity could not be verified'
        );
    }

    if (payload.email_verified !== true) {
        throw new GoogleAuthError(
            'GOOGLE_EMAIL_UNVERIFIED',
            401,
            'Google email could not be verified'
        );
    }

    return { sub, email };
};
