import React, { useCallback } from 'react';
import { View, Text, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { Typography } from '@/constants/Typography';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Avatar } from '@/components/Avatar';
import { useSession, useIsDataReady } from '@/sync/storage';
import { getSessionName, useSessionStatus, formatOSPlatform, formatPathRelativeToHome, getSessionAvatarId, getResumeCommand } from '@/utils/sessionUtils';
import * as Clipboard from 'expo-clipboard';
import { Modal } from '@/modal';
import { sessionArchive, sessionKill, sessionDelete } from '@/sync/ops';
import { maybeCleanupWorktree } from '@/hooks/useWorktreeCleanup';
import { useUnistyles } from 'react-native-unistyles';
import { layout } from '@/components/layout';
import { t } from '@/text';
import { isVersionSupported, MINIMUM_CLI_VERSION } from '@/utils/versionUtils';
import { CodeView } from '@/components/CodeView';
import { Session } from '@/sync/storageTypes';
import { useHappyAction } from '@/hooks/useHappyAction';
import { useSessionQuickActions } from '@/hooks/useSessionQuickActions';
import { copySessionMetadataToClipboard, copySessionMetadataAndLogsToClipboard } from '@/utils/copySessionMetadataToClipboard';
import { EasycoderError } from '@/utils/errors';

// Animated status dot component
function StatusDot({ color, isPulsing, size = 8 }: { color: string; isPulsing?: boolean; size?: number }) {
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        if (isPulsing) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 0.3,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isPulsing, pulseAnim]);

    return (
        <Animated.View
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                opacity: pulseAnim,
                marginRight: 4,
            }}
        />
    );
}

function formatSandboxMetadata(sandbox: unknown, homeDir?: string): string {
    if (sandbox === null || sandbox === undefined) {
        return 'Disabled';
    }

    if (typeof sandbox === 'string') {
        return sandbox;
    }

    if (typeof sandbox !== 'object') {
        return String(sandbox);
    }

    const value = sandbox as Record<string, unknown>;
    if (value.enabled === false) {
        return 'Disabled';
    }

    const parts: string[] = ['Enabled'];
    const isolation = typeof value.sessionIsolation === 'string' ? value.sessionIsolation : undefined;
    const networkMode = typeof value.networkMode === 'string' ? value.networkMode : undefined;
    const workspaceRoot = typeof value.workspaceRoot === 'string' ? value.workspaceRoot : undefined;

    if (isolation) {
        parts.push(`isolation=${isolation}`);
    }
    if (networkMode) {
        parts.push(`network=${networkMode}`);
    }
    if (workspaceRoot) {
        parts.push(`workspace=${formatPathRelativeToHome(workspaceRoot, homeDir)}`);
    }

    return parts.join(' | ');
}

function formatDangerouslySkipPermissionsMetadata(
    value: unknown,
    flavor: string | null | undefined,
    permissionMode: Session['permissionMode'],
    sandbox: unknown,
): string {
    if (typeof value === 'boolean') {
        return value ? 'Enabled' : 'Disabled';
    }

    if (permissionMode === 'bypassPermissions' || permissionMode === 'yolo') {
        return 'Enabled';
    }

    if (flavor === 'claude' && sandbox && typeof sandbox === 'object') {
        const sandboxValue = sandbox as Record<string, unknown>;
        if (sandboxValue.enabled === true) {
            return 'Enabled';
        }
    }

    return 'Unknown';
}

