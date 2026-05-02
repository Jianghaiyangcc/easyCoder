import { AuthCredentials } from '@/auth/tokenStorage';
import { getServerUrl } from './serverConfig';
import { getEasyCoderClientId } from './apiSocket';

export type PhoneVerificationScene = 'bind' | 'unbind';

type PhoneApiErrorPayload = {
    error?: string;
    code?: string;
};

export class PhoneApiRequestError extends Error {
    readonly statusCode: number;
    readonly code?: string;

    constructor(options: {
        message: string;
        statusCode: number;
        code?: string;
    }) {
        super(options.message);
        this.name = 'PhoneApiRequestError';
        this.statusCode = options.statusCode;
        this.code = options.code;
    }
}

function buildHeaders(credentials: AuthCredentials): Record<string, string> {
    return {
        'Authorization': `Bearer ${credentials.token}`,
        'Content-Type': 'application/json',
        'X-EasyCoder-Client': getEasyCoderClientId(),
    };
}

async function parseError(response: Response, fallback: string): Promise<never> {
    const payload = await response.json().catch(() => null) as PhoneApiErrorPayload | null;
    throw new PhoneApiRequestError({
        message: payload?.error || fallback,
        statusCode: response.status,
        code: payload?.code,
    });
}

export async function sendPhoneCode(
    credentials: AuthCredentials,
    input: { phone?: string; scene: PhoneVerificationScene },
): Promise<{ phone: string; expiresInSeconds: number; cooldownSeconds: number; scene: PhoneVerificationScene }> {
    const API_ENDPOINT = getServerUrl();
    const response = await fetch(`${API_ENDPOINT}/v1/account/phone/send-code`, {
        method: 'POST',
        headers: buildHeaders(credentials),
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        await parseError(response, 'Failed to send phone verification code');
    }

    return response.json();
}

export async function verifyPhoneCode(
    credentials: AuthCredentials,
    input: { phone: string; code: string; secret: string },
): Promise<{ phoneE164: string; phoneBound: true }> {
    const API_ENDPOINT = getServerUrl();
    const response = await fetch(`${API_ENDPOINT}/v1/account/phone/verify`, {
        method: 'POST',
        headers: buildHeaders(credentials),
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        await parseError(response, 'Failed to verify phone code');
    }

    return response.json();
}

export async function sendPhoneLoginCode(
    input: { phone: string },
): Promise<{ phone: string; expiresInSeconds: number; cooldownSeconds: number }> {
    const API_ENDPOINT = getServerUrl();
    const response = await fetch(`${API_ENDPOINT}/v1/auth/phone/send-code`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-EasyCoder-Client': getEasyCoderClientId(),
        },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        await parseError(response, 'Failed to send phone login verification code');
    }

    return response.json();
}

export async function verifyPhoneLoginCode(
    input: { phone: string; code: string },
): Promise<{ token: string; secret: string; isNewAccount: boolean; phoneE164: string }> {
    const API_ENDPOINT = getServerUrl();
    const response = await fetch(`${API_ENDPOINT}/v1/auth/phone/verify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-EasyCoder-Client': getEasyCoderClientId(),
        },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        await parseError(response, 'Failed to verify phone login code');
    }

    return response.json();
}

export async function unbindPhone(
    credentials: AuthCredentials,
    input: { code: string },
): Promise<{ phoneE164: null; phoneBound: false }> {
    const API_ENDPOINT = getServerUrl();
    const response = await fetch(`${API_ENDPOINT}/v1/account/phone/unbind`, {
        method: 'POST',
        headers: buildHeaders(credentials),
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        await parseError(response, 'Failed to unbind phone');
    }

    return response.json();
}
