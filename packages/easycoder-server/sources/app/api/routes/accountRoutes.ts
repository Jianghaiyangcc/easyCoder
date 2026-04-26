import { eventRouter, buildUpdateAccountUpdate } from "@/app/events/eventRouter";
import { db } from "@/storage/db";
import { Fastify } from "../types";
import { getPublicUrl } from "@/storage/files";
import { z } from "zod";
import { randomKeyNaked } from "@/utils/randomKeyNaked";
import { allocateUserSeq } from "@/storage/seq";
import { log } from "@/utils/log";
import {
    listPhoneVerificationCodes,
    PhoneVerificationError,
    sendPhoneVerificationCode,
    verifyAndBindPhone,
    verifyAndUnbindPhone,
} from "../services/phoneVerificationService";

export function accountRoutes(app: Fastify) {
    app.get('/v1/account/profile', {
        preHandler: app.authenticate,
    }, async (request, reply) => {
        const userId = request.userId;
        const user = await db.account.findUniqueOrThrow({
            where: { id: userId },
            select: {
                firstName: true,
                lastName: true,
                username: true,
                avatar: true,
                githubUser: true,
                phoneE164: true,
            }
        });
        const connectedVendors = new Set((await db.serviceAccountToken.findMany({ where: { accountId: userId } })).map(t => t.vendor));
        return reply.send({
            id: userId,
            timestamp: Date.now(),
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            avatar: user.avatar ? { ...user.avatar, url: getPublicUrl(user.avatar.path) } : null,
            github: user.githubUser ? user.githubUser.profile : null,
            connectedServices: Array.from(connectedVendors),
            phoneE164: user.phoneE164,
            phoneBound: !!user.phoneE164,
        });
    });

    app.post('/v1/account/phone/send-code', {
        preHandler: app.authenticate,
        schema: {
            body: z.object({
                phone: z.string().trim().min(1).optional(),
                scene: z.enum(['bind', 'unbind']).default('bind'),
            }),
        },
    }, async (request, reply) => {
        try {
            const result = await sendPhoneVerificationCode({
                accountId: request.userId,
                phone: request.body.phone,
                scene: request.body.scene,
                requestIp: request.ip,
            });

            return reply.send({
                success: true,
                phone: result.phoneE164,
                scene: request.body.scene,
                expiresInSeconds: result.expiresInSeconds,
                cooldownSeconds: result.cooldownSeconds,
            });
        } catch (error) {
            if (error instanceof PhoneVerificationError) {
                return reply.code(error.statusCode).send({
                    error: error.message,
                    code: error.code,
                });
            }
            throw error;
        }
    });

    app.post('/v1/account/phone/verify', {
        preHandler: app.authenticate,
        schema: {
            body: z.object({
                phone: z.string().trim().min(1),
                code: z.string().trim().min(1),
                secret: z.string().trim().min(1),
            }),
        },
    }, async (request, reply) => {
        try {
            const result = await verifyAndBindPhone({
                accountId: request.userId,
                phone: request.body.phone,
                code: request.body.code,
                secret: request.body.secret,
            });

            const updSeq = await allocateUserSeq(request.userId);
            const updatePayload = buildUpdateAccountUpdate(request.userId, {
                phoneE164: result.phoneE164,
                phoneBound: result.phoneBound,
            }, updSeq, randomKeyNaked(12));

            eventRouter.emitUpdate({
                userId: request.userId,
                payload: updatePayload,
                recipientFilter: { type: 'user-scoped-only' },
            });

            return reply.send({
                success: true,
                phoneE164: result.phoneE164,
                phoneBound: true,
            });
        } catch (error) {
            if (error instanceof PhoneVerificationError) {
                return reply.code(error.statusCode).send({
                    error: error.message,
                    code: error.code,
                });
            }
            throw error;
        }
    });

    app.post('/v1/account/phone/unbind', {
        preHandler: app.authenticate,
        schema: {
            body: z.object({
                code: z.string().trim().min(1),
            }),
        },
    }, async (request, reply) => {
        try {
            const result = await verifyAndUnbindPhone({
                accountId: request.userId,
                code: request.body.code,
            });

            const updSeq = await allocateUserSeq(request.userId);
            const updatePayload = buildUpdateAccountUpdate(request.userId, {
                phoneE164: result.phoneE164,
                phoneBound: result.phoneBound,
            }, updSeq, randomKeyNaked(12));

            eventRouter.emitUpdate({
                userId: request.userId,
                payload: updatePayload,
                recipientFilter: { type: 'user-scoped-only' },
            });

            return reply.send({
                success: true,
                phoneE164: null,
                phoneBound: false,
            });
        } catch (error) {
            if (error instanceof PhoneVerificationError) {
                return reply.code(error.statusCode).send({
                    error: error.message,
                    code: error.code,
                });
            }
            throw error;
        }
    });

    app.get('/v1/account/phone/codes', {
        preHandler: app.authenticate,
        schema: {
            querystring: z.object({
                limit: z.coerce.number().int().min(1).max(100).default(20),
            }),
            response: {
                200: z.object({
                    codes: z.array(z.object({
                        id: z.string(),
                        phoneE164: z.string(),
                        scene: z.enum(['bind', 'login', 'unbind']),
                        code: z.string(),
                        attempts: z.number(),
                        maxAttempts: z.number(),
                        expiresAt: z.number(),
                        consumedAt: z.number().nullable(),
                        requestIp: z.string().nullable(),
                        providerCode: z.string().nullable(),
                        providerMessage: z.string().nullable(),
                        createdAt: z.number(),
                    })),
                }),
            },
        },
    }, async (request, reply) => {
        const codes = await listPhoneVerificationCodes({
            accountId: request.userId,
            limit: request.query.limit,
        });

        return reply.send({ codes });
    });

    // Get Account Settings API
    app.get('/v1/account/settings', {
        preHandler: app.authenticate,
        schema: {
            response: {
                200: z.object({
                    settings: z.string().nullable(),
                    settingsVersion: z.number()
                }),
                500: z.object({
                    error: z.literal('Failed to get account settings')
                })
            }
        }
    }, async (request, reply) => {
        try {
            const user = await db.account.findUnique({
                where: { id: request.userId },
                select: { settings: true, settingsVersion: true }
            });

            if (!user) {
                return reply.code(500).send({ error: 'Failed to get account settings' });
            }

            return reply.send({
                settings: user.settings,
                settingsVersion: user.settingsVersion
            });
        } catch (error) {
            return reply.code(500).send({ error: 'Failed to get account settings' });
        }
    });

    // Update Account Settings API
    app.post('/v1/account/settings', {
        schema: {
            body: z.object({
                settings: z.string().nullable(),
                expectedVersion: z.number().int().min(0)
            }),
            response: {
                200: z.union([z.object({
                    success: z.literal(true),
                    version: z.number()
                }), z.object({
                    success: z.literal(false),
                    error: z.literal('version-mismatch'),
                    currentVersion: z.number(),
                    currentSettings: z.string().nullable()
                })]),
                500: z.object({
                    success: z.literal(false),
                    error: z.literal('Failed to update account settings')
                })
            }
        },
        preHandler: app.authenticate
    }, async (request, reply) => {
        const userId = request.userId;
        const { settings, expectedVersion } = request.body;

        try {
            // Get current user data for version check
            const currentUser = await db.account.findUnique({
                where: { id: userId },
                select: { settings: true, settingsVersion: true }
            });

            if (!currentUser) {
                return reply.code(500).send({
                    success: false,
                    error: 'Failed to update account settings'
                });
            }

            // Check current version
            if (currentUser.settingsVersion !== expectedVersion) {
                return reply.code(200).send({
                    success: false,
                    error: 'version-mismatch',
                    currentVersion: currentUser.settingsVersion,
                    currentSettings: currentUser.settings
                });
            }

            // Update settings with version check
            const { count } = await db.account.updateMany({
                where: {
                    id: userId,
                    settingsVersion: expectedVersion
                },
                data: {
                    settings: settings,
                    settingsVersion: expectedVersion + 1,
                    updatedAt: new Date()
                }
            });

            if (count === 0) {
                // Re-fetch to get current version
                const account = await db.account.findUnique({
                    where: { id: userId }
                });
                return reply.code(200).send({
                    success: false,
                    error: 'version-mismatch',
                    currentVersion: account?.settingsVersion || 0,
                    currentSettings: account?.settings || null
                });
            }

            // Generate update for connected clients
            const updSeq = await allocateUserSeq(userId);
            const settingsUpdate = {
                value: settings,
                version: expectedVersion + 1
            };

            // Send account update to user-scoped connections only
            const updatePayload = buildUpdateAccountUpdate(userId, { settings: settingsUpdate }, updSeq, randomKeyNaked(12));
            eventRouter.emitUpdate({
                userId,
                payload: updatePayload,
                recipientFilter: { type: 'user-scoped-only' }
            });

            return reply.send({
                success: true,
                version: expectedVersion + 1
            });
        } catch (error) {
            log({ module: 'api', level: 'error' }, `Failed to update account settings: ${error}`);
            return reply.code(500).send({
                success: false,
                error: 'Failed to update account settings'
            });
        }
    });

    app.post('/v1/usage/query', {
        schema: {
            body: z.object({
                sessionId: z.string().nullish(),
                startTime: z.number().int().positive().nullish(),
                endTime: z.number().int().positive().nullish(),
                groupBy: z.enum(['hour', 'day']).nullish()
            })
        },
        preHandler: app.authenticate
    }, async (request, reply) => {
        const userId = request.userId;
        const { sessionId, startTime, endTime, groupBy } = request.body;
        const actualGroupBy = groupBy || 'day';

        try {
            // Build query conditions
            const where: {
                accountId: string;
                sessionId?: string | null;
                createdAt?: {
                    gte?: Date;
                    lte?: Date;
                };
            } = {
                accountId: userId
            };

            if (sessionId) {
                // Verify session belongs to user
                const session = await db.session.findFirst({
                    where: {
                        id: sessionId,
                        accountId: userId
                    }
                });
                if (!session) {
                    return reply.code(404).send({ error: 'Session not found' });
                }
                where.sessionId = sessionId;
            }

            if (startTime || endTime) {
                where.createdAt = {};
                if (startTime) {
                    where.createdAt.gte = new Date(startTime * 1000);
                }
                if (endTime) {
                    where.createdAt.lte = new Date(endTime * 1000);
                }
            }

            // Fetch usage reports
            const reports = await db.usageReport.findMany({
                where,
                orderBy: {
                    createdAt: 'desc'
                }
            });

            // Aggregate data by time period
            const aggregated = new Map<string, {
                tokens: Record<string, number>;
                cost: Record<string, number>;
                count: number;
                timestamp: number;
            }>();

            for (const report of reports) {
                const data = report.data as PrismaJson.UsageReportData;
                const date = new Date(report.createdAt);

                // Calculate timestamp based on groupBy
                let timestamp: number;
                if (actualGroupBy === 'hour') {
                    // Round down to hour
                    const hourDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0, 0);
                    timestamp = Math.floor(hourDate.getTime() / 1000);
                } else {
                    // Round down to day
                    const dayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
                    timestamp = Math.floor(dayDate.getTime() / 1000);
                }

                const key = timestamp.toString();

                if (!aggregated.has(key)) {
                    aggregated.set(key, {
                        tokens: {},
                        cost: {},
                        count: 0,
                        timestamp
                    });
                }

                const agg = aggregated.get(key)!;
                agg.count++;

                // Aggregate tokens
                for (const [tokenKey, tokenValue] of Object.entries(data.tokens)) {
                    if (typeof tokenValue === 'number') {
                        agg.tokens[tokenKey] = (agg.tokens[tokenKey] || 0) + tokenValue;
                    }
                }

                // Aggregate costs
                for (const [costKey, costValue] of Object.entries(data.cost)) {
                    if (typeof costValue === 'number') {
                        agg.cost[costKey] = (agg.cost[costKey] || 0) + costValue;
                    }
                }
            }

            // Convert to array and sort by timestamp
            const result = Array.from(aggregated.values())
                .map(data => ({
                    timestamp: data.timestamp,
                    tokens: data.tokens,
                    cost: data.cost,
                    reportCount: data.count
                }))
                .sort((a, b) => a.timestamp - b.timestamp);

            return reply.send({
                usage: result,
                groupBy: actualGroupBy,
                totalReports: reports.length
            });
        } catch (error) {
            log({ module: 'api', level: 'error' }, `Failed to query usage reports: ${error}`);
            return reply.code(500).send({ error: 'Failed to query usage reports' });
        }
    });
}