function SessionInfoContent({ session }: { session: Session }) {
    const { theme } = useUnistyles();
    const iconColor = theme.colors.icon ?? {
        primary: theme.colors.text,
        secondary: theme.colors.textSecondary,
        accent: theme.colors.textLink,
        success: theme.colors.status.connected,
        warning: theme.colors.warning,
        danger: theme.colors.textDestructive,
    };
    const router = useRouter();
    const devModeEnabled = __DEV__;
    const sessionName = getSessionName(session);
    const sessionStatus = useSessionStatus(session);
    const {
        canShowResume,
        resumeSession,
        resumeSessionSubtitle,
    } = useSessionQuickActions(session);
    
    // Check if CLI version is outdated
    const isCliOutdated = session.metadata?.version && !isVersionSupported(session.metadata.version, MINIMUM_CLI_VERSION);

    const handleCopySessionId = useCallback(async () => {
        if (!session) return;
        try {
            await Clipboard.setStringAsync(session.id);
            Modal.alert(t('common.success'), t('sessionInfo.easycoderSessionIdCopied'));
        } catch (error) {
            Modal.alert(t('common.error'), t('sessionInfo.failedToCopySessionId'));
        }
    }, [session]);

    const handleCopyMetadata = useCallback(() => {
        void copySessionMetadataToClipboard(session);
    }, [session]);

    const handleCopyMetadataAndLogs = useCallback(() => {
        void copySessionMetadataAndLogsToClipboard(session);
    }, [session]);

    // Use HappyAction for archiving - it handles errors automatically
    const [archivingSession, performArchive] = useHappyAction(async () => {
        // Prompt for worktree cleanup before killing (needs an active machine connection)
        await maybeCleanupWorktree(session.id, session.metadata?.path, session.metadata?.machineId);

        // Try to kill the CLI process; if it's already dead, force-archive via server
        const killResult = await sessionKill(session.id);
        if (!killResult.success) {
            await sessionArchive(session.id);
        }
        // Success - navigate back
        router.back();
        router.back();
    });

    const handleArchiveSession = useCallback(() => {
        performArchive();
    }, [performArchive]);

    // Use HappyAction for deletion - kills session first if needed, then deletes
    const [deletingSession, performDelete] = useHappyAction(async () => {
        // Prompt for worktree cleanup before killing (needs an active machine connection)
        await maybeCleanupWorktree(session.id, session.metadata?.path, session.metadata?.machineId);

        // Navigate back optimistically
        router.back();
        router.back();

        // Kill session first if it's still active (best-effort)
        if (sessionStatus.isConnected || session.active) {
            await sessionKill(session.id).catch(() => {});
        }

        const result = await sessionDelete(session.id);
        if (!result.success) {
            throw new EasycoderError(result.message || t('sessionInfo.failedToDeleteSession'), false);
        }
    });

    const handleDeleteSession = useCallback(() => {
        Modal.alert(
            t('sessionInfo.deleteSession'),
            t('sessionInfo.deleteSessionWarning'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('sessionInfo.deleteSession'),
                    style: 'destructive',
                    onPress: performDelete
                }
            ]
        );
    }, [performDelete]);

    const formatDate = useCallback((timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    }, []);

    const handleCopyUpdateCommand = useCallback(async () => {
        const updateCommand = 'npm install -g easycoder@latest';
        try {
            await Clipboard.setStringAsync(updateCommand);
            Modal.alert(t('common.success'), updateCommand);
        } catch (error) {
            Modal.alert(t('common.error'), t('common.error'));
        }
    }, []);

    return (
        <>
            <ItemList>
                {/* Session Header */}
                <View style={{ maxWidth: layout.maxWidth, alignSelf: 'center', width: '100%' }}>
                    <View style={{ alignItems: 'center', paddingVertical: 24, backgroundColor: theme.colors.surface, marginBottom: 8, borderRadius: 12, marginHorizontal: 16, marginTop: 16 }}>
                        <Avatar id={getSessionAvatarId(session)} size={80} monochrome={!sessionStatus.isConnected} flavor={session.metadata?.flavor} />
                        <Text style={{
                            fontSize: 20,
                            fontWeight: '600',
                            marginTop: 12,
                            textAlign: 'center',
                            color: theme.colors.text,
                            ...Typography.default('semiBold')
                        }}>
                            {sessionName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                            <StatusDot color={sessionStatus.statusDotColor} isPulsing={sessionStatus.isPulsing} size={10} />
                            <Text style={{
                                fontSize: 15,
                                color: sessionStatus.statusColor,
                                fontWeight: '500',
                                ...Typography.default()
                            }}>
                                {sessionStatus.statusText}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* CLI Version Warning */}
                {isCliOutdated && (
                    <ItemGroup>
                        <Item
                            title={t('sessionInfo.cliVersionOutdated')}
                            subtitle={t('sessionInfo.updateCliInstructions')}
                            icon={<AppIcon name="warning-outline" size={29} color={iconColor.warning} />}
                            showChevron={false}
                            onPress={handleCopyUpdateCommand}
                        />
                    </ItemGroup>
                )}

                {/* Session Details */}
                <ItemGroup>
                    <Item
                        title={t('sessionInfo.easycoderSessionId')}
                        subtitle={`${session.id.substring(0, 8)}...${session.id.substring(session.id.length - 8)}`}
                        icon={<AppIcon name="finger-print-outline" size={29} color={iconColor.accent} />}
                        onPress={handleCopySessionId}
                    />
                    {session.metadata?.claudeSessionId && (
                        <Item
                            title={t('sessionInfo.claudeCodeSessionId')}
                            subtitle={`${session.metadata.claudeSessionId.substring(0, 8)}...${session.metadata.claudeSessionId.substring(session.metadata.claudeSessionId.length - 8)}`}
                            icon={<AppIcon name="code-outline" size={29} color={iconColor.secondary} />}
                            onPress={async () => {
                                try {
                                    await Clipboard.setStringAsync(session.metadata!.claudeSessionId!);
                                    Modal.alert(t('common.success'), t('sessionInfo.claudeCodeSessionIdCopied'));
                                } catch (error) {
                                    Modal.alert(t('common.error'), t('sessionInfo.failedToCopyClaudeCodeSessionId'));
                                }
                            }}
                        />
                    )}
                    {session.metadata?.codexThreadId && (
                        <Item
                            title={t('sessionInfo.codexThreadId')}
                            subtitle={`${session.metadata.codexThreadId.substring(0, 8)}...${session.metadata.codexThreadId.substring(session.metadata.codexThreadId.length - 8)}`}
                            icon={<AppIcon name="terminal-outline" size={29} color={iconColor.accent} />}
                            onPress={async () => {
                                try {
                                    await Clipboard.setStringAsync(session.metadata!.codexThreadId!);
                                    Modal.alert(t('common.success'), t('sessionInfo.codexThreadIdCopied'));
                                } catch (error) {
                                    Modal.alert(t('common.error'), t('sessionInfo.failedToCopyCodexThreadId'));
                                }
                            }}
                        />
                    )}
                    {/* Resume command — shown for disconnected sessions with a backend session ID */}
                    {/* TODO: migrate to `easycoder resume <session-id>` once it works without easycoder-agent auth */}
                    {!sessionStatus.isConnected && getResumeCommand(session) && (
                        <CopyableItem
                            title="Resume Command"
                            subtitle={getResumeCommand(session)!}
                            icon={<AppIcon name="play-circle-outline" size={29} color={iconColor.success} />}
                            copyText={getResumeCommand(session)!}
                        />
                    )}
                    <Item
                        title={t('sessionInfo.connectionStatus')}
                        detail={sessionStatus.isConnected ? t('status.online') : t('status.offline')}
                        icon={<AppIcon name="pulse-outline" size={29} color={sessionStatus.isConnected ? iconColor.success : iconColor.secondary} />}
                        showChevron={false}
                    />
                    <Item
                        title={t('sessionInfo.created')}
                        subtitle={formatDate(session.createdAt)}
                        icon={<AppIcon name="calendar-outline" size={29} color={iconColor.accent} />}
                        showChevron={false}
                    />
                    <Item
                        title={t('sessionInfo.lastUpdated')}
                        subtitle={formatDate(session.updatedAt)}
                        icon={<AppIcon name="time-outline" size={29} color={iconColor.accent} />}
                        showChevron={false}
                    />
                    <Item
                        title={t('sessionInfo.sequence')}
                        detail={session.seq.toString()}
                        icon={<AppIcon name="git-commit-outline" size={29} color={iconColor.accent} />}
                        showChevron={false}
                    />
                </ItemGroup>

                {/* Quick Actions */}
                <ItemGroup title={t('sessionInfo.quickActions')}>
                    {session.metadata?.machineId && (
                        <Item
                            title={t('sessionInfo.viewMachine')}
                            subtitle={t('sessionInfo.viewMachineSubtitle')}
                            icon={<AppIcon name="server-outline" size={29} color={iconColor.accent} />}
                            onPress={() => router.push(`/machine/${session.metadata?.machineId}`)}
                        />
                    )}
                    {canShowResume && (
                        <Item
                            title={t('sessionInfo.resumeSession')}
                            subtitle={resumeSessionSubtitle}
                            icon={<AppIcon name="play-circle-outline" size={29} color={iconColor.accent} />}
                            onPress={resumeSession}
                        />
                    )}
                    <Item
                        title={t('sessionInfo.archiveSession')}
                        subtitle={t('sessionInfo.archiveSessionSubtitle')}
                        icon={<AppIcon name="archive-outline" size={29} color={iconColor.danger} />}
                        onPress={handleArchiveSession}
                    />
                    <Item
                        title={t('sessionInfo.deleteSession')}
                        subtitle={t('sessionInfo.deleteSessionSubtitle')}
                        icon={<AppIcon name="trash-outline" size={29} color={iconColor.danger} />}
                        onPress={handleDeleteSession}
                    />
                </ItemGroup>

                {/* Metadata */}
                {session.metadata && (
                    <ItemGroup title={t('sessionInfo.metadata')}>
                        <Item
                            title={t('sessionInfo.host')}
                            subtitle={session.metadata.host}
                            icon={<AppIcon name="desktop-outline" size={29} color={iconColor.secondary} />}
                            showChevron={false}
                        />
                        <Item
                            title={t('sessionInfo.path')}
                            subtitle={formatPathRelativeToHome(session.metadata.path, session.metadata.homeDir)}
                            icon={<AppIcon name="folder-outline" size={29} color={iconColor.secondary} />}
                            showChevron={false}
                        />
                        {session.metadata.version && (
                            <Item
                                title={t('sessionInfo.cliVersion')}
                                subtitle={session.metadata.version}
                                detail={isCliOutdated ? '⚠️' : undefined}
                                icon={<AppIcon name="git-branch-outline" size={29} color={isCliOutdated ? iconColor.warning : iconColor.secondary} />}
                                showChevron={false}
                            />
                        )}
                        {session.metadata.os && (
                            <Item
                                title={t('sessionInfo.operatingSystem')}
                                subtitle={formatOSPlatform(session.metadata.os)}
                                icon={<AppIcon name="hardware-chip-outline" size={29} color={iconColor.secondary} />}
                                showChevron={false}
                            />
                        )}
                        <Item
                            title={t('sessionInfo.aiProvider')}
                            subtitle={(() => {
                                const flavor = session.metadata.flavor || 'claude';
                                if (flavor === 'claude') return 'Claude';
                                if (flavor === 'gpt' || flavor === 'openai') return 'Codex';
                                if (flavor === 'gemini') return 'Gemini';
                                if (flavor === 'openclaw') return 'OpenClaw';
                                if (flavor === 'opencode') return 'OpenCode';
                                return flavor;
                            })()}
                            icon={<AppIcon name="sparkles-outline" size={29} color={iconColor.secondary} />}
                            showChevron={false}
                        />
                        <Item
                            title="Sandbox"
                            subtitle={formatSandboxMetadata(session.metadata.sandbox, session.metadata.homeDir)}
                            icon={<AppIcon name="shield-outline" size={29} color={iconColor.secondary} />}
                            showChevron={false}
                        />
                        <Item
                            title="Dangerously Skip Permissions"
                            subtitle={formatDangerouslySkipPermissionsMetadata(
                                session.metadata.dangerouslySkipPermissions,
                                session.metadata.flavor,
                                session.permissionMode,
                                session.metadata.sandbox,
                            )}
                            icon={<AppIcon name="warning-outline" size={29} color={iconColor.secondary} />}
                            showChevron={false}
                        />
                        {session.metadata.hostPid && (
                            <Item
                                title={t('sessionInfo.processId')}
                                subtitle={session.metadata.hostPid.toString()}
                                icon={<AppIcon name="terminal-outline" size={29} color={iconColor.secondary} />}
                                showChevron={false}
                            />
                        )}
                        {session.metadata.easycoderHomeDir && (
                            <Item
                                title={t('sessionInfo.easycoderHome')}
                                subtitle={formatPathRelativeToHome(session.metadata.easycoderHomeDir, session.metadata.homeDir)}
                                icon={<AppIcon name="home-outline" size={29} color={iconColor.secondary} />}
                                showChevron={false}
                            />
                        )}
                        <Item
                            title={t('sessionInfo.copyMetadata')}
                            icon={<AppIcon name="copy-outline" size={29} color={iconColor.accent} />}
                            onPress={handleCopyMetadata}
                        />
                        <Item
                            title={t('sessionInfo.copyMetadata') + '\n& Client Logs'}
                            icon={<AppIcon name="document-text-outline" size={29} color={iconColor.accent} />}
                            onPress={handleCopyMetadataAndLogs}
                        />
                    </ItemGroup>
                )}

                {/* Agent State */}
                {session.agentState && (
                    <ItemGroup title={t('sessionInfo.agentState')}>
                        <Item
                            title={t('sessionInfo.controlledByUser')}
                            detail={session.agentState.controlledByUser ? t('common.yes') : t('common.no')}
                            icon={<AppIcon name="person-outline" size={29} color={iconColor.warning} />}
                            showChevron={false}
                        />
                        {session.agentState.requests && Object.keys(session.agentState.requests).length > 0 && (
                            <Item
                                title={t('sessionInfo.pendingRequests')}
                                detail={Object.keys(session.agentState.requests).length.toString()}
                                icon={<AppIcon name="hourglass-outline" size={29} color={iconColor.warning} />}
                                showChevron={false}
                            />
                        )}
                    </ItemGroup>
                )}

                {/* Activity */}
                <ItemGroup title={t('sessionInfo.activity')}>
                    <Item
                        title={t('sessionInfo.thinking')}
                        detail={session.thinking ? t('common.yes') : t('common.no')}
                        icon={<AppIcon name="bulb-outline" size={29} color={session.thinking ? iconColor.warning : iconColor.secondary} />}
                        showChevron={false}
                    />
                    {session.thinking && (
                        <Item
                            title={t('sessionInfo.thinkingSince')}
                            subtitle={formatDate(session.thinkingAt)}
                            icon={<AppIcon name="timer-outline" size={29} color={iconColor.warning} />}
                            showChevron={false}
                        />
                    )}
                </ItemGroup>

                {/* Raw JSON (Dev Mode Only) */}
                {devModeEnabled && (
                    <ItemGroup title="Raw JSON (Dev Mode)">
                        {session.agentState && (
                            <>
                                <Item
                                    title="Agent State"
                                    icon={<AppIcon name="code-working-outline" size={29} color={iconColor.warning} />}
                                    showChevron={false}
                                />
                                <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
                                    <CodeView 
                                        code={JSON.stringify(session.agentState, null, 2)}
                                        language="json"
                                    />
                                </View>
                            </>
                        )}
                        {session.metadata && (
                            <>
                                <Item
                                    title="Metadata"
                                    icon={<AppIcon name="information-circle-outline" size={29} color={iconColor.secondary} />}
                                    showChevron={false}
                                />
                                <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
                                    <CodeView 
                                        code={JSON.stringify(session.metadata, null, 2)}
                                        language="json"
                                    />
                                </View>
                            </>
                        )}
                        {sessionStatus && (
                            <>
                                <Item
                                    title="Session Status"
                                    icon={<AppIcon name="analytics-outline" size={29} color={iconColor.accent} />}
                                    showChevron={false}
                                />
                                <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
                                    <CodeView 
                                        code={JSON.stringify({
                                            isConnected: sessionStatus.isConnected,
                                            statusText: sessionStatus.statusText,
                                            statusColor: sessionStatus.statusColor,
                                            statusDotColor: sessionStatus.statusDotColor,
                                            isPulsing: sessionStatus.isPulsing
                                        }, null, 2)}
                                        language="json"
                                    />
                                </View>
                            </>
                        )}
                        {/* Full Session Object */}
                        <Item
                            title="Full Session Object"
                            icon={<AppIcon name="document-text-outline" size={29} color={iconColor.success} />}
                            showChevron={false}
                        />
                        <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
                            <CodeView 
                                code={JSON.stringify(session, null, 2)}
                                language="json"
                            />
                        </View>
                    </ItemGroup>
                )}
            </ItemList>
        </>
    );
}

