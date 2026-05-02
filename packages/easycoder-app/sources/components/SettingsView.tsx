import { View, Platform, Linking, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import * as React from 'react';
import { Text } from '@/components/StyledText';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import Constants from 'expo-constants';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { useConnectTerminal } from '@/hooks/useConnectTerminal';
import { useEntitlement, useLocalSettingMutable, useSocketStatus } from '@/sync/storage';
import { sync } from '@/sync/sync';
import { trackWhatsNewClicked } from '@/track';
import { Modal } from '@/modal';
import { WeChatQRCodeModal } from '@/components/WeChatQRCodeModal';
import { useMultiClick } from '@/hooks/useMultiClick';
import { useAllMachines } from '@/sync/storage';
import { isMachineOnline } from '@/utils/machineUtils';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { layout } from '@/components/layout';
import { useProfile } from '@/sync/storage';
import { getDisplayName, getAvatarUrl, getBio } from '@/sync/profile';
import { Avatar } from '@/components/Avatar';
import { t } from '@/text';

const stylesheet = StyleSheet.create((theme) => ({
    headerWrap: {
        maxWidth: layout.maxWidth,
        alignSelf: 'center',
        width: '100%',
    },
    headerCard: {
        overflow: 'hidden',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 24,
        backgroundColor: theme.colors.surface,
        marginTop: 16,
        borderRadius: 16,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        shadowColor: theme.colors.shadow.color,
        shadowOpacity: theme.dark ? 0.3 : 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
    },
    headerAccent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: theme.colors.textLink,
        opacity: theme.dark ? 0.5 : 0.75,
    },
    profileName: {
        fontSize: 22,
        color: theme.colors.text,
        marginBottom: 4,
        fontFamily: 'BricolageGrotesque-Bold',
    },
    profileBio: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    metricsRow: {
        marginTop: 12,
        flexDirection: 'row',
        gap: 10,
    },
    metricPill: {
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        minWidth: 110,
        borderWidth: 1,
    },
    metricLabel: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        marginBottom: 2,
    },
    metricValue: {
        fontSize: 13,
        color: theme.colors.text,
        fontWeight: '600',
    },
}));

