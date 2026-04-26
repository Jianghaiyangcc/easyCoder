import { createHmac, randomInt, randomUUID } from "node:crypto";
import { PhoneVerificationScene, Prisma } from "@prisma/client";
import { db } from "@/storage/db";

const DYSMS_API_VERSION = "2017-05-25";
const CODE_REGEX = /^\d{6}$/;
const MAINLAND_PHONE_REGEX = /^1\d{10}$/;

type SmsConfig = {
    enabled: boolean;
    accessKeyId: string;
    accessKeySecret: string;
    endpoint: string;
    regionId: string;
    signName: string;
    templateCode: string;
    templateVarKey: string;
    codeTtlSeconds: number;
    maxAttempts: number;
    cooldownSeconds: number;
    phoneLimit10Minutes: number;
    phoneLimitDaily: number;
    ipLimitHourly: number;
    ipLimitDaily: number;
};

type SendCodeInput = {
    accountId: string;
    phone?: string;
    scene: PhoneVerificationScene;
    requestIp: string;
};

type SendCodeResult = {
    phoneE164: string;
    expiresInSeconds: number;
    cooldownSeconds: number;
};

type AliyunSmsResponse = {
    Code?: string;
    Message?: string;
    RequestId?: string;
    BizId?: string;
};

export class PhoneVerificationError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly code: string,
    ) {
        super(message);
        this.name = "PhoneVerificationError";
    }
}

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

