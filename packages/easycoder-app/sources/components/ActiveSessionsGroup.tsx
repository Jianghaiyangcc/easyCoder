import React from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Text } from '@/components/StyledText';
import { Machine } from '@/sync/storageTypes';
import { SessionRowData } from '@/sync/storage';
import { AppIcon } from '@/components/AppIcon';
import { type SessionState, formatPathRelativeToHome, getSessionStateText } from '@/utils/sessionUtils';
import { Avatar } from './Avatar';
import { Typography } from '@/constants/Typography';
import { StatusDot } from './StatusDot';
import { useAllMachines } from '@/sync/storage';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { sessionKill } from '@/sync/ops';
import { ProjectGitStatus } from './ProjectGitStatus';
import { t } from '@/text';
import { useNavigateToSession } from '@/hooks/useNavigateToSession';
import { useHappyAction } from '@/hooks/useHappyAction';
import { EasycoderError } from '@/utils/errors';
import { SessionActionsAnchor, SessionActionsPopover } from './SessionActionsPopover';
import { useSessionActionAlert } from '@/hooks/useSessionQuickActions';

function getStatusConfig(theme: any): Record<SessionState, { color: string; dotColor: string; isPulsing: boolean; isConnected: boolean }> {
    return {
        disconnected: { color: theme.colors.textSecondary, dotColor: theme.colors.textSecondary, isPulsing: false, isConnected: false },
        thinking: { color: theme.colors.textLink, dotColor: theme.colors.textLink, isPulsing: true, isConnected: true },
        waiting: { color: theme.colors.status.connected, dotColor: theme.colors.status.connected, isPulsing: false, isConnected: true },
        permission_required: { color: theme.colors.warning, dotColor: theme.colors.warning, isPulsing: true, isConnected: true },
    };
}

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        backgroundColor: theme.colors.groupped.background,
        paddingTop: 6,
        paddingBottom: 12,
    },
    projectCard: {
        backgroundColor: theme.colors.surface,
        marginBottom: 8,
        marginHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.dark ? 'rgba(255,255,255,0.10)' : 'rgba(12,16,25,0.08)',
        overflow: 'hidden',
        shadowColor: theme.colors.shadow.color,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: theme.dark ? 0.22 : 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    sectionHeader: {
        paddingTop: 16,
        paddingBottom: 8,
        paddingHorizontal: 28,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    sectionHeaderPath: {
        ...Typography.default('semiBold'),
        color: theme.colors.groupped.sectionTitle,
        fontSize: 13,
        lineHeight: 18,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    sectionHeaderMachine: {
        ...Typography.default('regular'),
        color: theme.colors.textSecondary,
        fontSize: 11,
        lineHeight: 16,
        maxWidth: 150,
        textAlign: 'right',
    },
    sessionRow: {
        minHeight: 74,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: theme.colors.surface,
    },
    sessionRowWithBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.divider,
    },
    sessionRowSelected: {
        backgroundColor: theme.colors.surfaceSelected,
    },
    sessionContent: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    sessionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    sessionTitle: {
        fontSize: 15,
        fontWeight: '500',
        ...Typography.default('semiBold'),
    },
    sessionTitleConnected: {
        color: theme.colors.text,
    },
    sessionTitleDisconnected: {
        color: theme.colors.textSecondary,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    statusDotContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 16,
        marginTop: 2,
        marginRight: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 16,
        ...Typography.default(),
    },
    avatarContainer: {
        position: 'relative',
        width: 48,
        height: 48,
    },
    newSessionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.divider,
        backgroundColor: theme.colors.surface,
    },
    newSessionButtonDisabled: {
        opacity: 0.5,
    },
    newSessionButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    newSessionButtonIcon: {
        marginRight: 6,
        width: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    newSessionButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text,
        ...Typography.default('semiBold'),
    },
    newSessionButtonTextDisabled: {
        color: theme.colors.textSecondary,
    },
    taskStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceHighest,
        paddingHorizontal: 4,
        height: 16,
        borderRadius: 4,
    },
    taskStatusText: {
        fontSize: 10,
        fontWeight: '500',
        color: theme.colors.textSecondary,
        ...Typography.default(),
    },
    swipeAction: {
        width: 112,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.status.error,
    },
    swipeActionText: {
        marginTop: 4,
        fontSize: 12,
        color: '#FFFFFF',
        textAlign: 'center',
        ...Typography.default('semiBold'),
    },
}));