export const SettingsView = React.memo(function SettingsView() {
    const { theme } = useUnistyles();
    const styles = stylesheet;
    const router = useRouter();
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    const [devModeEnabled, setDevModeEnabled] = useLocalSettingMutable('devModeEnabled');
    const hasPro = useEntitlement('pro');
    const socketStatus = useSocketStatus();
    const [showOfflineMachines, setShowOfflineMachines] = React.useState(false);
    const allMachinesWithOffline = useAllMachines({ includeOffline: true });
    const onlineMachineCount = React.useMemo(
        () => allMachinesWithOffline.filter(isMachineOnline).length,
        [allMachinesWithOffline]
    );
    const iconColor = theme.colors.icon ?? {
        primary: theme.colors.text,
        secondary: theme.colors.textSecondary,
        accent: theme.colors.textLink,
        success: theme.colors.status.connected,
        warning: theme.colors.warning,
        danger: theme.colors.textDestructive,
    };
    const isGatewayConnected = socketStatus.status === 'connected';
    const systemStatusIconName = !isGatewayConnected
        ? 'alert-circle-outline'
        : onlineMachineCount === 0
            ? 'warning-outline'
            : 'analytics-outline';
    const systemStatusIconColor = !isGatewayConnected
        ? iconColor.danger
        : onlineMachineCount === 0
            ? iconColor.warning
            : iconColor.success;
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
    const planLabel = hasPro ? 'PRO' : 'FREE';
    const connectivityLabel = isGatewayConnected ? t('status.online') : t('status.offline');
    const machineSummary = `${onlineMachineCount}/${allMachinesWithOffline.length}`;

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
            <View style={styles.headerWrap}>
                <View style={styles.headerCard}>
                    <View style={styles.headerAccent} />
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
                            <Text style={styles.profileName}>
                                {displayName}
                            </Text>
                            {bio && (
                                <Text style={styles.profileBio}>
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
                    <View style={styles.badgeRow}>
                        <View style={[styles.badge, {
                            borderColor: hasPro ? 'rgba(52,199,89,0.45)' : 'rgba(142,142,147,0.45)',
                            backgroundColor: hasPro ? 'rgba(52,199,89,0.12)' : 'rgba(142,142,147,0.1)',
                        }]}>
                            <AppIcon
                                name={hasPro ? 'sparkles-outline' : 'person-circle-outline'}
                                size={14}
                                color={hasPro ? theme.colors.status.connected : theme.colors.textSecondary}
                            />
                            <Text style={[styles.badgeText, { color: hasPro ? theme.colors.status.connected : theme.colors.textSecondary }]}>
                                {planLabel}
                            </Text>
                        </View>
                        <View style={[styles.badge, {
                            borderColor: isGatewayConnected ? 'rgba(10,132,255,0.45)' : 'rgba(255,149,0,0.45)',
                            backgroundColor: isGatewayConnected ? 'rgba(10,132,255,0.12)' : 'rgba(255,149,0,0.12)',
                        }]}>
                            <AppIcon
                                name={isGatewayConnected ? 'radio-outline' : 'warning-outline'}
                                size={14}
                                color={isGatewayConnected ? theme.colors.textLink : theme.colors.warning}
                            />
                            <Text style={[styles.badgeText, { color: isGatewayConnected ? theme.colors.textLink : theme.colors.warning }]}>
                                {connectivityLabel}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.metricsRow}>
                        <View style={[styles.metricPill, {
                            borderColor: theme.dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)',
                            backgroundColor: theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
                        }]}>
                            <Text style={styles.metricLabel}>{t('settings.machines')}</Text>
                            <Text style={styles.metricValue}>{machineSummary}</Text>
                        </View>
                        <View style={[styles.metricPill, {
                            borderColor: theme.dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)',
                            backgroundColor: theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
                        }]}>
                            <Text style={styles.metricLabel}>{t('common.version')}</Text>
                            <Text style={styles.metricValue}>{appVersion}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Connect Terminal */}
            <ItemGroup>
                {Platform.OS !== 'web' && (
                    <Item
                        title={t('settings.scanQrCodeToAuthenticate')}
                        icon={<AppIcon name="qr-code-outline" size={29} color={iconColor.accent} />}
                        onPress={connectTerminal}
                        loading={isLoading}
                        showChevron={false}
                    />
                )}
                <Item
                    title={t('connect.enterUrlManually')}
                    icon={<AppIcon name="link-outline" size={29} color={iconColor.accent} />}
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

            {/* Support Us */}
            <ItemGroup>
                <Item
                    title={t('subscription.title')}
                    subtitle={hasPro ? t('subscription.manageSubscription') : t('subscription.upgradeToPro')}
                    icon={<AppIcon name="pricetag-outline" size={29} color={iconColor.accent} />}
                    onPress={() => router.push('/settings/subscription')}
                />
                <Item
                    title={t('settings.supportUs')}
                    subtitle={hasPro ? t('settings.supportUsSubtitlePro') : t('settings.supportUsSubtitle')}
                    icon={<AppIcon name="heart" size={29} color={iconColor.danger} />}
                    showChevron={false}
                    onPress={handleSupportUs}
                />
            </ItemGroup>

            {/* Social */}
            {/* <ItemGroup title={t('settings.social')}>
                <Item
                    title={t('navigation.friends')}
                    subtitle={t('friends.manageFriends')}
                    icon={<AppIcon name="people-outline" size={29} color={iconColor.accent} />}
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
                                    <AppIcon
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
                    icon={<AppIcon name="person-circle-outline" size={29} color={iconColor.primary} />}
                    onPress={() => router.push('/settings/account')}
                />
                <Item
                    title={t('settings.appearance')}
                    subtitle={t('settings.appearanceSubtitle')}
                    icon={<AppIcon name="color-palette-outline" size={29} color={iconColor.secondary} />}
                    onPress={() => router.push('/settings/appearance')}
                />
                <Item
                    title={t('settings.voiceAssistant')}
                    subtitle={t('settings.voiceAssistantSubtitle')}
                    icon={<AppIcon name="mic-outline" size={29} color={iconColor.success} />}
                    onPress={() => router.push('/settings/voice')}
                />
                <Item
                    title={t('settings.featuresTitle')}
                    subtitle={t('settings.featuresSubtitle')}
                    icon={<AppIcon name="flask-outline" size={29} color={iconColor.secondary} />}
                    onPress={() => router.push('/settings/features')}
                />
                <Item
                    title={t('settings.systemStatus')}
                    subtitle={systemStatusSubtitle}
                    icon={<AppIcon name={systemStatusIconName} size={29} color={systemStatusIconColor} />}
                    onPress={() => router.push(isGatewayConnected ? '/help' : '/server')}
                />
                <Item
                    title={t('settings.quickPhrases')}
                    subtitle={t('settings.quickPhrasesSubtitle')}
                    icon={<AppIcon name="flash-outline" size={29} color={iconColor.secondary} />}
                    onPress={() => router.push('/settings/shortcuts')}
                />
                <Item
                    title={t('settings.usage')}
                    subtitle={t('settings.usageSubtitle')}
                    icon={<AppIcon name="analytics-outline" size={29} color={iconColor.accent} />}
                    onPress={() => router.push('/settings/usage')}
                />
            </ItemGroup>

            {/* Developer */}
            {(__DEV__ || devModeEnabled) && (
                <ItemGroup title={t('settings.developer')}>
                    <Item
                        title={t('settings.developerTools')}
                        icon={<AppIcon name="construct-outline" size={29} color={iconColor.secondary} />}
                        onPress={() => router.push('/dev')}
                    />
                </ItemGroup>
            )}

            {/* About */}
            <ItemGroup title={t('settings.about')} footer={t('settings.aboutFooter')}>
                <Item
                    title={t('settings.whatsNew')}
                    subtitle={t('settings.whatsNewSubtitle')}
                    icon={<AppIcon name="sparkles-outline" size={29} color={iconColor.accent} />}
                    onPress={() => {
                        trackWhatsNewClicked();
                        router.push('/changelog');
                    }}
                />
                <Item
                    title={t('settings.github')}
                    icon={<AppIcon name="logo-github" size={29} color={iconColor.primary} />}
                    detail="Jianghaiyangcc/easyCoder"
                    onPress={handleGitHub}
                />
                <Item
                    title={t('settings.reportIssue')}
                    icon={<AppIcon name="bug-outline" size={29} color={iconColor.danger} />}
                    onPress={handleReportIssue}
                />
                <Item
                    title={t('settings.privacyPolicy')}
                    icon={<AppIcon name="shield-checkmark-outline" size={29} color={iconColor.secondary} />}
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
                    icon={<AppIcon name="document-text-outline" size={29} color={iconColor.secondary} />}
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
                        icon={<AppIcon name="document-text-outline" size={29} color={iconColor.secondary} />}
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
                    icon={<AppIcon name="information-circle-outline" size={29} color={iconColor.secondary} />}
                    onPress={handleVersionClick}
                    showChevron={false}
                />
            </ItemGroup>

        </ItemList>
    );
});
