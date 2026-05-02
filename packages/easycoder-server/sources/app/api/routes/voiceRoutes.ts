import { z } from "zod";
import * as crypto from "crypto";
import * as os from "os";
import * as path from "path";
import * as fs from "fs/promises";
import * as privacyKit from "privacy-kit";
import { execFile } from "child_process";
import { promisify } from "util";
import { Prisma } from "@prisma/client";
import {
    BailianAsrLimitExceededSchema,
    BailianAsrResponseSchema,
    BailianTtsResponseSchema,
    VoiceProviderSchema,
    VoiceConversationResponseSchema,
    VoiceUsageResponseSchema,
} from "@easycoder/wire";
import { type Fastify } from "../types";
import { log } from "@/utils/log";
import { transcribeDashscopeAudio } from "@/modules/dashscopeAsr";
import { synthesizeDashscopeSpeech } from "@/modules/dashscopeTts";
import { db } from "@/storage/db";
import { inTx } from "@/storage/inTx";

const DEFAULT_VOICE_FREE_LIMIT_SECONDS = 1200; // 20 minutes free tier per 30 days (~$0.76 cost)
const DEFAULT_VOICE_FREE_ASR_LIMIT_COUNT = 200;
const VOICE_FREE_LIMIT_SECONDS = parsePositiveInt(process.env.VOICE_FREE_LIMIT_SECONDS, DEFAULT_VOICE_FREE_LIMIT_SECONDS);
const VOICE_FREE_ASR_LIMIT_COUNT = parsePositiveInt(process.env.VOICE_FREE_ASR_LIMIT_COUNT, DEFAULT_VOICE_FREE_ASR_LIMIT_COUNT);
const VOICE_HARD_LIMIT_SECONDS = 18000; // 5 hours absolute cap per 30 days (even with subscription)
const VOICE_MAX_CONVERSATIONS = 100;    // Max conversations trackable per 30 days (ElevenLabs page_size limit)
const ELEVEN_LABS_API = "https://api.elevenlabs.io/v1/convai";
const VOICE_USAGE_WINDOW_DAYS = 30;
const BAILIAN_ASR_IDEMPOTENCY_PREFIX = "bailian_asr";
const FFPROBE_TIMEOUT_MS = 1500;
const execFileAsync = promisify(execFile);

function parsePositiveInt(value: string | undefined, fallback: number): number {
    if (!value) {
        return fallback;
    }
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return parsed;
}

function resolveVoiceLimitSeconds(subscribed: boolean): number {
    return subscribed ? VOICE_HARD_LIMIT_SECONDS : VOICE_FREE_LIMIT_SECONDS;
}

const BailianAsrRequestSchema = z.object({
    requestId: z.string().trim().min(8).max(128).optional(),
    audioBase64: z.string().min(1),
    mimeType: z.string().min(1).default("audio/m4a"),
    language: z.string().optional(),
    model: z.string().optional(),
    enableItn: z.boolean().optional(),
});

const BailianTtsRequestSchema = z.object({
    text: z.string().trim().min(1).max(12000),
    language: z.string().optional(),
    model: z.string().optional(),
    voice: z.string().optional(),
});

function deriveElevenUserId(easycoderUserId: string): string {
    const hmac = crypto.createHmac("sha256", process.env.HANDY_MASTER_SECRET!);
    hmac.update(easycoderUserId);
    const digest = hmac.digest();
    const base64url = digest
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    return `u_${base64url}`;
}

function decodeBase64Url(input: string): Uint8Array {
    const base64 = input
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(Math.ceil(input.length / 4) * 4, "=");
    return privacyKit.decodeBase64(base64);
}

function resolveAudioExtensionFromMimeType(mimeType: string): string {
    const normalizedMimeType = mimeType.trim().toLowerCase();
    if (normalizedMimeType.startsWith("audio/webm")) {
        return "webm";
    }
    if (normalizedMimeType.startsWith("audio/wav") || normalizedMimeType.startsWith("audio/x-wav")) {
        return "wav";
    }
    if (normalizedMimeType.startsWith("audio/mp4") || normalizedMimeType.startsWith("audio/m4a") || normalizedMimeType.startsWith("audio/x-m4a")) {
        return "m4a";
    }
    if (normalizedMimeType.startsWith("audio/mpeg")) {
        return "mp3";
    }

    return "audio";
}