function getSmsConfig(): SmsConfig {
    return {
        enabled: process.env.SMS_AUTH_ENABLED !== "false",
        accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID || "",
        accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET || "",
        endpoint: (process.env.ALIYUN_SMS_ENDPOINT || "dysmsapi.aliyuncs.com")
            .replace(/^https?:\/\//, "")
            .replace(/\/+$/, ""),
        regionId: process.env.ALIYUN_SMS_REGION_ID || "cn-hangzhou",
        signName: process.env.ALIYUN_SMS_SIGN_NAME || "",
        templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || "",
        templateVarKey: process.env.ALIYUN_SMS_TEMPLATE_VAR_KEY || "code",
        codeTtlSeconds: parsePositiveInt(process.env.SMS_CODE_TTL_SECONDS, 300),
        maxAttempts: parsePositiveInt(process.env.SMS_CODE_MAX_ATTEMPTS, 5),
        cooldownSeconds: parsePositiveInt(process.env.SMS_PHONE_COOLDOWN_SECONDS, 60),
        phoneLimit10Minutes: parsePositiveInt(process.env.SMS_PHONE_LIMIT_10_MINUTES, 3),
        phoneLimitDaily: parsePositiveInt(process.env.SMS_PHONE_LIMIT_DAILY, 10),
        ipLimitHourly: parsePositiveInt(process.env.SMS_IP_LIMIT_HOURLY, 30),
        ipLimitDaily: parsePositiveInt(process.env.SMS_IP_LIMIT_DAILY, 100),
    };
}

function ensureSmsEnabled(config: SmsConfig): void {
    if (!config.enabled) {
        throw new PhoneVerificationError("SMS verification is disabled", 503, "SMS_DISABLED");
    }
    if (!config.accessKeyId || !config.accessKeySecret) {
        throw new PhoneVerificationError("SMS provider credentials are not configured", 500, "SMS_CONFIG_ERROR");
    }
    if (!config.signName || !config.templateCode) {
        throw new PhoneVerificationError("SMS sign or template is not configured", 500, "SMS_CONFIG_ERROR");
    }
}

function percentEncode(value: string): string {
    return encodeURIComponent(value)
        .replace(/\+/g, "%20")
        .replace(/\*/g, "%2A")
        .replace(/%7E/g, "~");
}

function toAliyunTimestamp(date = new Date()): string {
    return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function normalizeMainlandPhone(raw: string): { national: string; e164: string } {
    const compact = raw.replace(/[\s-]/g, "");
    let national = compact;
    if (national.startsWith("+86")) {
        national = national.slice(3);
    } else if (national.startsWith("86") && national.length === 13) {
        national = national.slice(2);
    }

    if (!MAINLAND_PHONE_REGEX.test(national)) {
        throw new PhoneVerificationError("Invalid mainland China phone number", 400, "INVALID_PHONE");
    }
    return {
        national,
        e164: `+86${national}`,
    };
}

function normalizeCode(code: string): string {
    const trimmed = code.trim();
    if (!CODE_REGEX.test(trimmed)) {
        throw new PhoneVerificationError("Verification code must be 6 digits", 400, "INVALID_CODE_FORMAT");
    }
    return trimmed;
}

async function enforceCooldown(phoneE164: string, scene: PhoneVerificationScene, cooldownSeconds: number): Promise<void> {
    const key = `sms:cooldown:${scene}:${phoneE164}`;
    const now = new Date();
    const existing = await db.repeatKey.findUnique({ where: { key } });
    if (existing && existing.expiresAt > now) {
        throw new PhoneVerificationError(
            `Please wait ${cooldownSeconds} seconds before requesting another code`,
            429,
            "SMS_COOLDOWN",
        );
    }

    await db.repeatKey.upsert({
        where: { key },
        create: {
            key,
            value: scene,
            expiresAt: new Date(now.getTime() + cooldownSeconds * 1000),
        },
        update: {
            value: scene,
            expiresAt: new Date(now.getTime() + cooldownSeconds * 1000),
        },
    });
}

async function enforceRateLimits(phoneE164: string, requestIp: string, config: SmsConfig): Promise<void> {
    const now = Date.now();
    const tenMinutesAgo = new Date(now - 10 * 60 * 1000);
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    const [phone10m, phoneDaily, ipHourly, ipDaily] = await Promise.all([
        db.phoneVerificationCode.count({
            where: {
                phoneE164,
                createdAt: { gte: tenMinutesAgo },
            },
        }),
        db.phoneVerificationCode.count({
            where: {
                phoneE164,
                createdAt: { gte: oneDayAgo },
            },
        }),
        db.phoneVerificationCode.count({
            where: {
                requestIp,
                createdAt: { gte: oneHourAgo },
            },
        }),
        db.phoneVerificationCode.count({
            where: {
                requestIp,
                createdAt: { gte: oneDayAgo },
            },
        }),
    ]);

    if (phone10m >= config.phoneLimit10Minutes) {
        throw new PhoneVerificationError("Too many requests for this phone number", 429, "SMS_RATE_LIMIT");
    }
    if (phoneDaily >= config.phoneLimitDaily) {
        throw new PhoneVerificationError("Daily SMS limit reached for this phone number", 429, "SMS_RATE_LIMIT");
    }
    if (ipHourly >= config.ipLimitHourly) {
        throw new PhoneVerificationError("Hourly SMS limit reached for this IP", 429, "SMS_RATE_LIMIT");
    }
    if (ipDaily >= config.ipLimitDaily) {
        throw new PhoneVerificationError("Daily SMS limit reached for this IP", 429, "SMS_RATE_LIMIT");
    }
}

async function sendAliyunSms(input: { phoneNational: string; code: string }, config: SmsConfig) {
    const templateParam = JSON.stringify({ [config.templateVarKey]: input.code });
    const queryParams: Record<string, string> = {
        AccessKeyId: config.accessKeyId,
        Action: "SendSms",
        Format: "JSON",
        PhoneNumbers: input.phoneNational,
        RegionId: config.regionId,
        SignName: config.signName,
        SignatureMethod: "HMAC-SHA1",
        SignatureNonce: randomUUID(),
        SignatureVersion: "1.0",
        TemplateCode: config.templateCode,
        TemplateParam: templateParam,
        Timestamp: toAliyunTimestamp(),
        Version: DYSMS_API_VERSION,
    };

    const canonicalized = Object.entries(queryParams)
        .sort(([left], [right]) => {
            if (left < right) return -1;
            if (left > right) return 1;
            return 0;
        })
        .map(([key, value]) => `${percentEncode(key)}=${percentEncode(value)}`)
        .join("&");

    const stringToSign = `GET&${percentEncode("/")}&${percentEncode(canonicalized)}`;
    const signature = createHmac("sha1", `${config.accessKeySecret}&`)
        .update(stringToSign)
        .digest("base64");

    const finalParams = new URLSearchParams({
        ...queryParams,
        Signature: signature,
    });

    const response = await fetch(`https://${config.endpoint}/?${finalParams.toString()}`, {
        method: "GET",
    });

    const payload = (await response.json().catch(() => null)) as AliyunSmsResponse | null;
    if (!payload) {
        throw new PhoneVerificationError("SMS provider returned an invalid response", 502, "SMS_PROVIDER_ERROR");
    }

    return {
        success: response.ok && payload.Code === "OK",
        providerCode: payload.Code || (response.ok ? "UNKNOWN" : `HTTP_${response.status}`),
        providerMessage: payload.Message || (response.ok ? "Unknown error" : `HTTP_${response.status}`),
    };
}

async function resolveTargetPhone(input: SendCodeInput): Promise<{ national: string; e164: string }> {
    if (input.scene === PhoneVerificationScene.bind) {
        if (!input.phone) {
            throw new PhoneVerificationError("Phone number is required", 400, "PHONE_REQUIRED");
        }
        return normalizeMainlandPhone(input.phone);
    }

    const account = await db.account.findUnique({
        where: { id: input.accountId },
        select: { phoneE164: true },
    });
    if (!account?.phoneE164) {
        throw new PhoneVerificationError("No phone number is currently bound", 400, "PHONE_NOT_BOUND");
    }
    return normalizeMainlandPhone(account.phoneE164);
}

export async function sendPhoneVerificationCode(input: SendCodeInput): Promise<SendCodeResult> {
    const config = getSmsConfig();
    ensureSmsEnabled(config);

    const normalized = await resolveTargetPhone(input);
    const requestIp = input.requestIp || "unknown";

    if (input.scene === PhoneVerificationScene.bind) {
        const existing = await db.account.findFirst({
            where: {
                phoneE164: normalized.e164,
                id: { not: input.accountId },
            },
            select: { id: true },
        });
        if (existing) {
            throw new PhoneVerificationError("Phone number is already in use", 409, "PHONE_ALREADY_IN_USE");
        }
    }

    await enforceCooldown(normalized.e164, input.scene, config.cooldownSeconds);
    await enforceRateLimits(normalized.e164, requestIp, config);

    const code = String(randomInt(100000, 1_000_000));
    const smsResult = await sendAliyunSms({
        phoneNational: normalized.national,
        code,
    }, config);

    if (!smsResult.success) {
        throw new PhoneVerificationError(
            `SMS send failed: ${smsResult.providerMessage}`,
            502,
            smsResult.providerCode,
        );
    }

    await db.$transaction(async (tx) => {
        await tx.phoneVerificationCode.updateMany({
            where: {
                accountId: input.accountId,
                phoneE164: normalized.e164,
                scene: input.scene,
                consumedAt: null,
            },
            data: {
                consumedAt: new Date(),
            },
        });

        await tx.phoneVerificationCode.create({
            data: {
                accountId: input.accountId,
                phoneE164: normalized.e164,
                scene: input.scene,
                code,
                maxAttempts: config.maxAttempts,
                expiresAt: new Date(Date.now() + config.codeTtlSeconds * 1000),
                requestIp,
                providerCode: smsResult.providerCode,
                providerMessage: smsResult.providerMessage,
            },
        });
    });

    return {
        phoneE164: normalized.e164,
        expiresInSeconds: config.codeTtlSeconds,
        cooldownSeconds: config.cooldownSeconds,
    };
}

async function verifyLatestCode(input: {
    accountId: string;
    phoneE164: string;
    scene: PhoneVerificationScene;
    code: string;
}) {
    const code = normalizeCode(input.code);

    return db.$transaction(async (tx) => {
        const now = new Date();
        const latestCode = await tx.phoneVerificationCode.findFirst({
            where: {
                accountId: input.accountId,
                phoneE164: input.phoneE164,
                scene: input.scene,
                consumedAt: null,
                expiresAt: { gt: now },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (!latestCode) {
            throw new PhoneVerificationError("Verification code is invalid or expired", 400, "CODE_INVALID");
        }

        if (latestCode.code !== code) {
            const nextAttempts = latestCode.attempts + 1;
            await tx.phoneVerificationCode.update({
                where: { id: latestCode.id },
                data: {
                    attempts: nextAttempts,
                    consumedAt: nextAttempts >= latestCode.maxAttempts ? new Date() : null,
                },
            });
            throw new PhoneVerificationError("Verification code is invalid or expired", 400, "CODE_INVALID");
        }

        await tx.phoneVerificationCode.update({
            where: { id: latestCode.id },
            data: {
                consumedAt: now,
            },
        });

        return latestCode;
    });
}

export async function verifyAndBindPhone(input: {
    accountId: string;
    phone: string;
    code: string;
}): Promise<{ phoneE164: string; phoneBound: boolean }> {
    const normalized = normalizeMainlandPhone(input.phone);
    await verifyLatestCode({
        accountId: input.accountId,
        phoneE164: normalized.e164,
        scene: PhoneVerificationScene.bind,
        code: input.code,
    });

    const existing = await db.account.findFirst({
        where: {
            phoneE164: normalized.e164,
            id: { not: input.accountId },
        },
        select: { id: true },
    });
    if (existing) {
        throw new PhoneVerificationError("Phone number is already in use", 409, "PHONE_ALREADY_IN_USE");
    }

    try {
        await db.account.update({
            where: { id: input.accountId },
            data: {
                phoneE164: normalized.e164,
                phoneVerifiedAt: new Date(),
            },
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new PhoneVerificationError("Phone number is already in use", 409, "PHONE_ALREADY_IN_USE");
        }
        throw error;
    }

    return {
        phoneE164: normalized.e164,
        phoneBound: true,
    };
}

export async function verifyAndUnbindPhone(input: {
    accountId: string;
    code: string;
}): Promise<{ phoneE164: null; phoneBound: boolean }> {
    const account = await db.account.findUnique({
        where: { id: input.accountId },
        select: { phoneE164: true },
    });
    if (!account?.phoneE164) {
        throw new PhoneVerificationError("No phone number is currently bound", 400, "PHONE_NOT_BOUND");
    }

    await verifyLatestCode({
        accountId: input.accountId,
        phoneE164: account.phoneE164,
        scene: PhoneVerificationScene.unbind,
        code: input.code,
    });

    await db.account.update({
        where: { id: input.accountId },
        data: {
            phoneE164: null,
            phoneVerifiedAt: null,
        },
    });

    return {
        phoneE164: null,
        phoneBound: false,
    };
}

export async function listPhoneVerificationCodes(input: {
    accountId: string;
    limit: number;
}) {
    const safeLimit = Math.max(1, Math.min(input.limit, 100));
    const rows = await db.phoneVerificationCode.findMany({
        where: {
            accountId: input.accountId,
        },
        orderBy: {
            createdAt: "desc",
        },
        take: safeLimit,
        select: {
            id: true,
            phoneE164: true,
            scene: true,
            code: true,
            attempts: true,
            maxAttempts: true,
            expiresAt: true,
            consumedAt: true,
            requestIp: true,
            providerCode: true,
            providerMessage: true,
            createdAt: true,
        },
    });

    return rows.map((row) => ({
        ...row,
        expiresAt: row.expiresAt.getTime(),
        consumedAt: row.consumedAt?.getTime() ?? null,
        createdAt: row.createdAt.getTime(),
    }));
}
