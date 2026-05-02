import { View, Platform, Linking, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import * as React from 'react';
import { Text } from '@/components/StyledText';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { useConnectTerminal } from '@/hooks/useConnectTerminal';
import { useEntitlement, useLocalSettingMutable, useSetting, useSocketStatus } from '@/sync/storage';
import { sync } from '@/sync/sync';
import { trackWhatsNewClicked } from '@/track';
import { Modal } from '@/modal';
import { WeChatQRCodeModal } from '@/components/WeChatQRCodeModal';
import { useMultiClick } from '@/hooks/useMultiClick';
import { useAllMachines } from '@/sync/storage';
import { isMachineOnline } from '@/utils/machineUtils';
import { useUnistyles } from 'react-native-unistyles';
import { layout } from '@/components/layout';
import { useProfile } from '@/sync/storage';
import { getDisplayName, getAvatarUrl, getBio } from '@/sync/profile';
import { Avatar } from '@/components/Avatar';
import { t } from '@/text';

export const SettingsView = React.memo(function SettingsView() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    const [devModeEnabled, setDevModeEnabled] = useLocalSettingMutable('devModeEnabled');
    const hasPro = useEntitlement('pro');
    const experiments = useSetting('experiments');
    const socketStatus = useSocketStatus();
    const [showOfflineMachines, setShowOfflineMachines] = React.useState(false);
    const allMachinesWithOffline = useAllMachines({ includeOffline: true });
    const onlineMachineCount = React.useMemo(
        () => allMachinesWithOffline.filter(isMachineOnline).length,
        [allMachinesWithOffline]
    );
    const isGatewayConnected = socketStatus.status === 'connected';
    const systemStatusIconName = !isGatewayConnected
        ? 'alert-circle-outline'
        : onlineMachineCount === 0
            ? 'warning-outline'
            : 'analytics-outline';
    const systemStatusIconColor = !isGatewayConnected
        ? '#FF3B30'
        : onlineMachineCount === 0
            ? '#FF9500'
            : '#34C759';
    const systemStatusSubtitle = !isGatewayConnected
        ? t('help.unavailableHint')
        : onlineMachineCount === 0
            ? t('help.partialHint')
            : t('settings.systemStatusSubtitle');
    const offlineMachineCount = React.useMemo(
        () => allMachinesWithOffline.filter(m => !isMachineOnline(m)).length,
        [allMachinesWithOffline]
    );
    const visibleMachines = React.useMemo(
        () => showOfflineMachines
            ? allMachinesWithOffline
            : allMachinesWithOffline.filter(isMachineOnline),
        [allMachinesWithOffline, showOfflineMachines]
    );
    const profile = useProfile();
    const displayName = getDisplayName(profile);
    const avatarUrl = getAvatarUrl(profile);
    const bio = getBio(profile);
    const { width: windowWidth } = useWindowDimensions();
    const cardWidth = Math.max(0, Math.min(windowWidth, layout.maxWidth) - 32);
    const logoWidth = Math.min(cardWidth, Math.max(240, cardWidth * 0.72), 420);
    const logoHeight = logoWidth * 0.3;

    const { connectTerminal, connectWithUrl, isLoading } = useConnectTerminal();

    const handleGitHub = async () => {
        const url = 'https://github.com/Jianghaiyangcc/easyCoder';
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        }
    };

    const handleReportIssue = async () => {
        const url = 'https://github.com/Jianghaiyangcc/easyCoder/issues';
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        }
    };

    const handleSupportUs = async () => {
        Modal.show({
            component: WeChatQRCodeModal,
            props: {}
        });
    };

    // Use the multi-click hook for version clicks
    const handleVersionClick = useMultiClick(() => {
        // Toggle dev mode
        const newDevMode = !devModeEnabled;
        setDevModeEnabled(newDevMode);
        Modal.alert(
            t('modals.developerMode'),
            newDevMode ? t('modals.developerModeEnabled') : t('modals.developerModeDisabled')
        );
    }, {
        requiredClicks: 10,
        resetTimeout: 2000
    });

    return (

        <ItemList style={{ paddingTop: 0 }}>
            {/* App Info Header */}
            <View style={{ maxWidth: layout.maxWidth, alignSelf: 'center', width: '100%' }}>
                <View style={{ alignItems: 'center', paddingVertical: 24, backgroundColor: theme.colors.surface, marginTop: 16, borderRadius: 12, marginHorizontal: 16 }}>
                    {profile.firstName ? (
                        // Profile view: Avatar + name + version
                        <>
                            <View style={{ marginBottom: 12 }}>
                                <Avatar
                                    id={profile.id}
                                    size={90}
                                    imageUrl={avatarUrl}
                                    thumbhash={profile.avatar?.thumbhash}
                                />
                            </View>
                            <Text style={{ fontSize: 20, fontWeight: '600', color: theme.colors.text, marginBottom: bio ? 4 : 8 }}>
                                {displayName}
                            </Text>
                            {bio && (
                                <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 8, paddingHorizontal: 16 }}>
                                    {bio}
                                </Text>
                            )}
                        </>
                    ) : (
                        // Logo view: Original logo + version
                        <>
                            <Image
                                source={theme.dark ? require('@/assets/images/logotype-light.png') : require('@/assets/images/logotype-dark.png')}
                                contentFit="contain"
                                style={{ width: logoWidth, height: logoHeight, marginBottom: 12 }}
                            />
                        </>
                    )}
                </View>
            </View>

            {/* Connect Terminal - gated by experiments on all platforms */}
            {experiments && (
                <ItemGroup>
                    {Platform.OS !== 'web' && (
                        <Item
                            title={t('settings.scanQrCodeToAuthenticate')}
                            icon={<Ionicons name="qr-code-outline" size={29} color="#007AFF" />}
                            onPress={connectTerminal}
                            loading={isLoading}
                            showChevron={false}
                        />
                    )}
                    <Item
                        title={t('connect.enterUrlManually')}
                        icon={<Ionicons name="link-outline" size={29} color="#007AFF" />}
                        onPress={async () => {
                            const url = await Modal.prompt(
                                t('modals.authenticateTerminal'),
                                t('modals.pasteUrlFromTerminal'),
                                {
                                    placeholder: 'easycoder://terminal?...',
                                    confirmText: t('common.authenticate')
                                }
                            );
                            if (url?.trim()) {
                                connectWithUrl(url.trim());
                            }
                        }}
                        showChevron={false}
                    />
                </ItemGroup>
            )}

            {/* Support Us - gated by experiments on all platforms */}
            {experiments && (
                <ItemGroup>
                    <Item
                        title={t('subscription.title')}
                        subtitle={hasPro ? t('subscription.manageSubscription') : t('subscription.upgradeToPro')}
                        icon={<Ionicons name="pricetag-outline" size={29} color="#FF9500" />}
                        onPress={() => router.push('/settings/subscription')}
                    />
                    <Item
                        title={t('settings.supportUs')}
                        subtitle={hasPro ? t('settings.supportUsSubtitlePro') : t('settings.supportUsSubtitle')}
                        icon={<Ionicons name="heart" size={29} color="#FF3B30" />}
                        showChevron={false}
                        onPress={handleSupportUs}
                    />
                </ItemGroup>
            )}

            {/* Social */}
            {/* <ItemGroup title={t('settings.social')}>
                <Item
                    title={t('navigation.friends')}
                    subtitle={t('friends.manageFriends')}
                    icon={<Ionicons name="people-outline" size={29} color="#007AFF" />}
                    onPress={() => router.push('/friends')}
                />
            </ItemGroup> */}

            {/* Machines (sorted: online first, then last seen desc) */}
            {allMachinesWithOffline.length > 0 && (
                <ItemGroup title={t('settings.machines')}>
                    {visibleMachines.map((machine) => {
                        const isOnline = isMachineOnline(machine);
                        const host = machine.metadata?.host || 'Unknown';
                        const displayName = machine.metadata?.displayName;
                        const platform = machine.metadata?.platform || '';

                        // Use displayName if available, otherwise use host
                        const title = displayName || host;

                        // Build subtitle: show hostname if different from title, plus platform and status
                        let subtitle = '';
                        if (displayName && displayName !== host) {
                            subtitle = host;
                        }
                        if (platform) {
                            subtitle = subtitle ? `${subtitle} • ${platform}` : platform;
                        }
                        subtitle = subtitle ? `${subtitle} • ${isOnline ? t('status.online') : t('status.offline')}` : (isOnline ? t('status.online') : t('status.offline'));

                        return (
                            <Item
                                key={machine.id}
                                title={title}
                                subtitle={subtitle}
                                icon={
                                    <Ionicons
                                        name="desktop-outline"
                                        size={29}
                                        color={isOnline ? theme.colors.status.connected : theme.colors.status.disconnected}
                                    />
                                }
                                onPress={() => router.push(`/machine/${machine.id}`)}
                            />
                        );
                    })}
                    {offlineMachineCount > 0 && (
                        <Item
                            title={showOfflineMachines
                                ? t('settings.hideOfflineMachines')
                                : t('settings.showOfflineMachines', { count: offlineMachineCount })}
                            onPress={() => setShowOfflineMachines(v => !v)}
                            showChevron={false}
                            titleStyle={{
                                textAlign: 'center',
                                color: theme.colors.textLink,
                            }}
                        />
                    )}
                </ItemGroup>
            )}

            {/* Features */}
            <ItemGroup title={t('settings.features')}>
                <Item
                    title={t('settings.account')}
                    subtitle={t('settings.accountSubtitle')}
                    icon={<Ionicons name="person-circle-outline" size={29} color="#007AFF" />}
                    onPress={() => router.push('/settings/account')}
                />
                <Item
                    title={t('settings.appearance')}
                    subtitle={t('settings.appearanceSubtitle')}
                    icon={<Ionicons name="color-palette-outline" size={29} color="#5856D6" />}
                    onPress={() => router.push('/settings/appearance')}
                />
                <Item
                    title={t('settings.voiceAssistant')}
                    subtitle={t('settings.voiceAssistantSubtitle')}
                    icon={<Ionicons name="mic-outline" size={29} color="#34C759" />}
                    onPress={() => router.push('/settings/voice')}
                />
                <Item
                    title={t('settings.featuresTitle')}
                    subtitle={t('settings.featuresSubtitle')}
                    icon={<Ionicons name="flask-outline" size={29} color="#FF9500" />}
                    onPress={() => router.push('/settings/features')}
                />
                <Item
                    title={t('settings.systemStatus')}
                    subtitle={systemStatusSubtitle}
                    icon={<Ionicons name={systemStatusIconName} size={29} color={systemStatusIconColor} />}
                    onPress={() => router.push(isGatewayConnected ? '/help' : '/server')}
                />
                <Item
                    title={t('settings.quickPhrases')}
                    subtitle={t('settings.quickPhrasesSubtitle')}
                    icon={<Ionicons name="flash-outline" size={29} color="#FF9500" />}
                    onPress={() => router.push('/settings/shortcuts')}
                />
                <Item
                    title={t('settings.usage')}
                    subtitle={t('settings.usageSubtitle')}
                    icon={<Ionicons name="analytics-outline" size={29} color="#007AFF" />}
                    onPress={() => router.push('/settings/usage')}
                />
            </ItemGroup>

            {/* Developer */}
            {(__DEV__ || devModeEnabled) && (
                <ItemGroup title={t('settings.developer')}>
                    <Item
                        title={t('settings.developerTools')}
                        icon={<Ionicons name="construct-outline" size={29} color="#5856D6" />}
                        onPress={() => router.push('/dev')}
                    />
                </ItemGroup>
            )}

            {/* About */}
            <ItemGroup title={t('settings.about')} footer={t('settings.aboutFooter')}>
                <Item
                    title={t('settings.whatsNew')}
                    subtitle={t('settings.whatsNewSubtitle')}
                    icon={<Ionicons name="sparkles-outline" size={29} color="#FF9500" />}
                    onPress={() => {
                        trackWhatsNewClicked();
                        router.push('/changelog');
                    }}
                />
                <Item
                    title={t('settings.github')}
                    icon={<Ionicons name="logo-github" size={29} color={theme.colors.text} />}
                    detail="Jianghaiyangcc/easyCoder"
                    onPress={handleGitHub}
                />
                <Item
                    title={t('settings.reportIssue')}
                    icon={<Ionicons name="bug-outline" size={29} color="#FF3B30" />}
                    onPress={handleReportIssue}
                />
                <Item
                    title={t('settings.privacyPolicy')}
                    icon={<Ionicons name="shield-checkmark-outline" size={29} color="#007AFF" />}
                    onPress={async () => {
                        const url = 'https://code.daima.club/privacy/';
                        const supported = await Linking.canOpenURL(url);
                        if (supported) {
                            await Linking.openURL(url);
                        }
                    }}
                />
                <Item
                    title={t('settings.termsOfService')}
                    icon={<Ionicons name="document-text-outline" size={29} color="#007AFF" />}
                    onPress={async () => {
                        const url = 'https://github.com/Jianghaiyangcc/easyCoder/blob/main/TERMS.md';
                        const supported = await Linking.canOpenURL(url);
                        if (supported) {
                            await Linking.openURL(url);
                        }
                    }}
                />
                {Platform.OS === 'ios' && (
                    <Item
                        title={t('settings.eula')}
                        icon={<Ionicons name="document-text-outline" size={29} color="#007AFF" />}
                        onPress={async () => {
                            const url = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
                            const supported = await Linking.canOpenURL(url);
                            if (supported) {
                                await Linking.openURL(url);
                            }
                        }}
                    />
                )}
                <Item
                    title={t('common.version')}
                    detail={appVersion}
                    icon={<Ionicons name="information-circle-outline" size={29} color={theme.colors.textSecondary} />}
                    onPress={handleVersionClick}
                    showChevron={false}
                />
            </ItemGroup>

        </ItemList>
    );
});