/**
 * Reads exact audio duration using ffprobe from the uploaded base64 payload.
 * Returns duration in milliseconds when it can be parsed, otherwise null.
 */
async function readAudioDurationMs(audioBase64: string, mimeType: string): Promise<number | null> {
    let audioBytes: Uint8Array;
    try {
        audioBytes = privacyKit.decodeBase64(audioBase64);
    } catch {
        return null;
    }

    if (audioBytes.byteLength === 0) {
        return null;
    }

    const extension = resolveAudioExtensionFromMimeType(mimeType);
    const tmpFilePath = path.join(os.tmpdir(), `easycoder-voice-${crypto.randomUUID()}.${extension}`);

    try {
        await fs.writeFile(tmpFilePath, audioBytes);
        const ffprobeResult = await execFileAsync(
            "ffprobe",
            [
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                tmpFilePath,
            ],
            {
                encoding: "utf8",
                timeout: FFPROBE_TIMEOUT_MS,
                windowsHide: true,
            },
        );

        const durationSeconds = Number.parseFloat(String(ffprobeResult.stdout).trim());
        if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
            return null;
        }

        return Math.round(durationSeconds * 1000);
    } finally {
        await fs.unlink(tmpFilePath).catch(() => undefined);
    }
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Records Bailian ASR duration with idempotency guarantees.
 * The same requestId can be retried safely without incrementing usage twice.
 */
async function recordBailianAsrUsage(input: {
    accountId: string;
    requestId: string;
    durationMs: number;
}): Promise<boolean> {
    const normalizedDurationMs = Math.max(0, Math.round(input.durationMs));
    if (normalizedDurationMs <= 0) {
        return false;
    }

    const idempotencyKey = `${BAILIAN_ASR_IDEMPOTENCY_PREFIX}:${input.requestId}`;

    return inTx(async (tx) => {
        try {
            await tx.voiceConversation.create({
                data: {
                    accountId: input.accountId,
                    elevenLabsConversationId: idempotencyKey,
                    durationSecs: Math.max(1, Math.round(normalizedDurationMs / 1000)),
                },
            });
        } catch (error) {
            if (isPrismaUniqueConstraintError(error)) {
                return false;
            }
            throw error;
        }

        return true;
    });
}

interface BailianUsageStats {
    usedSeconds: number;
    asrCount: number;
}

/**
 * Aggregates Bailian ASR usage over the last N days from idempotent ASR events.
 */
async function getBailianUsageStats(accountId: string, windowDays: number): Promise<BailianUsageStats> {
    const aggregate = await db.voiceConversation.aggregate({
        where: {
            accountId,
            elevenLabsConversationId: {
                startsWith: `${BAILIAN_ASR_IDEMPOTENCY_PREFIX}:`,
            },
            createdAt: {
                gte: new Date(Date.now() - windowDays * 86400 * 1000),
            },
        },
        _sum: {
            durationSecs: true,
        },
        _count: {
            _all: true,
        },
    });

    return {
        usedSeconds: aggregate._sum.durationSecs ?? 0,
        asrCount: aggregate._count._all,
    };
}

/**
 * Get a user's voice usage in seconds over the last 30 days.
 * Queries ElevenLabs directly by user_id (set via participant_name on token mint).
 * ElevenLabs is the source of truth — no local DB needed.
 *
 * Returns { usedSeconds, conversationCount }.
 */
async function getElevenLabsVoiceUsage(
    elevenLabsApiKey: string,
    elevenUserId: string,
): Promise<{ usedSeconds: number; conversationCount: number }> {
    const thirtyDaysAgo = new Date(Date.now() - VOICE_USAGE_WINDOW_DAYS * 86400 * 1000).toISOString();

    // Query across all agents — usage is per-user, not per-agent
    const res = await fetch(
        `${ELEVEN_LABS_API}/conversations?user_id=${elevenUserId}&created_after=${thirtyDaysAgo}&page_size=100`,
        { headers: { "xi-api-key": elevenLabsApiKey } }
    );

    if (!res.ok) {
        log({ module: 'voice' }, `ElevenLabs conversations query failed: ${res.status}`);
        return { usedSeconds: 0, conversationCount: 0 };
    }

    const data = (await res.json()) as {
        conversations?: Array<{ call_duration_secs: number }>;
    };

    const conversations = data.conversations || [];
    let usedSeconds = 0;
    for (const c of conversations) {
        usedSeconds += c.call_duration_secs ?? 0;
    }
    return { usedSeconds, conversationCount: conversations.length };
}

