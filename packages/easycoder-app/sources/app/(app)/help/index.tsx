import * as React from 'react';
import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { AppIcon } from '@/components/AppIcon';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/components/StyledText';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Modal } from '@/modal';
import { useAuth } from '@/auth/AuthContext';
import { useAllMachines, useLocalSetting, useSocketStatus } from '@/sync/storage';
import { isMachineOnline } from '@/utils/machineUtils';
import { getServerInfo, getServerUrl } from '@/sync/serverConfig';
import { useConnectTerminal } from '@/hooks/useConnectTerminal';
import { t } from '@/text';

const stylesheet = StyleSheet.create((theme) => ({
    summaryCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginHorizontal: 16,
        marginTop: 16,
    },
    summaryHeader: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    summaryStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    summaryStatusText: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.colors.text,
    },
    summarySubtitle: {
        marginTop: 6,
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
}));

type OverallStatus = 'available' | 'partial' | 'unavailable';

function getClientTypeLabel(): keyof typeof clientTypeLabelByPlatform {
    if (Platform.OS === 'web') return 'web';
    if (Platform.OS === 'ios') return 'ios';
    if (Platform.OS === 'android') return 'android';
    return 'desktop';
}

const clientTypeLabelByPlatform = {
    web: 'help.clientTypeWeb',
    ios: 'help.clientTypeIOS',
    android: 'help.clientTypeAndroid',
    desktop: 'help.clientTypeDesktop',
} as const;

