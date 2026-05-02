import * as React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from '@/components/Avatar';
import { SessionActionsNativeMenu } from '@/components/SessionActionsNativeMenu';
import { SessionActionsAnchor } from '@/components/SessionActionsPopover';
import { Typography } from '@/constants/Typography';
import { Session } from '@/sync/storageTypes';
import { useHeaderHeight } from '@/utils/responsive';
import { layout } from '@/components/layout';
import { useUnistyles } from 'react-native-unistyles';
import { StatusDot } from '@/components/StatusDot';

interface ChatHeaderViewProps {
    title: string;
    subtitle?: string;
    onBackPress?: () => void;
    onAvatarPress?: () => void;
    avatarId?: string;
    backgroundColor?: string;
    tintColor?: string;
    isConnected?: boolean;
    flavor?: string | null;
    onAvatarMenuRequest?: (anchor: SessionActionsAnchor) => void;
    avatarMenuExpanded?: boolean;
    avatarMenuSession?: Session | null;
    onAfterAvatarArchive?: () => void;
    onAfterAvatarDelete?: () => void;
}

export const ChatHeaderView: React.FC<ChatHeaderViewProps> = ({
    title,
    subtitle,
    onBackPress,
    onAvatarPress,
    avatarId,
    isConnected = true,
    flavor,
    onAvatarMenuRequest,
    avatarMenuExpanded = false,
    avatarMenuSession,
    onAfterAvatarArchive,
    onAfterAvatarDelete,
}) => {
    const { theme } = useUnistyles();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight();
    const avatarAnchorRef = React.useRef<View | null>(null);
    const suppressAvatarPressUntilRef = React.useRef(0);

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            navigation.goBack();
        }
    };

    const requestAvatarMenuFromTrigger = React.useCallback(() => {
        if (!onAvatarMenuRequest || !avatarAnchorRef.current) {
            return;
        }

        suppressAvatarPressUntilRef.current = Date.now() + 750;
        avatarAnchorRef.current.measureInWindow((x, y, width, height) => {
            onAvatarMenuRequest({
                type: 'rect',
                x,
                y,
                width,
                height,
            });
        });
    }, [onAvatarMenuRequest]);

    const handleAvatarPress = React.useCallback(() => {
        if (Date.now() < suppressAvatarPressUntilRef.current) {
            return;
        }
        onAvatarPress?.();
    }, [onAvatarPress]);

    const handleAvatarContextMenu = React.useCallback((event: any) => {
        if (!onAvatarMenuRequest) {
            return;
        }

        event.preventDefault?.();
        event.stopPropagation?.();
        suppressAvatarPressUntilRef.current = Date.now() + 750;
        onAvatarMenuRequest({
            type: 'point',
            x: event.nativeEvent.clientX ?? event.nativeEvent.pageX ?? 0,
            y: event.nativeEvent.clientY ?? event.nativeEvent.pageY ?? 0,
        });
    }, [onAvatarMenuRequest]);

    const handleAvatarKeyDown = React.useCallback((event: any) => {
        const key = event.nativeEvent?.key;
        const shiftKey = !!event.nativeEvent?.shiftKey;
        if (key === 'ContextMenu' || (shiftKey && key === 'F10')) {
            event.preventDefault?.();
            requestAvatarMenuFromTrigger();
        }
    }, [requestAvatarMenuFromTrigger]);

    const webAvatarMenuProps = Platform.OS === 'web' && onAvatarMenuRequest ? {
        'aria-expanded': avatarMenuExpanded,
        'aria-haspopup': 'menu',
        onContextMenu: handleAvatarContextMenu,
        onKeyDown: handleAvatarKeyDown,
    } as any : {};

    return (
        <View style={[styles.container, {
            paddingTop: insets.top,
            backgroundColor: theme.colors.header.background,
            borderBottomColor: theme.dark ? 'rgba(255,255,255,0.10)' : 'rgba(17,24,39,0.08)',
        }]}>
            <View style={styles.contentWrapper}>
                <View style={[styles.content, { height: headerHeight }]}>
                    <Pressable onPress={handleBackPress} style={styles.backButton} hitSlop={15}>
                        <View style={[
                            styles.headerActionSurface,
                            {
                                borderColor: theme.dark ? 'rgba(255,255,255,0.14)' : 'rgba(17,24,39,0.10)',
                                backgroundColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.82)',
                            }
                        ]}>
                            <AppIcon
                                name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
                                size={Platform.select({ ios: 24, default: 21 })}
                                color={theme.colors.header.tint}
                            />
                        </View>
                    </Pressable>

                    <View style={styles.titleContainer}>
                        <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={[
                                styles.title,
                                {
                                    color: theme.colors.header.tint,
                                    ...Typography.default('semiBold')
                                }
                            ]}
                        >
                            {title}
                        </Text>
                        {subtitle && (
                            <View style={styles.subtitleRow}>
                                <StatusDot
                                    color={isConnected ? theme.colors.status.connected : theme.colors.status.disconnected}
                                    isPulsing={false}
                                    size={5}
                                    style={{ marginRight: 5 }}
                                />
                                <Text
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    style={[
                                        styles.subtitle,
                                        {
                                            color: theme.colors.header.tint,
                                            opacity: 0.72,
                                            ...Typography.default()
                                        }
                                    ]}
                                >
                                    {subtitle}
                                </Text>
                            </View>
                        )}
                    </View>

                    {avatarId && onAvatarPress && (
                        <View collapsable={false} ref={avatarAnchorRef} style={styles.avatarButtonSlot}>
                            {avatarMenuSession ? (
                                <SessionActionsNativeMenu
                                    onAfterArchive={onAfterAvatarArchive}
                                    onAfterDelete={onAfterAvatarDelete}
                                    session={avatarMenuSession}
                                >
                                    <Pressable
                                        hitSlop={15}
                                        onPress={handleAvatarPress}
                                        style={styles.avatarButton}
                                        {...webAvatarMenuProps}
                                    >
                                        <Avatar
                                            id={avatarId}
                                            size={32}
                                            monochrome={!isConnected}
                                            flavor={flavor}
                                        />
                                    </Pressable>
                                </SessionActionsNativeMenu>
                            ) : (
                                <Pressable
                                    hitSlop={15}
                                    onPress={handleAvatarPress}
                                    style={styles.avatarButton}
                                    {...webAvatarMenuProps}
                                >
                                    <Avatar
                                        id={avatarId}
                                        size={32}
                                        monochrome={!isConnected}
                                        flavor={flavor}
                                    />
                                </Pressable>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 100,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    contentWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Platform.OS === 'ios' ? 10 : 16,
        width: '100%',
        maxWidth: layout.headerMaxWidth,
    },
    backButton: {
        marginRight: 10,
    },
    headerActionSurface: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: Platform.select({
            ios: 16,
            android: 15,
            default: 16
        }),
        fontWeight: '600',
        marginBottom: 2,
        lineHeight: 20,
        width: '100%',
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        minWidth: 0,
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 16,
    },
    avatarButtonSlot: {
        marginRight: Platform.select({ ios: -6, default: -6 }),
        overflow: 'visible',
    },
    avatarButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
