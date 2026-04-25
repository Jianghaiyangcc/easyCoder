import * as z from 'zod';

export const VoiceProviderSchema = z.enum(['bailian', 'elevenlabs']);
export type VoiceProvider = z.infer<typeof VoiceProviderSchema>;

export const VoiceConversationGrantedSchema = z.object({
    allowed: z.literal(true),
    conversationToken: z.string(),
    conversationId: z.string(),
    agentId: z.string(),
    elevenUserId: z.string(),
    usedSeconds: z.number(),
    limitSeconds: z.number(),
});

export const VoiceConversationDeniedSchema = z.object({
    allowed: z.literal(false),
    reason: z.enum(['voice_hard_limit_reached', 'subscription_required', 'voice_conversation_limit_reached']),
    usedSeconds: z.number(),
    limitSeconds: z.number(),
    agentId: z.string(),
});

export const VoiceConversationResponseSchema = z.discriminatedUnion('allowed', [
    VoiceConversationGrantedSchema,
    VoiceConversationDeniedSchema,
]);

export type VoiceConversationResponse = z.infer<typeof VoiceConversationResponseSchema>;

export const VoiceUsageResponseSchema = z.object({
    usedSeconds: z.number(),
    limitSeconds: z.number(),
    conversationCount: z.number(),
    conversationLimit: z.number(),
    elevenUserId: z.string(),
});

export type VoiceUsageResponse = z.infer<typeof VoiceUsageResponseSchema>;

export const BailianAsrResponseSchema = z.object({
    provider: z.literal('bailian'),
    transcript: z.string(),
    model: z.string(),
});

export type BailianAsrResponse = z.infer<typeof BailianAsrResponseSchema>;

export const BailianTtsResponseSchema = z.object({
    provider: z.literal('bailian'),
    audioUrl: z.string(),
    model: z.string(),
    voice: z.string(),
    expiresAt: z.number().nullable(),
});

export type BailianTtsResponse = z.infer<typeof BailianTtsResponseSchema>;
