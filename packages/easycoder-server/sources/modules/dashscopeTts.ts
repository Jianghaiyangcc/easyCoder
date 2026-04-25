interface DashscopeTtsInput {
    apiKey: string;
    text: string;
    model?: string;
    voice?: string;
    baseUrl?: string;
}

interface DashscopeTtsResult {
    audioUrl: string;
    model: string;
    voice: string;
    expiresAt: number | null;
}

interface DashscopeTtsPayload {
    output?: {
        audio?: {
            url?: string;
            expires_at?: number;
        };
    };
    message?: string;
    error?: {
        message?: string;
    };
}

const DEFAULT_DASHSCOPE_TTS_BASE_URL = "https://dashscope.aliyuncs.com/api/v1";
const DEFAULT_DASHSCOPE_TTS_MODEL = "qwen3-tts-flash";
const DEFAULT_DASHSCOPE_TTS_VOICE = "Cherry";

function inferDashScopeLanguageType(text: string): "zh" | "en" {
    return /[\u4e00-\u9fff]/u.test(text) ? "zh" : "en";
}

export async function synthesizeDashscopeSpeech(input: DashscopeTtsInput): Promise<DashscopeTtsResult> {
    const resolvedModel = input.model || process.env.DASHSCOPE_TTS_MODEL || DEFAULT_DASHSCOPE_TTS_MODEL;
    const resolvedVoice = input.voice || process.env.DASHSCOPE_TTS_VOICE || DEFAULT_DASHSCOPE_TTS_VOICE;
    const resolvedBaseUrl = input.baseUrl || process.env.DASHSCOPE_API_BASE_URL || DEFAULT_DASHSCOPE_TTS_BASE_URL;

    const endpoint = `${resolvedBaseUrl.replace(/\/$/, "")}/services/aigc/multimodal-generation/generation`;
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${input.apiKey}`,
        },
        body: JSON.stringify({
            model: resolvedModel,
            input: {
                text: input.text,
                voice: resolvedVoice,
                language_type: inferDashScopeLanguageType(input.text),
            },
        }),
    });

    const payload = (await response.json().catch(() => null)) as DashscopeTtsPayload | null;
    if (!response.ok) {
        const message =
            payload?.error?.message ||
            payload?.message ||
            `DashScope TTS request failed (${response.status})`;
        throw new Error(message);
    }

    const audioUrl = payload?.output?.audio?.url?.trim();
    if (!audioUrl) {
        throw new Error("DashScope TTS returned no audio URL");
    }

    return {
        audioUrl,
        model: resolvedModel,
        voice: resolvedVoice,
        expiresAt: payload?.output?.audio?.expires_at ?? null,
    };
}
