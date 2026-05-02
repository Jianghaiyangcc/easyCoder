import { buildNewMessageUpdate, eventRouter } from "@/app/events/eventRouter";
import { db } from "@/storage/db";
import { allocateSessionSeqBatch, allocateUserSeq } from "@/storage/seq";
import { randomKeyNaked } from "@/utils/randomKeyNaked";
import { z } from "zod";
import { type Fastify } from "../types";

const getMessagesQuerySchema = z.object({
    after_seq: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(500).default(100)
});

const sendMessagesBodySchema = z.object({
    messages: z.array(z.object({
        content: z.string(),
        localId: z.string().min(1),
        kind: z.enum(['text', 'voice']).optional(),
    })).min(1).max(100)
});

const MESSAGE_USAGE_KEY_PREFIX = 'message_sent:';
const MESSAGE_USAGE_WINDOW_DAYS = 30;
const DEFAULT_GLOBAL_MESSAGE_COUNT_LIMIT = 10000;

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

function resolveGlobalMessageCountLimit(): number {
    return parsePositiveInt(process.env.GLOBAL_MESSAGE_COUNT_LIMIT, DEFAULT_GLOBAL_MESSAGE_COUNT_LIMIT);
}

async function hasActiveSubscription(userId: string): Promise<boolean> {
    const revenueCatApiKey = process.env.REVENUECAT_API_KEY;
    if (!revenueCatApiKey) {
        return false;
    }

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
            return false;
        }

        const data = (await response.json()) as { items?: Array<{ entitlement_id: string }> };
        return (data.items?.length ?? 0) > 0;
    } catch {
        return false;
    }
}

type SelectedMessage = {
    id: string;
    seq: number;
    content: unknown;
    localId: string | null;
    createdAt: Date;
    updatedAt: Date;
};

function toResponseMessage(message: SelectedMessage) {
    return {
        id: message.id,
        seq: message.seq,
        content: message.content,
        localId: message.localId,
        createdAt: message.createdAt.getTime(),
        updatedAt: message.updatedAt.getTime()
    };
}

function toSendResponseMessage(message: Omit<SelectedMessage, "content">) {
    return {
        id: message.id,
        seq: message.seq,
        localId: message.localId,
        createdAt: message.createdAt.getTime(),
        updatedAt: message.updatedAt.getTime()
    };
}

