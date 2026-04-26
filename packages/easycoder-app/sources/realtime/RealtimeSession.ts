import type { VoiceSession } from './types';
import { fetchVoiceCredentials, fetchVoiceUsage, isVoiceQuotaError } from '@/sync/apiVoice';
import { sync } from '@/sync/sync';
import { Modal } from '@/modal';
import { TokenStorage } from '@/auth/tokenStorage';
import { t } from '@/text';
import { requestMicrophonePermission, showMicrophonePermissionDeniedAlert } from '@/utils/microphonePermissions';
import { storage } from '@/sync/storage';
import {
    getVoiceMessageCount,
    getVoiceOnboardingPromptLoadCount,
    getVoiceSoftPaywallShownCount,
    incrementVoiceOnboardingPromptLoadCount,
    incrementVoiceSoftPaywallShown,
} from '@/sync/persistence';
import { buildVoiceFirstMessage, buildVoiceSystemPrompt } from './voiceSystemPrompt';
import { getVoiceUpsellVariant } from './voiceExperiment';

let voiceSession: VoiceSession | null = null;
let voiceSessionStarted: boolean = false;
let currentSessionId: string | null = null;
let currentVoiceConversationId: string | null = null;
let currentVoiceSessionStartedAt: number | null = null;

type VoiceLimitReason = 'voice_hard_limit_reached' | 'subscription_required' | 'voice_conversation_limit_reached';

async function handleVoiceLimit(reason: VoiceLimitReason, limitSeconds: number): Promise<boolean> {
    if (reason === 'voice_conversation_limit_reached') {
        Modal.alert(
            t('errors.voiceLimitReachedTitle'),
            t('errors.voiceConversationLimitReached'),
        );
        return false;
    }

    if (reason === 'voice_hard_limit_reached') {
        const hours = Math.max(1, Math.ceil(limitSeconds / 3600));
        Modal.alert(
            t('errors.voiceLimitReachedTitle'),
            t('errors.voiceHardLimitReached', { hours }),
        );
        return false;
    }

    const result = await sync.presentPaywall('voice_must_pay');
    return result.purchased === true;
}

/**
 * Start a voice session. Returns a provider conversation ID when available.
 */
