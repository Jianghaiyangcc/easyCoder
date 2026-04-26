import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from '@/components/StyledText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Switch } from '@/components/Switch';
import { UsageBar } from '@/components/usage/UsageBar';
import { useSettingMutable, useEntitlement, useLocalSetting, useLocalSettingMutable, useSetting } from '@/sync/storage';
import { useAuth } from '@/auth/AuthContext';
import { findLanguageByCode, getLanguageDisplayName, LANGUAGES } from '@/constants/Languages';
import { fetchVoiceUsage, type VoiceUsageResponse } from '@/sync/apiVoice';
import { t } from '@/text';
import { Modal } from '@/modal';
import { sync } from '@/sync/sync';
import { trackPaywallButtonClicked } from '@/track';
import { getVoiceExperimentStatus, getVoiceUpsellVariantLabel } from '@/realtime/voiceExperiment';
import { getVoiceLocalCounters, resetVoiceLocalCounters } from '@/sync/persistence';
import {
    checkMicrophonePermission,
    requestMicrophonePermission,
    showMicrophonePermissionDeniedAlert,
} from '@/utils/microphonePermissions';

function formatVoiceTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
}

export default React.memo(function VoiceSettingsScreen() {
    const router = useRouter();
    const auth = useAuth();
    const [voiceAssistantLanguage] = useSettingMutable('voiceAssistantLanguage');
    const [voiceProvider, setVoiceProvider] = useSettingMutable('voiceProvider');
    const [voiceCustomAgentId, setVoiceCustomAgentId] = useSettingMutable('voiceCustomAgentId');
    const [voiceBypassToken, setVoiceBypassToken] = useSettingMutable('voiceBypassToken');
    const [voiceUpsellOverride, setVoiceUpsellOverride] = useLocalSettingMutable('voiceUpsellOverride');
    const experiments = useSetting('experiments');
    const devModeEnabled = __DEV__ || useLocalSetting('devModeEnabled');

    const hasPro = useEntitlement('pro');

    const [usage, setUsage] = React.useState<VoiceUsageResponse | null>(null);
    const [usageLoading, setUsageLoading] = React.useState(true);
    const [usageError, setUsageError] = React.useState(false);
    const [voiceLocalCounters, setVoiceLocalCounters] = React.useState(() => getVoiceLocalCounters());
    const [microphonePermissionGranted, setMicrophonePermissionGranted] = React.useState<boolean | null>(null);

    const isBailianMode = voiceProvider === 'bailian';

    React.useEffect(() => {
        if (!auth.credentials) {
            setUsage(null);
            setUsageLoading(false);
            setUsageError(false);
            return;
        }

        setUsageLoading(true);
        setUsageError(false);

        fetchVoiceUsage(auth.credentials, voiceProvider)
            .then((nextUsage) => {
                setUsage(nextUsage);
            })
            .catch(() => {
                setUsage(null);
                setUsageError(true);
            })
            .finally(() => setUsageLoading(false));
    }, [auth.credentials, voiceProvider]);

    const refreshMicrophonePermission = React.useCallback(async () => {
        const permission = await checkMicrophonePermission();
        setMicrophonePermissionGranted(permission.granted);
    }, []);

    React.useEffect(() => {
        refreshMicrophonePermission();
    }, [refreshMicrophonePermission]);

    // Find current language or default to first option
    const currentLanguage = findLanguageByCode(voiceAssistantLanguage) || LANGUAGES[0];

    const handleSupportUs = React.useCallback(async () => {
        trackPaywallButtonClicked('voluntary_support');
        const result = await sync.presentPaywall('voluntary_support');
        if (!result.success) {
            Modal.alert(
                t('common.error'),
                `${t('errors.operationFailed')}${result.error ? `: ${result.error}` : ''}`
            );
        }
    }, []);

    const handleCustomAgentId = React.useCallback(async () => {
        const value = await Modal.prompt(
            t('settingsVoice.customAgentId'),
            t('settingsVoice.customAgentIdDescription'),
            {
                defaultValue: voiceCustomAgentId ?? '',
                placeholder: t('settingsVoice.customAgentIdPlaceholder'),
            }
        );
        if (value !== null) {
            const trimmed = value.trim() || null;
            setVoiceCustomAgentId(trimmed);
            // Auto-toggle bypass when setting/clearing agent ID
            setVoiceBypassToken(trimmed !== null);
        }
    }, [voiceCustomAgentId, setVoiceCustomAgentId, setVoiceBypassToken]);

    const handleVoiceModePicker = React.useCallback(() => {
        Modal.alert(
            t('settingsVoice.modePickerTitle'),
            t('settingsVoice.modePickerMessage'),
            [
                {
                    text: t('settingsVoice.modeVoiceInputLabel'),
                    onPress: () => setVoiceProvider('bailian'),
                },
                {
                    text: t('settingsVoice.modeRealtimeAssistantLabel'),
                    onPress: () => setVoiceProvider('elevenlabs'),
                },
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                },
            ],
        );
    }, [setVoiceProvider]);

    const handleMicrophonePermissionPress = React.useCallback(async () => {
        const result = await requestMicrophonePermission();
        setMicrophonePermissionGranted(result.granted);
        if (!result.granted) {
            showMicrophonePermissionDeniedAlert(result.canAskAgain);
        }
    }, []);

    const handleVoiceExperimentOverride = React.useCallback(() => {
        Modal.alert(
            'Voice Experiment Override',
            'Select a local override for the voice-upsell experiment.',
            [
                { text: 'No Override', onPress: () => setVoiceUpsellOverride(null) },
                { text: 'Control', onPress: () => setVoiceUpsellOverride('control') },
                { text: 'Soft Paywall', onPress: () => setVoiceUpsellOverride('show-paywall-before-first-voice-chat') },
                { text: 'Onboarding + Upsell', onPress: () => setVoiceUpsellOverride('voice-onboarding-and-upsell') },
            ],
        );
    }, [setVoiceUpsellOverride]);

    const handleResetVoiceCounters = React.useCallback(async () => {
        const confirmed = await Modal.confirm(
            'Reset Voice Counters',
            'Clear local voice counters used for onboarding and soft-paywall behavior on this device?',
            {
                confirmText: 'Reset',
                destructive: true,
            },
        );
        if (!confirmed) {
            return;
        }

        resetVoiceLocalCounters();
        setVoiceLocalCounters(getVoiceLocalCounters());
    }, []);

    const voiceExperimentStatus = React.useMemo(() => {
        return getVoiceExperimentStatus({
            voiceBypassToken,
            voiceCustomAgentId,
            voiceUpsellOverride,
            voiceUpsellOverrideEnabled: devModeEnabled,
        });
    }, [devModeEnabled, voiceBypassToken, voiceCustomAgentId, voiceUpsellOverride]);

    const developerExperimentSubtitle = React.useMemo(() => {
        const upsellVariant = getVoiceUpsellVariantLabel(voiceExperimentStatus.upsellVariant);
        const gatingMode = voiceExperimentStatus.gatingMode === 'direct-byo-agent'
            ? 'direct BYO agent bypass'
            : 'EasyCoder server gate';

        return [
            `voice-upsell: ${upsellVariant}`,
            `source: ${voiceExperimentStatus.upsellVariantSource}`,
            `gate: ${gatingMode}`,
            `experiments setting: ${experiments ? 'on' : 'off'}`,
        ].join('\n');
    }, [experiments, voiceExperimentStatus]);

    const developerOverrideLabel = React.useMemo(() => {
        if (!voiceUpsellOverride) {
            return 'No Override';
        }
        return getVoiceUpsellVariantLabel(voiceUpsellOverride);
    }, [voiceUpsellOverride]);

    const developerCountersSubtitle = React.useMemo(() => {
        return [
            `soft paywall shown: ${voiceLocalCounters.softPaywallShownCount}`,
            `onboarding prompt loads: ${voiceLocalCounters.onboardingPromptLoadCount}`,
            `voice messages: ${voiceLocalCounters.voiceMessageCount}`,
        ].join('\n');
    }, [voiceLocalCounters]);

    const modeLabel = isBailianMode
        ? t('settingsVoice.modeVoiceInputLabel')
        : t('settingsVoice.modeRealtimeAssistantLabel');

    const modeDescription = isBailianMode
        ? t('settingsVoice.modeVoiceInputDescription')
        : t('settingsVoice.modeRealtimeAssistantDescription');

    const providerLabel = isBailianMode
        ? t('settingsVoice.providerBailian')
        : t('settingsVoice.providerElevenLabs');

    const preferredLanguageSubtitle = isBailianMode
        ? t('settingsVoice.preferredLanguageSubtitleInput')
        : t('settingsVoice.preferredLanguageSubtitleRealtime');

    const microphonePermissionSubtitle = microphonePermissionGranted === null
        ? t('common.loading')
        : microphonePermissionGranted
            ? t('settingsVoice.microphonePermissionGranted')
            : t('settingsVoice.microphonePermissionDenied');

    const usageFooter = isBailianMode
        ? t('settingsVoice.usageFooterBailian')
        : t('settingsVoice.usageFooterElevenLabs');

    const usageTimeLimitReached = Boolean(usage && usage.usedSeconds >= usage.limitSeconds);
    const usageConversationLimitReached = Boolean(
        usage && !isBailianMode && usage.conversationCount >= usage.conversationLimit,
    );

    const usageTimeLimitSubtitle = usage && hasPro
        ? t('errors.voiceHardLimitReached', {
            hours: Math.max(1, Math.ceil(usage.limitSeconds / 3600)),
        })
        : t('settingsVoice.supportSubtitle');

    return (
        <ItemList style={{ paddingTop: 0 }}>
            <ItemGroup
                title={t('settingsVoice.currentModeTitle')}
                footer={t('settingsVoice.currentModeDescription')}
            >
                <Item
                    title={modeLabel}
                    subtitle={modeDescription}
                    detail={providerLabel}
                    icon={<Ionicons name="radio-outline" size={29} color="#34C759" />}
                    showChevron={false}
                />
            </ItemGroup>

            <ItemGroup title={t('settingsVoice.commonTitle')}>
                <Item
                    title={t('settingsVoice.voiceModeTitle')}
                    subtitle={t('settingsVoice.voiceModeSubtitle')}
                    detail={modeLabel}
                    icon={<Ionicons name="swap-horizontal-outline" size={29} color="#007AFF" />}
                    onPress={handleVoiceModePicker}
                />
                <Item
                    title={t('settingsVoice.preferredLanguage')}
                    subtitle={preferredLanguageSubtitle}
                    icon={<Ionicons name="language-outline" size={29} color="#007AFF" />}
                    detail={getLanguageDisplayName(currentLanguage)}
                    onPress={() => router.push('/settings/voice/language')}
                />
                <Item
                    title={t('settingsVoice.microphonePermission')}
                    subtitle={microphonePermissionSubtitle}
                    icon={<Ionicons name="mic-outline" size={29} color="#FF9500" />}
                    onPress={handleMicrophonePermissionPress}
                />
            </ItemGroup>

            {/* Voice Usage */}
            {usageLoading ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                    <ActivityIndicator />
                </View>
            ) : (
                <ItemGroup
                    title={t('settingsVoice.usageTitle')}
                    footer={usageFooter}
                >
                    {usage ? (
                        <>
                            <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                                <UsageBar
                                    label={t('settingsVoice.usageLabel')}
                                    value={usage.usedSeconds}
                                    maxValue={usage.limitSeconds}
                                    color={usage.usedSeconds >= usage.limitSeconds ? '#FF3B30' : '#007AFF'}
                                />
                                <Text style={{ fontSize: 13, color: '#8E8E93', marginTop: 4 }}>
                                    {formatVoiceTime(usage.usedSeconds)} / {formatVoiceTime(usage.limitSeconds)}
                                </Text>
                                {!isBailianMode && (
                                    <>
                                        <UsageBar
                                            label={t('settingsVoice.conversationsLabel')}
                                            value={usage.conversationCount}
                                            maxValue={usage.conversationLimit}
                                            color={usage.conversationCount >= usage.conversationLimit ? '#FF3B30' : '#007AFF'}
                                        />
                                        <Text style={{ fontSize: 13, color: '#8E8E93', marginTop: 4 }}>
                                            {usage.conversationCount} / {usage.conversationLimit}
                                        </Text>
                                    </>
                                )}
                            </View>

                            {usageTimeLimitReached && (
                                <Item
                                    title={t('errors.voiceLimitReachedTitle')}
                                    subtitle={usageTimeLimitSubtitle}
                                    icon={<Ionicons name="alert-circle-outline" size={29} color="#FF3B30" />}
                                    showChevron={false}
                                />
                            )}

                            {usageConversationLimitReached && (
                                <Item
                                    title={t('errors.voiceLimitReachedTitle')}
                                    subtitle={t('errors.voiceConversationLimitReached')}
                                    icon={<Ionicons name="alert-circle-outline" size={29} color="#FF3B30" />}
                                    showChevron={false}
                                />
                            )}
                        </>
                    ) : (
                        <Item
                            title={t('settingsVoice.usageUnavailableTitle')}
                            subtitle={usageError
                                ? t('settingsVoice.usageUnavailableSubtitle')
                                : t('common.loading')}
                            icon={<Ionicons name="stats-chart-outline" size={29} color="#8E8E93" />}
                            showChevron={false}
                        />
                    )}
                </ItemGroup>
            )}

            {/* Support / Upgrade */}
            {!hasPro && (
                <ItemGroup>
                    <Item
                        title={t('settingsVoice.supportTitle')}
                        subtitle={t('settingsVoice.supportSubtitle')}
                        icon={<Ionicons name="heart-outline" size={29} color="#FF2D55" />}
                        onPress={handleSupportUs}
                    />
                </ItemGroup>
            )}

            {/* Advanced Voice Configuration */}
            <ItemGroup
                title={t('settingsVoice.advancedTitle')}
                footer={t('settingsVoice.advancedDescription')}
            >
                {isBailianMode ? (
                    <Item
                        title={t('settingsVoice.advancedLockedTitle')}
                        subtitle={t('settingsVoice.advancedLockedSubtitle')}
                        icon={<Ionicons name="information-circle-outline" size={29} color="#8E8E93" />}
                        showChevron={false}
                    />
                ) : (
                    <>
                        <Item
                            title={t('settingsVoice.customAgentId')}
                            subtitle={voiceCustomAgentId ?? t('settingsVoice.customAgentIdNotSet')}
                            icon={<Ionicons name="key-outline" size={29} color="#FF9500" />}
                            onPress={handleCustomAgentId}
                        />
                        <Item
                            title={t('settingsVoice.bypassToken')}
                            subtitle={t('settingsVoice.bypassTokenSubtitle')}
                            icon={<Ionicons name="flash-outline" size={29} color="#FF3B30" />}
                            rightElement={
                                <Switch
                                    value={voiceBypassToken}
                                    onValueChange={setVoiceBypassToken}
                                />
                            }
                        />
                    </>
                )}
            </ItemGroup>

            <ItemGroup title={t('settingsVoice.helpTitle')}>
                <Item
                    title={t('settingsVoice.modeVoiceInputLabel')}
                    subtitle={t('settingsVoice.helpVoiceInput')}
                    icon={<Ionicons name="mic-outline" size={29} color="#007AFF" />}
                    showChevron={false}
                />
                <Item
                    title={t('settingsVoice.modeRealtimeAssistantLabel')}
                    subtitle={t('settingsVoice.helpRealtimeAssistant')}
                    icon={<Ionicons name="sparkles-outline" size={29} color="#AF52DE" />}
                    showChevron={false}
                />
            </ItemGroup>

            {/* Prompt Guide — shown when custom agent is configured */}
            {!isBailianMode && voiceCustomAgentId && (
                <ItemGroup
                    title={t('settingsVoice.promptGuideTitle')}
                    footer={t('settingsVoice.promptGuideDescription')}
                >
                    <Item
                        title={t('settingsVoice.customAgentId')}
                        subtitle={voiceCustomAgentId}
                        copy={voiceCustomAgentId}
                    />
                </ItemGroup>
            )}

            {devModeEnabled && (
                <ItemGroup
                    title="Developer"
                    footer="Developer-only diagnostics and local override controls for the current voice rollout. The paid realtime voice gate runs through EasyCoder server unless Direct Connection and a custom realtime agent are both enabled."
                >
                    <Item
                        title="Voice Experiment Override"
                        subtitle="Simple local override for the voice-upsell flag"
                        detail={developerOverrideLabel}
                        icon={<Ionicons name="options-outline" size={29} color="#007AFF" />}
                        onPress={handleVoiceExperimentOverride}
                    />
                    <Item
                        title="Voice Experiment Status"
                        subtitle={developerExperimentSubtitle}
                        subtitleLines={0}
                        icon={<Ionicons name="flask-outline" size={29} color="#5856D6" />}
                        showChevron={false}
                        copy={developerExperimentSubtitle}
                    />
                    <Item
                        title="Reset Voice Counters"
                        subtitle={developerCountersSubtitle}
                        subtitleLines={0}
                        icon={<Ionicons name="refresh-outline" size={29} color="#FF9500" />}
                        onPress={handleResetVoiceCounters}
                    />
                </ItemGroup>
            )}
        </ItemList>
    );
});
