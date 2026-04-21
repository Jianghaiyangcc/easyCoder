interface DashscopeAsrInput {
    apiKey: string;
    audioBase64: string;
    mimeType: string;
    model?: string;
    language?: string;
    enableItn?: boolean;
    baseUrl?: string;
}

interface DashscopeAsrResult {
    transcript: string;
    model: string;
}

const DEFAULT_DASHSCOPE_ASR_BASE_URL = "https://dashscope.aliyuncs.com/api/v1";
const DEFAULT_DASHSCOPE_ASR_MODEL = "qwen3-asr-flash";

function normalizeDashscopeLanguage(language?: string): string | undefined {
    const normalized = language?.trim().toLowerCase();
    if (!normalized) {
        return undefined;
    }

    if (normalized.startsWith("zh")) {
        return "zh";
    }
    if (normalized.startsWith("en")) {
        return "en";
    }
    if (normalized.startsWith("ja")) {
        return "ja";
    }
    if (/^[a-z]{2}$/u.test(normalized)) {
        return normalized;
    }

    return undefined;
}

function resolveTranscript(payload: unknown): string {
    if (!payload || typeof payload !== "object") {
        return "";
    }

    const directText = (payload as { text?: unknown }).text;
    if (typeof directText === "string") {
        return directText.trim();
    }

    const outputText = (payload as { output?: { text?: unknown } }).output?.text;
    if (typeof outputText === "string") {
        return outputText.trim();
    }

    const segments = (payload as { segments?: Array<{ text?: unknown }> }).segments;
    if (Array.isArray(segments)) {
        const merged = segments
            .map((segment) => (typeof segment?.text === "string" ? segment.text.trim() : ""))
            .filter(Boolean)
            .join(" ");
        if (merged) {
            return merged;
        }
    }

    const messageContent = (
        payload as {
            output?: {
                choices?: Array<{
                    message?: {
                        content?: Array<{ text?: unknown }> | string;
                    };
                }>;
            };
        }
    ).output?.choices?.[0]?.message?.content;

    if (typeof messageContent === "string") {
        return messageContent.trim();
    }

    if (Array.isArray(messageContent)) {
        const merged = messageContent
            .map((item) => (typeof item?.text === "string" ? item.text.trim() : ""))
            .filter(Boolean)
            .join(" ");
        if (merged) {
            return merged;
        }
    }

    return "";
}

export async function transcribeDashscopeAudio(input: DashscopeAsrInput): Promise<DashscopeAsrResult> {
    const resolvedModel = input.model || process.env.DASHSCOPE_ASR_MODEL || DEFAULT_DASHSCOPE_ASR_MODEL;
    const resolvedBaseUrl = input.baseUrl || process.env.DASHSCOPE_API_BASE_URL || DEFAULT_DASHSCOPE_ASR_BASE_URL;
    const normalizedLanguage = normalizeDashscopeLanguage(input.language);

    const requestBody = {
        model: resolvedModel,
        input: {
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            audio: `data:${input.mimeType || "audio/m4a"};base64,${input.audioBase64}`,
                        },
                    ],
                },
            ],
        },
        parameters: {
            result_format: "message",
            asr_options: {
                enable_itn: input.enableItn ?? false,
                ...(normalizedLanguage
                    ? { language: normalizedLanguage }
                    : {}),
            },
        },
    };

    const endpoint = `${resolvedBaseUrl.replace(/\/$/, "")}/services/aigc/multimodal-generation/generation`;
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${input.apiKey}`,
        },
        body: JSON.stringify(requestBody),
    });

    const payload = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) {
        const message =
            (payload as { error?: { message?: string } } | null)?.error?.message ||
            (payload as { message?: string } | null)?.message ||
            `DashScope ASR request failed (${response.status})`;
        throw new Error(message);
    }

    const transcript = resolveTranscript(payload);
    if (!transcript) {
        throw new Error("DashScope ASR returned empty transcript");
    }

    return {
        transcript,
        model: resolvedModel,
    };
}