export default function HelpStatusScreen() {
    const { theme } = useUnistyles();
    const iconColor = theme.colors.icon ?? {
        primary: theme.colors.text,
        secondary: theme.colors.textSecondary,
        accent: theme.colors.textLink,
        success: theme.colors.status.connected,
        warning: theme.colors.warning,
        danger: theme.colors.textDestructive,
    };
    const styles = stylesheet;
    const router = useRouter();
    const auth = useAuth();
    const socketStatus = useSocketStatus();
    const customServerEnabled = useLocalSetting('customServerEnabled');
    const machines = useAllMachines({ includeOffline: true });
    const { connectTerminal, connectWithUrl, isLoading } = useConnectTerminal();

    const onlineMachines = React.useMemo(() => machines.filter(isMachineOnline), [machines]);
    const offlineMachines = React.useMemo(() => machines.filter((m) => !isMachineOnline(m)), [machines]);

    const overallStatus: OverallStatus = React.useMemo(() => {
        if (!auth.isAuthenticated || socketStatus.status !== 'connected') {
            return 'unavailable';
        }
        if (onlineMachines.length === 0) {
            return 'partial';
        }
        return 'available';
    }, [auth.isAuthenticated, socketStatus.status, onlineMachines.length]);

    const overallStatusText =
        overallStatus === 'available'
            ? t('help.statusAvailable')
            : overallStatus === 'partial'
                ? t('help.statusPartial')
                : t('help.statusUnavailable');

    const overallHintText =
        overallStatus === 'available'
            ? t('help.availableHint')
            : overallStatus === 'partial'
                ? t('help.partialHint')
                : t('help.unavailableHint');

    const overallColor =
        overallStatus === 'available'
            ? theme.colors.status.connected
            : overallStatus === 'partial'
                ? theme.colors.status.connecting
                : theme.colors.status.disconnected;

    const appVersion = Constants.expoConfig?.version || 'unknown';
    const serverInfo = getServerInfo();
    const serverUrl = getServerUrl();

    const socketStatusLabel =
        socketStatus.status === 'connected'
            ? t('status.connected')
            : socketStatus.status === 'connecting'
                ? t('status.connecting')
                : socketStatus.status === 'error'
                    ? t('status.error')
                    : t('status.disconnected');
    const gatewayDisconnected = socketStatus.status !== 'connected';
    const showNoOnlineMachinesHint = onlineMachines.length === 0;

    const clientTypeKey = clientTypeLabelByPlatform[getClientTypeLabel()];

    return (
        <ItemList style={{ paddingTop: 0 }}>
            <View style={styles.summaryCard}>
                <Text style={styles.summaryHeader}>{t('help.overallStatus')}</Text>
                <View style={styles.summaryStatusRow}>
                    <AppIcon
                        name={
                            overallStatus === 'available'
                                ? 'checkmark-circle'
                                : overallStatus === 'partial'
                                    ? 'warning'
                                    : 'alert-circle'
                        }
                        size={22}
                        color={overallColor}
                    />
                    <Text style={[styles.summaryStatusText, { color: overallColor }]}>{overallStatusText}</Text>
                </View>
                <Text style={styles.summarySubtitle}>{overallHintText}</Text>
            </View>

            <ItemGroup title={t('help.clientSection')} footer={t('help.subtitle')}>
                <Item
                    title={t('help.clientType')}
                    detail={t(clientTypeKey)}
                    icon={<AppIcon name="phone-portrait-outline" size={29} color={iconColor.accent} />}
                    showChevron={false}
                />
                <Item
                    title={t('help.appVersion')}
                    detail={appVersion}
                    icon={<AppIcon name="pricetag-outline" size={29} color={iconColor.secondary} />}
                    showChevron={false}
                />
                <Item
                    title={t('help.accountStatus')}
                    detail={auth.isAuthenticated ? t('help.accountConnected') : t('help.accountNotConnected')}
                    icon={<AppIcon name="person-circle-outline" size={29} color={auth.isAuthenticated ? theme.colors.status.connected : theme.colors.status.disconnected} />}
                    showChevron={false}
                />
            </ItemGroup>

            <ItemGroup title={t('help.gatewaySection')}>
                <Item
                    title={t('help.gatewayAddress')}
                    subtitle={serverInfo.isCustom ? serverUrl : undefined}
                    detail={serverInfo.isCustom
                        ? (serverInfo.port ? `${serverInfo.hostname}:${serverInfo.port}` : serverInfo.hostname)
                        : t('help.gatewayAddressOfficial')}
                    icon={<AppIcon name="server-outline" size={29} color={iconColor.success} />}
                    showChevron={false}
                />
                <Item
                    title={t('help.gatewayMode')}
                    detail={customServerEnabled ? t('help.gatewayModeCustom') : t('help.gatewayModeDefault')}
                    icon={<AppIcon name="options-outline" size={29} color={iconColor.warning} />}
                    showChevron={false}
                />
                <Item
                    title={t('help.gatewayConnection')}
                    detail={socketStatusLabel}
                    subtitle={gatewayDisconnected ? t('help.openServerConfig') : undefined}
                    icon={<AppIcon name={gatewayDisconnected ? 'alert-circle-outline' : 'radio-outline'} size={29} color={socketStatus.status === 'connected' ? theme.colors.status.connected : theme.colors.status.disconnected} />}
                    onPress={gatewayDisconnected ? () => router.push('/server') : undefined}
                    showChevron={gatewayDisconnected}
                />
            </ItemGroup>

            <ItemGroup title={t('help.machinesSection')}>
                <Item
                    title={t('help.machinesTotal')}
                    detail={String(machines.length)}
                    icon={<AppIcon name="desktop-outline" size={29} color={iconColor.secondary} />}
                    showChevron={false}
                />
                <Item
                    title={t('help.machinesOnline')}
                    detail={String(onlineMachines.length)}
                    icon={<AppIcon name="ellipse" size={14} color={theme.colors.status.connected} />}
                    subtitle={showNoOnlineMachinesHint ? t('help.noMachines') : undefined}
                    onPress={
                        showNoOnlineMachinesHint
                            ? () => {
                                Modal.alert(
                                    t('help.machinesOnline'),
                                    `${t('help.noMachines')}\n\n${t('machine.offlineHelp')}`
                                );
                            }
                            : undefined
                    }
                    showChevron={showNoOnlineMachinesHint}
                />
                <Item
                    title={t('help.machinesOffline')}
                    detail={String(offlineMachines.length)}
                    icon={<AppIcon name="ellipse" size={14} color={theme.colors.status.disconnected} />}
                    showChevron={false}
                />

                {machines.length === 0 && (
                    <Item
                        title={t('help.noMachines')}
                        icon={<AppIcon name="alert-circle-outline" size={29} color={iconColor.warning} />}
                        showChevron={false}
                    />
                )}

                {machines.slice(0, 5).map((machine) => {
                    const online = isMachineOnline(machine);
                    const host = machine.metadata?.host || machine.id;
                    const displayName = machine.metadata?.displayName || host;
                    const platform = machine.metadata?.platform;
                    const subtitle = platform ? `${platform} • ${online ? t('status.online') : t('status.offline')}` : (online ? t('status.online') : t('status.offline'));

                    return (
                        <Item
                            key={machine.id}
                            title={displayName}
                            subtitle={subtitle}
                            icon={<AppIcon name="desktop-outline" size={29} color={online ? theme.colors.status.connected : theme.colors.status.disconnected} />}
                            onPress={() => router.push(`/machine/${machine.id}`)}
                        />
                    );
                })}
            </ItemGroup>

            <ItemGroup title={t('help.actionsSection')}>
                {Platform.OS !== 'web' && (
                    <Item
                        title={t('help.connectTerminal')}
                        icon={<AppIcon name="qr-code-outline" size={29} color={iconColor.accent} />}
                        onPress={connectTerminal}
                        loading={isLoading}
                        showChevron={false}
                    />
                )}
                <Item
                    title={t('help.enterUrlManually')}
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
                <Item
                    title={t('help.openServerConfig')}
                    icon={<AppIcon name="server-outline" size={29} color={iconColor.success} />}
                    onPress={() => router.push('/server')}
                />
                <Item
                    title={t('help.startNewSession')}
                    icon={<AppIcon name="add-circle-outline" size={29} color={iconColor.secondary} />}
                    onPress={() => router.push('/new')}
                />
            </ItemGroup>
        </ItemList>
    );
}