async function hasActiveSubscription(userId: string): Promise<boolean> {
    const revenueCatApiKey = process.env.REVENUECAT_API_KEY;
    if (!revenueCatApiKey) return false;

    try {
        const response = await fetch(
            `https://api.revenuecat.com/v2/projects/proj493735ad/customers/${userId}/active_entitlements`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${revenueCatApiKey}`,
                },
            }
        );
        if (!response.ok) {
            log({ module: 'voice' }, `RevenueCat check failed for ${userId}: ${response.status}`);
            return false;
        }
        const data = (await response.json()) as { items?: Array<{ entitlement_id: string }> };
        return (data.items?.length ?? 0) > 0;
    } catch {
        return false;
    }
}

export function voiceRoutes(app: Fastify) {
    app.post('/v1/voice/bailian/asr/transcribe', {
        preHandler: app.authenticate,
        schema: {
            body: BailianAsrRequestSchema,
            response: {
                200: BailianAsrResponseSchema,
                403: BailianAsrLimitExceededSchema,
                400: z.object({ error: z.string() }),
                500: z.object({ error: z.string() }),
            },
        },
    }, async (request, reply) => {
        const dashscopeApiKey = process.env.DASHSCOPE_API_KEY;
        if (!dashscopeApiKey) {
            return reply.code(500).send({ error: 'DASHSCOPE_API_KEY not configured' });
        }

        const { requestId, audioBase64, mimeType, language, model, enableItn } = request.body;
        const resolvedRequestId = requestId?.trim() || crypto.randomUUID();

        if (audioBase64.length < 16) {
            return reply.code(400).send({ error: 'Invalid audio payload' });
        }

        const [{ usedSeconds, asrCount }, subscribed] = await Promise.all([
            getBailianUsageStats(request.userId, VOICE_USAGE_WINDOW_DAYS),
            hasActiveSubscription(request.userId),
        ]);

        if (usedSeconds >= VOICE_HARD_LIMIT_SECONDS) {
            return reply.code(403).send({
                reason: 'voice_hard_limit_reached' as const,
                usedSeconds,
                limitSeconds: VOICE_HARD_LIMIT_SECONDS,
                error: 'Voice hard limit reached',
            });
        }

        if (!subscribed) {
            if (usedSeconds >= VOICE_FREE_LIMIT_SECONDS) {
                return reply.code(403).send({
                    reason: 'subscription_required' as const,
                    usedSeconds,
                    limitSeconds: VOICE_FREE_LIMIT_SECONDS,
                    error: 'Subscription required for additional voice usage',
                });
            }

            if (asrCount >= VOICE_FREE_ASR_LIMIT_COUNT) {
                return reply.code(403).send({
                    reason: 'subscription_required' as const,
                    usedSeconds,
                    limitSeconds: VOICE_FREE_LIMIT_SECONDS,
                    error: 'Subscription required for additional voice ASR usage',
                });
            }
        }

        try {
            const result = await transcribeDashscopeAudio({
                apiKey: dashscopeApiKey,
                audioBase64,
                mimeType,
                language,
                model,
                enableItn,
            });

            try {
                const durationMs = await readAudioDurationMs(audioBase64, mimeType);
                if (durationMs !== null) {
                    await recordBailianAsrUsage({
                        accountId: request.userId,
                        requestId: resolvedRequestId,
                        durationMs,
                    });
                }
            } catch (usageError) {
                log({ module: "voice" }, `Failed to persist Bailian usage for user ${request.userId}: ${usageError}`);
            }

            return reply.send({
                provider: 'bailian' as const,
                transcript: result.transcript,
                model: result.model,
            });
        } catch (error) {
            log({ module: 'voice' }, `Bailian ASR failed for user ${request.userId}: ${error}`);
            return reply.code(500).send({ error: 'Failed to transcribe audio' });
        }
    });

    app.post('/v1/voice/bailian/tts', {
        preHandler: app.authenticate,
        schema: {
            body: BailianTtsRequestSchema,
            response: {
                200: BailianTtsResponseSchema,
                500: z.object({ error: z.string() }),
            },
        },
    }, async (request, reply) => {
        const dashscopeApiKey = process.env.DASHSCOPE_API_KEY;
        if (!dashscopeApiKey) {
            return reply.code(500).send({ error: 'DASHSCOPE_API_KEY not configured' });
        }

        const { text, model, voice } = request.body;

        try {
            const result = await synthesizeDashscopeSpeech({
                apiKey: dashscopeApiKey,
                text,
                model,
                voice,
            });

            return reply.send({
                provider: 'bailian' as const,
                audioUrl: result.audioUrl,
                model: result.model,
                voice: result.voice,
                expiresAt: result.expiresAt,
            });
        } catch (error) {
            log({ module: 'voice' }, `Bailian TTS failed for user ${request.userId}: ${error}`);
            return reply.code(500).send({ error: 'Failed to synthesize speech' });
        }
    });

    app.post('/v1/voice/conversations', {
        preHandler: app.authenticate,
        schema: {
            body: z.object({
                agentId: z.string(),
            }),
            response: {
                200: VoiceConversationResponseSchema,
                500: z.object({ error: z.string() }),
            },
        },
    }, async (request, reply) => {
        const userId = request.userId;
        const { agentId } = request.body;

        log({ module: 'voice' }, `Voice token request from user ${userId}`);

        const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
        if (!elevenLabsApiKey) {
            return reply.code(500).send({ error: 'ELEVENLABS_API_KEY not configured' });
        }
        if (!process.env.REVENUECAT_API_KEY) {
            return reply.code(500).send({ error: 'REVENUECAT_API_KEY not configured' });
        }

        const elevenUserId = deriveElevenUserId(userId);

        // Check usage from ElevenLabs directly
        const { usedSeconds, conversationCount } = await getElevenLabsVoiceUsage(elevenLabsApiKey, elevenUserId);
        log({ module: 'voice' }, `User ${userId}: ${usedSeconds}s used, ${conversationCount} convos (free=${VOICE_FREE_LIMIT_SECONDS}s, hard=${VOICE_HARD_LIMIT_SECONDS}s)`);

        // Conversation count cap — we can only track 100 per query (ElevenLabs page_size limit)
        if (conversationCount >= VOICE_MAX_CONVERSATIONS) {
            return reply.send({
                allowed: false as const,
                reason: 'voice_conversation_limit_reached' as const,
                usedSeconds,
                limitSeconds: VOICE_HARD_LIMIT_SECONDS,
                agentId,
            });
        }

        // Hard cap — 5 hours, no exceptions
        if (usedSeconds >= VOICE_HARD_LIMIT_SECONDS) {
            return reply.send({
                allowed: false as const,
                reason: 'voice_hard_limit_reached' as const,
                usedSeconds,
                limitSeconds: VOICE_HARD_LIMIT_SECONDS,
                agentId,
            });
        }

        // Free tier — 20 minutes, then need subscription
        if (usedSeconds >= VOICE_FREE_LIMIT_SECONDS) {
            const subscribed = await hasActiveSubscription(userId);
            log({ module: 'voice' }, `User ${userId}: subscription check = ${subscribed}`);
            if (!subscribed) {
                return reply.send({
                    allowed: false as const,
                    reason: 'subscription_required' as const,
                    usedSeconds,
                    limitSeconds: VOICE_FREE_LIMIT_SECONDS,
                    agentId,
                });
            }
        }

        // Get conversation token (JWT for WebRTC) with user identity
        try {
            const tokenRes = await fetch(
                `${ELEVEN_LABS_API}/conversation/token?agent_id=${agentId}&participant_name=${elevenUserId}`,
                { headers: { 'xi-api-key': elevenLabsApiKey } }
            );

            if (!tokenRes.ok) {
                log({ module: 'voice' }, `Failed to get conversation token for user ${userId}: ${tokenRes.status}`);
                return reply.code(500).send({ error: 'Failed to get voice credentials' });
            }

            const { token: conversationToken } = (await tokenRes.json()) as { token: string };

            // Extract conversation_id from JWT payload (LiveKit room name contains it)
            const jwtPayloadPart = conversationToken.split('.')[1];
            if (!jwtPayloadPart) {
                log({ module: "voice" }, `Invalid JWT payload for user ${userId}`);
                return reply.code(500).send({ error: "Failed to parse voice credentials" });
            }
            const jwtPayload = JSON.parse(new TextDecoder().decode(decodeBase64Url(jwtPayloadPart)));
            const conversationId = (jwtPayload.video?.room || '').match(/(conv_[a-zA-Z0-9]+)/)?.[0];

            if (!conversationId) {
                log({ module: 'voice' }, `No conversation_id in JWT for user ${userId}`);
                return reply.code(500).send({ error: 'Failed to get conversation ID' });
            }

            log({ module: 'voice' }, `Voice token issued for user ${userId}, conv=${conversationId}`);
            return reply.send({
                allowed: true as const,
                conversationToken,
                conversationId,
                agentId,
                elevenUserId,
                usedSeconds,
                limitSeconds: usedSeconds >= VOICE_FREE_LIMIT_SECONDS
                    ? VOICE_HARD_LIMIT_SECONDS
                    : resolveVoiceLimitSeconds(false),
            });
        } catch (error) {
            log({ module: 'voice' }, `ElevenLabs request error for user ${userId}: ${error}`);
            return reply.code(500).send({ error: 'Failed to get voice credentials' });
        }
    });

    /**
     * Returns provider-aware voice usage over the last 30 days.
     * Bailian usage is aggregated from internal idempotent ASR events, ElevenLabs usage
     * is fetched from provider APIs, and top-level fields mirror the selected provider.
     */
    app.get('/v1/voice/usage', {
        preHandler: app.authenticate,
        schema: {
            querystring: z.object({
                provider: VoiceProviderSchema.optional(),
            }),
            response: {
                200: VoiceUsageResponseSchema,
                500: z.object({ error: z.string() }),
            },
        },
    }, async (request, reply) => {
        const userId = request.userId;
        const currentProvider = (request.query.provider ?? 'elevenlabs') as 'bailian' | 'elevenlabs';

        const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
        const elevenUserId = elevenLabsApiKey ? deriveElevenUserId(userId) : null;

        try {
            const [{ usedSeconds: elevenLabsUsedSeconds, conversationCount }, bailianUsageStats, subscribed] = await Promise.all([
                elevenLabsApiKey && elevenUserId
                    ? getElevenLabsVoiceUsage(elevenLabsApiKey, elevenUserId)
                    : Promise.resolve({ usedSeconds: 0, conversationCount: 0 }),
                getBailianUsageStats(userId, VOICE_USAGE_WINDOW_DAYS),
                hasActiveSubscription(userId),
            ]);

            const defaultLimitSeconds = resolveVoiceLimitSeconds(subscribed);

            const providers: {
                bailian: {
                    provider: "bailian";
                    usedSeconds: number;
                    limitSeconds: number;
                    conversationCount: number;
                    conversationLimit: number;
                };
                elevenlabs: {
                    provider: "elevenlabs";
                    usedSeconds: number;
                    limitSeconds: number;
                    conversationCount: number;
                    conversationLimit: number;
                };
            } = {
                bailian: {
                    provider: 'bailian',
                    usedSeconds: bailianUsageStats.usedSeconds,
                    limitSeconds: defaultLimitSeconds,
                    conversationCount: 0,
                    conversationLimit: 0,
                },
                elevenlabs: {
                    provider: 'elevenlabs',
                    usedSeconds: elevenLabsUsedSeconds,
                    limitSeconds: defaultLimitSeconds,
                    conversationCount,
                    conversationLimit: VOICE_MAX_CONVERSATIONS,
                },
            };

            const current = providers[currentProvider];

            return reply.send({
                windowDays: VOICE_USAGE_WINDOW_DAYS,
                currentProvider,
                current,
                providers,
                usedSeconds: current.usedSeconds,
                limitSeconds: current.limitSeconds,
                conversationCount: current.conversationCount,
                conversationLimit: current.conversationLimit,
                elevenUserId,
            });
        } catch (error) {
            log({ module: 'voice' }, `Failed to get voice usage for user ${userId}: ${error}`);
            return reply.code(500).send({ error: 'Failed to get voice usage' });
        }
    });
}