interface ActiveSessionsGroupProps {
    sessions: SessionRowData[];
    selectedSessionId?: string;
}


export function ActiveSessionsGroup({ sessions, selectedSessionId }: ActiveSessionsGroupProps) {
    const styles = stylesheet;
    const machines = useAllMachines();
    const machinesMap = React.useMemo(() => {
        const map: Record<string, Machine> = {};
        machines.forEach(machine => {
            map[machine.id] = machine;
        });
        return map;
    }, [machines]);

    // Group sessions by project, then associate with machine
    const projectGroups = React.useMemo(() => {
        const groups = new Map<string, {
            path: string;
            displayPath: string;
            machines: Map<string, {
                machine: Machine | null;
                machineName: string;
                sessions: SessionRowData[];
            }>;
        }>();

        sessions.forEach(session => {
            const projectPath = session.path || '';
            const machineId = session.machineId || 'unknown';

            // Get machine info
            const machine = machineId !== 'unknown' ? machinesMap[machineId] : null;
            const machineName = machine?.metadata?.displayName ||
                machine?.metadata?.host ||
                (machineId !== 'unknown' ? machineId : '<unknown>');

            // Get or create project group
            let projectGroup = groups.get(projectPath);
            if (!projectGroup) {
                const displayPath = formatPathRelativeToHome(projectPath, session.homeDir ?? undefined);
                projectGroup = {
                    path: projectPath,
                    displayPath,
                    machines: new Map()
                };
                groups.set(projectPath, projectGroup);
            }

            // Get or create machine group within project
            let machineGroup = projectGroup.machines.get(machineId);
            if (!machineGroup) {
                machineGroup = {
                    machine,
                    machineName,
                    sessions: []
                };
                projectGroup.machines.set(machineId, machineGroup);
            }

            // Add session to machine group
            machineGroup.sessions.push(session);
        });

        // Sort sessions within each machine group by creation time (newest first)
        groups.forEach(projectGroup => {
            projectGroup.machines.forEach(machineGroup => {
                machineGroup.sessions.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
            });
        });

        return groups;
    }, [sessions, machinesMap]);

    // Sort project groups by display path
    const sortedProjectGroups = React.useMemo(() => {
        return Array.from(projectGroups.entries()).sort(([, groupA], [, groupB]) => {
            return groupA.displayPath.localeCompare(groupB.displayPath);
        });
    }, [projectGroups]);

    return (
        <View style={styles.container}>
            {sortedProjectGroups.map(([projectPath, projectGroup]) => {
                // Get the first machine name from this project's machines
                const firstMachine = Array.from(projectGroup.machines.values())[0];
                const machineName = projectGroup.machines.size === 1
                    ? firstMachine?.machineName
                    : `${projectGroup.machines.size} machines`;

                return (
                    <View key={projectPath}>
                        {/* Section header on grouped background */}
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionHeaderLeft}>
                                <Text style={styles.sectionHeaderPath}>
                                    {projectGroup.displayPath}
                                </Text>
                            </View>
                            {/* Show git status instead of machine name */}
                            {(() => {
                                // Get the first session from any machine in this project
                                const firstSession = Array.from(projectGroup.machines.values())[0]?.sessions[0];
                                return firstSession ? (
                                    <ProjectGitStatus sessionId={firstSession.id} />
                                ) : (
                                    <Text style={styles.sectionHeaderMachine} numberOfLines={1}>
                                        {machineName}
                                    </Text>
                                );
                            })()}
                        </View>

                        {/* Card with just the sessions */}
                        <View style={styles.projectCard}>
                            {/* Sessions grouped by machine within the card */}
                            {Array.from(projectGroup.machines.entries())
                                .sort(([, machineA], [, machineB]) => machineA.machineName.localeCompare(machineB.machineName))
                                .map(([machineId, machineGroup]) => (
                                    <View key={`${projectPath}-${machineId}`}>
                                        {machineGroup.sessions.map((session, index) => (
                                            <CompactSessionRow
                                                key={session.id}
                                                session={session}
                                                selected={selectedSessionId === session.id}
                                                showBorder={index < machineGroup.sessions.length - 1 ||
                                                    Array.from(projectGroup.machines.keys()).indexOf(machineId) < projectGroup.machines.size - 1}
                                            />
                                        ))}
                                    </View>
                                ))}
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

// Compact session row component with status line
const CompactSessionRow = React.memo(({ session, selected, showBorder }: { session: SessionRowData; selected?: boolean; showBorder?: boolean }) => {
    const styles = stylesheet;
    const { theme } = useUnistyles();
    const statusConfig = React.useMemo(() => getStatusConfig(theme), [theme]);
    const status = statusConfig[session.state];
    const navigateToSession = useNavigateToSession();
    const swipeableRef = React.useRef<Swipeable | null>(null);
    const swipeEnabled = Platform.OS !== 'web';
    const [actionsAnchor, setActionsAnchor] = React.useState<SessionActionsAnchor | null>(null);

    const statusText = getSessionStateText(session.state, session.activeAt);

    const [archivingSession, performArchive] = useHappyAction(async () => {
        const result = await sessionKill(session.id);
        if (!result.success) {
            throw new EasycoderError(result.message || t('sessionInfo.failedToArchiveSession'), false);
        }
    });

    const handleArchive = React.useCallback(() => {
        swipeableRef.current?.close();
        performArchive();
    }, [performArchive]);

    const handlePress = React.useCallback(() => {
        navigateToSession(session.id);
    }, [navigateToSession, session.id]);

    const handleContextMenu = React.useCallback((event: any) => {
        event.preventDefault?.();
        event.stopPropagation?.();
        setActionsAnchor({
            type: 'point',
            x: event.nativeEvent.clientX ?? event.nativeEvent.pageX ?? 0,
            y: event.nativeEvent.clientY ?? event.nativeEvent.pageY ?? 0,
        });
    }, []);

    const showActionAlert = useSessionActionAlert(session.id);
    const menuProps = Platform.OS === 'web' ? {
        onContextMenu: handleContextMenu,
    } as any : {
        onLongPress: showActionAlert,
    };

    const itemContent = (
        <Pressable
            style={[
                styles.sessionRow,
                showBorder && styles.sessionRowWithBorder,
                selected && styles.sessionRowSelected
            ]}
            onPress={handlePress}
            {...menuProps}
        >
            <View style={styles.avatarContainer}>
                <Avatar id={session.avatarId} size={48} monochrome={!status.isConnected} flavor={session.flavor} />
            </View>
            <View style={styles.sessionContent}>
                <View style={styles.sessionTitleRow}>
                    <Text
                        style={[
                            styles.sessionTitle,
                            status.isConnected ? styles.sessionTitleConnected : styles.sessionTitleDisconnected
                        ]}
                        numberOfLines={2}
                    >
                        {session.name}
                    </Text>
                </View>

                <View style={styles.statusRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.statusDotContainer}>
                            <StatusDot color={status.dotColor} isPulsing={status.isPulsing} />
                        </View>
                        <Text style={[
                            styles.statusText,
                            { color: status.color }
                        ]}>
                            {statusText}
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, transform: [{ translateY: 1 }] }}>
                        {session.hasDraft && (
                            <View style={styles.taskStatusContainer}>
                                <AppIcon
                                    name="create-outline"
                                    size={10}
                                    color={styles.taskStatusText.color}
                                />
                            </View>
                        )}

                        {session.totalTodosCount > 0 && session.completedTodosCount < session.totalTodosCount && (
                            <View style={styles.taskStatusContainer}>
                                <AppIcon
                                    name="bulb-outline"
                                    size={10}
                                    color={styles.taskStatusText.color}
                                    style={{ marginRight: 2 }}
                                />
                                <Text style={styles.taskStatusText}>
                                    {session.completedTodosCount}/{session.totalTodosCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Pressable>
    );

    if (!swipeEnabled) {
        return (
            <>
                {itemContent}
                <SessionActionsPopover
                    anchor={actionsAnchor}
                    onClose={() => setActionsAnchor(null)}
                    sessionId={session.id}
                    visible={!!actionsAnchor}
                />
            </>
        );
    }

    const renderRightActions = () => (
        <Pressable
            style={styles.swipeAction}
            onPress={handleArchive}
            disabled={archivingSession}
        >
            <AppIcon name="archive-outline" size={20} color="#FFFFFF" />
            <Text style={styles.swipeActionText} numberOfLines={2}>
                {t('sessionInfo.archiveSession')}
            </Text>
        </Pressable>
    );

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            overshootRight={false}
            enabled={!archivingSession}
        >
            {itemContent}
        </Swipeable>
    );
});