export async function startRealtimeSession(sessionId: string, initialContext?: string): Promise<string | null> {
    currentVoiceConversationId = null;
    currentVoiceSessionStartedAt = null;

    if (!voiceSession) {
        console.warn('No voice session registered');
        return null;
    }

    // Show connecting state immediately so the user sees feedback
    storage.getState().setRealtimeStatus('connecting');

    // Request microphone permission before starting voice session
    // Critical for iOS/Android - first session will fail without this
    const permissionResult = await requestMicrophonePermission();
    if (!permissionResult.granted) {
        storage.getState().setRealtimeStatus('disconnected');
        showMicrophonePermissionDeniedAlert(permissionResult.canAskAgain);
        return null;
    }

    try {
        const voiceProvider = storage.getState().settings.voiceProvider;

        if (voiceProvider === 'bailian') {
            const credentials = await TokenStorage.getCredentials();
            if (credentials) {
                try {
                    const usage = await fetchVoiceUsage(credentials, 'bailian');
                    if (usage.usedSeconds >= usage.limitSeconds) {
                        const hasPro = storage.getState().purchases.entitlements['pro'] ?? false;
                        const shouldContinue = await handleVoiceLimit(
                            hasPro ? 'voice_hard_limit_reached' : 'subscription_required',
                            usage.limitSeconds,
                        );
                        if (!shouldContinue) {
                            storage.getState().setRealtimeStatus('disconnected');
                            return null;
                        }
                    }
                } catch {
                    // Ignore usage fetch failures and let the server enforce limits.
                }
            }

            currentSessionId = sessionId;
            const conversationId = await voiceSession.startSession({
                provider: 'bailian',
                sessionId,
                initialContext,
            });
            currentVoiceConversationId = conversationId;
            currentVoiceSessionStartedAt = Date.now();
            voiceSessionStarted = true;
            return conversationId;
        }

        // Bypass EasyCoder server token — only when user has their own custom agent
        const { voiceBypassToken, voiceCustomAgentId } = storage.getState().settings;
        if (voiceBypassToken && voiceCustomAgentId) {
            console.log('[Voice] Bypassing token, custom agent ID:', voiceCustomAgentId);
            currentSessionId = sessionId;
            const conversationId = await voiceSession.startSession({
                provider: 'elevenlabs',
                sessionId,
                initialContext,
                agentId: voiceCustomAgentId,
            });
            currentVoiceConversationId = conversationId;
            currentVoiceSessionStartedAt = Date.now();
            voiceSessionStarted = true;
            return conversationId;
        }

        const credentials = await TokenStorage.getCredentials();
        if (!credentials) {
            storage.getState().setRealtimeStatus('disconnected');
            Modal.alert(t('common.error'), t('errors.authenticationFailed'));
            return null;
        }

        const response = await fetchVoiceCredentials(credentials, sessionId);
        console.log('[Voice] fetchVoiceCredentials response:', response);

        if (!response.allowed) {
            storage.getState().setRealtimeStatus('disconnected');

            const shouldRetry = await handleVoiceLimit(response.reason, response.limitSeconds);
            if (shouldRetry) {
                return startRealtimeSession(sessionId, initialContext);
            }
            return null;
        }

        const hasPro = storage.getState().purchases.entitlements['pro'] ?? false;
        const { voiceUpsellOverride, devModeEnabled } = storage.getState().localSettings;
        const voiceUpsellVariant = getVoiceUpsellVariant({
            override: voiceUpsellOverride,
            overrideEnabled: __DEV__ || devModeEnabled,
        });

        if (
            !hasPro &&
            voiceUpsellVariant === 'show-paywall-before-first-voice-chat' &&
            getVoiceSoftPaywallShownCount() < 1
        ) {
            console.log('[Voice] First voice attempt on free tier, showing soft paywall...');
            incrementVoiceSoftPaywallShown();
            const result = await sync.presentPaywall('voice_trial_eligible');
            console.log('[Voice] Soft paywall result:', result);
            // Dismissed or error — continue anyway, they can still use free tier.
        }

        currentSessionId = sessionId;
        const onboardingPromptLoadCount = getVoiceOnboardingPromptLoadCount();
        const voiceMessageCount = getVoiceMessageCount();
        const systemPrompt = buildVoiceSystemPrompt({
            initialContext,
            onboardingPromptLoadCount,
            voiceMessageCount,
            includePaidVoiceOnboarding: !hasPro && voiceUpsellVariant === 'voice-onboarding-and-upsell',
        });
        const firstMessage = buildVoiceFirstMessage({
            hasPro,
            onboardingPromptLoadCount,
            includePaidVoiceOnboarding: voiceUpsellVariant === 'voice-onboarding-and-upsell',
        });

        const startedConversationId = await voiceSession.startSession({
            provider: 'elevenlabs',
            sessionId,
            initialContext,
            systemPrompt,
            firstMessage,
            conversationToken: response.conversationToken,
            agentId: response.agentId,
            userId: response.elevenUserId,
        });
        if (!hasPro && voiceUpsellVariant === 'voice-onboarding-and-upsell') {
            incrementVoiceOnboardingPromptLoadCount();
        }
        currentVoiceConversationId = response.conversationId ?? startedConversationId;
        currentVoiceSessionStartedAt = Date.now();
        voiceSessionStarted = true;
        return currentVoiceConversationId;
    } catch (error) {
        console.error('Failed to start realtime session:', error);
        storage.getState().setRealtimeStatus('disconnected');
        currentSessionId = null;
        currentVoiceConversationId = null;
        currentVoiceSessionStartedAt = null;
        voiceSessionStarted = false;
        Modal.alert(t('common.error'), t('errors.voiceServiceUnavailable'));
        return null;
    }
}

export async function stopRealtimeSession(): Promise<string | null> {
    if (!voiceSession) {
        return null;
    }

    let transcript: string | null = null;
    try {
        transcript = await voiceSession.endSession();
    } catch (error) {
        if (isVoiceQuotaError(error)) {
            await handleVoiceLimit(error.reason, error.limitSeconds);
        }
        console.error('Failed to stop realtime session:', error);
    } finally {
        currentSessionId = null;
        currentVoiceConversationId = null;
        currentVoiceSessionStartedAt = null;
        voiceSessionStarted = false;
    }

    return transcript;
}

export function registerVoiceSession(session: VoiceSession) {
    if (voiceSession) {
        console.warn('Voice session already registered, replacing with new one');
    }
    voiceSession = session;
}

export function isVoiceSessionStarted(): boolean {
    return voiceSessionStarted;
}

export function getVoiceSession(): VoiceSession | null {
    return voiceSession;
}

export function getCurrentRealtimeSessionId(): string | null {
    return currentSessionId;
}

export function getCurrentVoiceConversationId(): string | null {
    return currentVoiceConversationId;
}

export function getCurrentVoiceSessionDurationSeconds(): number | undefined {
    if (currentVoiceSessionStartedAt === null) {
        return undefined;
    }
    return Math.max(0, Math.round((Date.now() - currentVoiceSessionStartedAt) / 1000));
}

export function setCurrentRealtimeSessionId(sessionId: string) {
    currentSessionId = sessionId;
}