export function v3SessionRoutes(app: Fastify) {
    app.get('/v3/sessions/:sessionId/messages', {
        preHandler: app.authenticate,
        schema: {
            params: z.object({
                sessionId: z.string()
            }),
            querystring: getMessagesQuerySchema
        }
    }, async (request, reply) => {
        const userId = request.userId;
        const { sessionId } = request.params;
        const { after_seq, limit } = request.query;

        const session = await db.session.findFirst({
            where: {
                id: sessionId,
                accountId: userId
            },
            select: { id: true }
        });

        if (!session) {
            return reply.code(404).send({ error: 'Session not found' });
        }

        const messages = await db.sessionMessage.findMany({
            where: {
                sessionId,
                seq: { gt: after_seq }
            },
            orderBy: { seq: 'asc' },
            take: limit + 1,
            select: {
                id: true,
                seq: true,
                content: true,
                localId: true,
                createdAt: true,
                updatedAt: true
            }
        });

        const hasMore = messages.length > limit;
        const page = hasMore ? messages.slice(0, limit) : messages;

        return reply.send({
            messages: page.map(toResponseMessage),
            hasMore
        });
    });

    app.post('/v3/sessions/:sessionId/messages', {
        preHandler: app.authenticate,
        schema: {
            params: z.object({
                sessionId: z.string()
            }),
            body: sendMessagesBodySchema,
        }
    }, async (request, reply) => {
        const userId = request.userId;
        const { sessionId } = request.params;
        const { messages } = request.body;
        const globalMessageCountLimit = resolveGlobalMessageCountLimit();
        const subscribed = await hasActiveSubscription(userId);

        const session = await db.session.findFirst({
            where: {
                id: sessionId,
                accountId: userId
            },
            select: { id: true }
        });

        if (!session) {
            return reply.code(404).send({ error: 'Session not found' });
        }

        const firstMessageByLocalId = new Map<string, { localId: string; content: string; kind?: 'text' | 'voice' }>();
        for (const message of messages) {
            if (!firstMessageByLocalId.has(message.localId)) {
                firstMessageByLocalId.set(message.localId, message);
            }
        }

        const uniqueMessages = Array.from(firstMessageByLocalId.values());
        const contentByLocalId = new Map(uniqueMessages.map((message) => [message.localId, message.content]));
        const kindByLocalId = new Map(uniqueMessages.map((message) => [message.localId, message.kind]));
        const usageWindowStart = new Date(Date.now() - MESSAGE_USAGE_WINDOW_DAYS * 86400 * 1000);

        const txResult = await db.$transaction(async (tx) => {
            const localIds = uniqueMessages.map((message) => message.localId);
            const existing = await tx.sessionMessage.findMany({
                where: {
                    sessionId,
                    localId: { in: localIds }
                },
                select: {
                    id: true,
                    seq: true,
                    localId: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            const existingByLocalId = new Map<string, Omit<SelectedMessage, 'content'>>();
            for (const message of existing) {
                if (message.localId) {
                    existingByLocalId.set(message.localId, message);
                }
            }

            const newMessages = uniqueMessages.filter((message) => !existingByLocalId.has(message.localId));

            if (!subscribed && newMessages.length > 0) {
                const usedCount = await tx.usageReport.count({
                    where: {
                        accountId: userId,
                        createdAt: {
                            gte: usageWindowStart,
                        },
                        key: {
                            startsWith: MESSAGE_USAGE_KEY_PREFIX,
                        },
                    },
                });

                if (usedCount + newMessages.length > globalMessageCountLimit) {
                    return {
                        overLimit: {
                            usedCount,
                        },
                        responseMessages: existing,
                        createdMessages: [] as Omit<SelectedMessage, 'content'>[],
                    };
                }
            }

            const seqs = await allocateSessionSeqBatch(sessionId, newMessages.length, tx);

            const createdMessages: Omit<SelectedMessage, 'content'>[] = [];
            for (let i = 0; i < newMessages.length; i += 1) {
                const message = newMessages[i];
                const createdMessage = await tx.sessionMessage.create({
                    data: {
                        sessionId,
                        seq: seqs[i],
                        content: {
                            t: 'encrypted',
                            c: message.content
                        },
                        localId: message.localId
                    },
                    select: {
                        id: true,
                        seq: true,
                        content: true,
                        localId: true,
                        createdAt: true,
                        updatedAt: true
                    }
                });
                createdMessages.push(createdMessage);

                const kind = kindByLocalId.get(message.localId);
                if (kind && message.localId) {
                    await tx.usageReport.create({
                        data: {
                            accountId: userId,
                            sessionId,
                            key: `${MESSAGE_USAGE_KEY_PREFIX}${kind}:${message.localId}`,
                            data: {
                                tokens: {
                                    total: 1,
                                    [kind]: 1,
                                },
                                cost: {
                                    total: 0,
                                },
                            },
                        },
                    });
                }
            }

            const responseMessages = [...existing, ...createdMessages].sort((a, b) => a.seq - b.seq);

            return {
                overLimit: null as { usedCount: number } | null,
                responseMessages,
                createdMessages
            };
        });

        if (txResult.overLimit) {
            return reply.code(429).send({
                error: 'Global message limit reached',
                reason: 'global_message_limit_reached' as const,
                usedCount: txResult.overLimit.usedCount,
                limitCount: globalMessageCountLimit,
                windowDays: MESSAGE_USAGE_WINDOW_DAYS,
            });
        }

        for (const message of txResult.createdMessages) {
            const content = message.localId ? contentByLocalId.get(message.localId) : null;
            if (!content) {
                continue;
            }
            const updSeq = await allocateUserSeq(userId);
            const updatePayload = buildNewMessageUpdate({
                ...message,
                content: {
                    t: 'encrypted',
                    c: content
                }
            }, sessionId, updSeq, randomKeyNaked(12));

            eventRouter.emitUpdate({
                userId,
                payload: updatePayload,
                recipientFilter: { type: 'all-interested-in-session', sessionId }
            });
        }

        return reply.send({
            messages: txResult.responseMessages.map(toSendResponseMessage)
        });
    });
}
