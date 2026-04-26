import { AuthCredentials } from '@/auth/tokenStorage';
import { backoff } from '@/utils/time';
import { getServerUrl } from './serverConfig';
import { getEasyCoderClientId } from './apiSocket';

export type PhoneVerificationScene = 'bind' | 'unbind';

type PhoneApiError = {
    error?: string;
    code?: string;
};

function buildHeaders(credentials: AuthCredentials): Record<string, string> {
    return {
        'Authorization': `Bearer ${credentials.token}`,
        'Content-Type': 'application/json',
        'X-EasyCoder-Client': getEasyCoderClientId(),
    };
}

async function parseError(response: Response, fallback: string): Promise<never> {
    const payload = await response.json().catch(() => null) as PhoneApiError | null;
    throw new Error(payload?.error || fallback);
}

export async function sendPhoneCode(
    credentials: AuthCredentials,
    input: { phone?: string; scene: PhoneVerificationScene },
): Promise<{ phone: string; expiresInSeconds: number; cooldownSeconds: number; scene: PhoneVerificationScene }> {
    const API_ENDPOINT = getServerUrl();
    return backoff(async () => {
        const response = await fetch(`${API_ENDPOINT}/v1/account/phone/send-code`, {
            method: 'POST',
            headers: buildHeaders(credentials),
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            await parseError(response, 'Failed to send phone verification code');
        }

        return response.json();
    });
}

export async function verifyPhoneCode(
    credentials: AuthCredentials,
    input: { phone: string; code: string },
): Promise<{ phoneE164: string; phoneBound: true }> {
    const API_ENDPOINT = getServerUrl();
    return backoff(async () => {
        const response = await fetch(`${API_ENDPOINT}/v1/account/phone/verify`, {
            method: 'POST',
            headers: buildHeaders(credentials),
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            await parseError(response, 'Failed to verify phone code');
        }

        return response.json();
    });
}

export async function unbindPhone(
    credentials: AuthCredentials,
    input: { code: string },
): Promise<{ phoneE164: null; phoneBound: false }> {
    const API_ENDPOINT = getServerUrl();
    return backoff(async () => {
        const response = await fetch(`${API_ENDPOINT}/v1/account/phone/unbind`, {
            method: 'POST',
            headers: buildHeaders(credentials),
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            await parseError(response, 'Failed to unbind phone');
        }

        return response.json();
    });
}
