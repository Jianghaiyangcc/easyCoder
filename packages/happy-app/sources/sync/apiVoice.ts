import {
    BailianAsrResponseSchema,
    BailianTtsResponseSchema,
    VoiceConversationResponseSchema,
    VoiceUsageResponseSchema,
    type BailianAsrResponse,
    type BailianTtsResponse,
    type VoiceConversationResponse,
    type VoiceUsageResponse,
} from '@slopus/happy-wire';
import { AuthCredentials } from '@/auth/tokenStorage';
import { getServerUrl } from './serverConfig';
import { getHappyClientId } from './apiSocket';
import { config } from '@/config';

export type { VoiceConversationResponse, VoiceUsageResponse, BailianAsrResponse, BailianTtsResponse };

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
            'X-Happy-Client': getHappyClientId(),
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
    credentials: AuthCredentials
): Promise<VoiceUsageResponse> {
    const serverUrl = getServerUrl();

    const response = await fetch(`${serverUrl}/v1/voice/usage`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${credentials.token}`,
            'X-Happy-Client': getHappyClientId(),
        },
    });

    if (!response.ok) {
        throw new Error(`Voice usage request failed: ${response.status}`);
    }

    return VoiceUsageResponseSchema.parse(await response.json());
}

export interface BailianAsrRequest {
    audioBase64: string;
    mimeType: string;
    language?: string;
    model?: string;
    enableItn?: boolean;
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

    const response = await fetch(`${serverUrl}/v1/voice/bailian/asr/transcribe`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${credentials.token}`,
            'Content-Type': 'application/json',
            'X-Happy-Client': getHappyClientId(),
        },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        throw new Error(`Bailian ASR request failed: ${response.status}`);
    }

    return BailianAsrResponseSchema.parse(await response.json());
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
            'X-Happy-Client': getHappyClientId(),
        },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        throw new Error(`Bailian TTS request failed: ${response.status}`);
    }

    return BailianTtsResponseSchema.parse(await response.json());
}