export default React.memo(() => {
    const { theme } = useUnistyles();
    const { id } = useLocalSearchParams<{ id: string }>();
    const session = useSession(id);
    const isDataReady = useIsDataReady();

    // Handle three states: loading, deleted, and exists
    if (!isDataReady) {
        // Still loading data
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <AppIcon name="hourglass-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={{ color: theme.colors.textSecondary, fontSize: 17, marginTop: 16, ...Typography.default('semiBold') }}>{t('common.loading')}</Text>
            </View>
        );
    }

    if (!session) {
        // Session has been deleted or doesn't exist
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <AppIcon name="trash-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={{ color: theme.colors.text, fontSize: 20, marginTop: 16, ...Typography.default('semiBold') }}>{t('errors.sessionDeleted')}</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 15, marginTop: 8, textAlign: 'center', paddingHorizontal: 32, ...Typography.default() }}>{t('errors.sessionDeletedDescription')}</Text>
            </View>
        );
    }

    return <SessionInfoContent session={session} />;
});

function CopyableItem({ title, subtitle, icon, copyText }: { title: string; subtitle: string; icon: React.ReactNode; copyText: string }) {
    const { theme } = useUnistyles();
    const iconColor = theme.colors.icon ?? {
        primary: theme.colors.text,
        secondary: theme.colors.textSecondary,
        accent: theme.colors.textLink,
        success: theme.colors.status.connected,
        warning: theme.colors.warning,
        danger: theme.colors.textDestructive,
    };
    const [copied, setCopied] = React.useState(false);
    return (
        <Item
            title={title}
            subtitle={subtitle}
            icon={icon}
            showChevron={false}
            rightElement={<AppIcon name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? iconColor.success : iconColor.secondary} />}
            onPress={async () => {
                await Clipboard.setStringAsync(copyText);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }}
        />
    );
}
