import {
    BailianAsrLimitExceededSchema,
    BailianAsrResponseSchema,
    BailianTtsResponseSchema,
    VoiceConversationResponseSchema,
    VoiceUsageResponseSchema,
    type BailianAsrResponse,
    type BailianAsrLimitExceeded,
    type BailianTtsResponse,
    type VoiceLimitReason,
    type VoiceConversationResponse,
    type VoiceProvider,
    type VoiceUsageResponse,
} from '@easycoder/wire';
import { AuthCredentials } from '@/auth/tokenStorage';
import { getServerUrl } from './serverConfig';
import { getEasyCoderClientId } from './apiSocket';
import { config } from '@/config';

export type { VoiceConversationResponse, VoiceUsageResponse, BailianAsrResponse, BailianTtsResponse };

export class VoiceQuotaError extends Error {
    readonly reason: VoiceLimitReason;
    readonly usedSeconds: number;
    readonly limitSeconds: number;

    constructor(data: BailianAsrLimitExceeded) {
        super(data.error);
        this.name = 'VoiceQuotaError';
        this.reason = data.reason;
        this.usedSeconds = data.usedSeconds;
        this.limitSeconds = data.limitSeconds;
    }
}

export function isVoiceQuotaError(error: unknown): error is VoiceQuotaError {
    return error instanceof VoiceQuotaError;
}

export async function fetchVoiceCredentials(
    credentials: AuthCredentials,
    sessionId: string
): Promise<VoiceConversationResponse> {
    const serverUrl = getServerUrl();

    const agentId = config.elevenLabsAgentId;

    if (!agentId) {
        throw new Error('Agent ID not configured');
    }

    const response = await fetch(`${serverUrl}/v1/voice/conversations`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${credentials.token}`,
            'Content-Type': 'application/json',
            'X-EasyCoder-Client': getEasyCoderClientId(),
        },
        body: JSON.stringify({
            agentId
        })
    });

    if (!response.ok) {
        throw new Error(`Voice token request failed: ${response.status}`);
    }

    return VoiceConversationResponseSchema.parse(await response.json());
}

export async function fetchVoiceUsage(
    credentials: AuthCredentials,
    provider: VoiceProvider,
): Promise<VoiceUsageResponse> {
    const serverUrl = getServerUrl();
    const query = new URLSearchParams({
        provider,
    });

    const response = await fetch(`${serverUrl}/v1/voice/usage?${query.toString()}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${credentials.token}`,
            'X-EasyCoder-Client': getEasyCoderClientId(),
        },
    });

    if (!response.ok) {
        throw new Error(`Voice usage request failed: ${response.status}`);
    }

    return VoiceUsageResponseSchema.parse(await response.json());
}

export interface BailianAsrRequest {
    requestId?: string;
    audioBase64: string;
    mimeType: string;
    language?: string;
    model?: string;
    enableItn?: boolean;
}

function normalizeAsrMimeType(mimeType: string): string {
    const normalized = mimeType.trim().toLowerCase();
    if (!normalized) {
        return 'audio/m4a';
    }

    const baseMimeType = normalized.split(';')[0]?.trim() || normalized;

    if (baseMimeType === 'audio/x-m4a') {
        return 'audio/m4a';
    }
    if (baseMimeType === 'audio/x-wav') {
        return 'audio/wav';
    }
    if (baseMimeType === 'audio/webm') {
        return 'audio/webm';
    }

    return baseMimeType;
}

export interface BailianTtsRequest {
    text: string;
    language?: string;
    model?: string;
    voice?: string;
}

export async function transcribeBailianAudio(
    credentials: AuthCredentials,
    input: BailianAsrRequest,
): Promise<BailianAsrResponse> {
    const serverUrl = getServerUrl();
    const sanitizedInput: BailianAsrRequest = {
        ...input,
        mimeType: normalizeAsrMimeType(input.mimeType),
    };

    const response = await fetch(`${serverUrl}/v1/voice/bailian/asr/transcribe`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${credentials.token}`,
            'Content-Type': 'application/json',
            'X-EasyCoder-Client': getEasyCoderClientId(),
        },
        body: JSON.stringify(sanitizedInput),
    });

    const responseJson = await response.json();
    if (!response.ok) {
        const maybeLimitExceeded = BailianAsrLimitExceededSchema.safeParse(responseJson);
        if (maybeLimitExceeded.success) {
            throw new VoiceQuotaError(maybeLimitExceeded.data);
        }
        throw new Error(`Bailian ASR request failed: ${response.status}`);
    }

    return BailianAsrResponseSchema.parse(responseJson);
}

export async function fetchBailianTts(
    credentials: AuthCredentials,
    input: BailianTtsRequest,
): Promise<BailianTtsResponse> {
    const serverUrl = getServerUrl();

    const response = await fetch(`${serverUrl}/v1/voice/bailian/tts`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${credentials.token}`,
            'Content-Type': 'application/json',
            'X-EasyCoder-Client': getEasyCoderClientId(),
        },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        throw new Error(`Bailian TTS request failed: ${response.status}`);
    }

    return BailianTtsResponseSchema.parse(await response.json());
}
