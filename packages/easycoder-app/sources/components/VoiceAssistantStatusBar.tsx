import * as React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRealtimeStatus, useRealtimeMode, useSetting } from '@/sync/storage';
import { StatusDot } from './StatusDot';
import { Typography } from '@/constants/Typography';
import { AppIcon } from '@/components/AppIcon';
import { stopRealtimeSession } from '@/realtime/RealtimeSession';
import { useUnistyles } from 'react-native-unistyles';
import { VoiceBars } from './VoiceBars';
import { t } from '@/text';

interface VoiceAssistantStatusBarProps {
    variant?: 'full' | 'sidebar';
    style?: any;
    onStoppedWithTranscript?: (transcript: string) => void;
}

export const VoiceAssistantStatusBar = React.memo(({ variant = 'full', style, onStoppedWithTranscript }: VoiceAssistantStatusBarProps) => {
    const { theme } = useUnistyles();
    const voiceProvider = useSetting('voiceProvider');
    const realtimeStatus = useRealtimeStatus();
    const realtimeMode = useRealtimeMode();
    const isBailianMode = voiceProvider === 'bailian';

    // Don't render if disconnected
    if (realtimeStatus === 'disconnected') {
        return null;
    }
    
    // Check if voice assistant or user is speaking (show voice bars for either)
    const isVoiceSpeaking = realtimeMode === 'agent-speaking' || realtimeMode === 'user-speaking';

    const tapActionText = isBailianMode
        ? t('settingsVoice.statusBar.tapToStopRecording')
        : t('settingsVoice.statusBar.tapToEnd');

    const getStatusInfo = () => {
        switch (realtimeStatus) {
            case 'connecting':
                return {
                    color: theme.colors.status.connecting,
                    backgroundColor: theme.colors.surfaceHighest,
                    isPulsing: true,
                    text: isBailianMode
                        ? t('settingsVoice.statusBar.transcribingVoiceInput')
                        : t('settingsVoice.statusBar.connectingRealtime'),
                    textColor: theme.colors.text
                };
            case 'connected':
                return {
                    color: theme.colors.status.connected,
                    backgroundColor: theme.colors.surfaceHighest,
                    isPulsing: false,
                    text: isBailianMode
                        ? t('settingsVoice.statusBar.recordingVoiceInput')
                        : t('settingsVoice.statusBar.connectedRealtime'),
                    textColor: theme.colors.text
                };
            case 'error':
                return {
                    color: theme.colors.status.error,
                    backgroundColor: theme.colors.surfaceHighest,
                    isPulsing: false,
                    text: t('settingsVoice.statusBar.connectionError'),
                    textColor: theme.colors.text
                };
            default:
                return {
                    color: theme.colors.status.default,
                    backgroundColor: theme.colors.surfaceHighest,
                    isPulsing: false,
                    text: t('settingsVoice.statusBar.voiceAssistant'),
                    textColor: theme.colors.text
                };
        }
    };

    const statusInfo = getStatusInfo();

    const handlePress = async () => {
        if (realtimeStatus === 'connected' || realtimeStatus === 'connecting') {
            try {
                const transcript = await stopRealtimeSession();
                const normalizedTranscript = transcript?.trim();
                if (normalizedTranscript) {
                    onStoppedWithTranscript?.(normalizedTranscript);
                }
            } catch (error) {
                console.error('Error stopping voice session:', error);
            }
        }
    };

    if (variant === 'full') {
        // Mobile full-width version
        return (
            <View style={{
                backgroundColor: statusInfo.backgroundColor,
                height: 32,
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 16,
            }}>
                <Pressable
                    onPress={handlePress}
                    style={{
                        height: 32,
                        width: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    hitSlop={10}
                >
                    <View style={styles.content}>
                        <View style={styles.leftSection}>
                            <StatusDot
                                color={statusInfo.color}
                                isPulsing={statusInfo.isPulsing}
                                size={8}
                                style={styles.statusDot}
                            />
                            <AppIcon
                                name="mic"
                                size={16}
                                color={statusInfo.textColor}
                                style={styles.micIcon}
                            />
                            <Text style={[
                                styles.statusText,
                                { color: statusInfo.textColor }
                            ]}>
                                {statusInfo.text}
                            </Text>
                        </View>
                        
                        <View style={styles.rightSection}>
                            {isVoiceSpeaking && (
                                <VoiceBars 
                                    isActive={isVoiceSpeaking} 
                                    color={statusInfo.textColor}
                                    size="small"
                                />
                            )}
                            <Text style={[styles.tapToEndText, { color: statusInfo.textColor, marginLeft: isVoiceSpeaking ? 8 : 0 }]}>
                                {tapActionText}
                            </Text>
                        </View>
                    </View>
                </Pressable>
            </View>
        );
    }

    // Sidebar version
    const containerStyle = [
        styles.container,
        styles.sidebarContainer,
        {
            backgroundColor: statusInfo.backgroundColor,
        },
        style
    ];

    return (
        <View style={containerStyle}>
            <Pressable
                onPress={handlePress}
                style={styles.pressable}
                hitSlop={5}
            >
                <View style={styles.content}>
                    <View style={styles.leftSection}>
                        <StatusDot
                            color={statusInfo.color}
                            isPulsing={statusInfo.isPulsing}
                            size={8}
                            style={styles.statusDot}
                        />
                        <AppIcon
                            name="mic"
                            size={16}
                            color={statusInfo.textColor}
                            style={styles.micIcon}
                        />
                        <Text style={[
                            styles.statusText,
                            styles.sidebarStatusText,
                            { color: statusInfo.textColor }
                        ]}>
                            {statusInfo.text}
                        </Text>
                    </View>
                    
                    {isVoiceSpeaking && (
                        <VoiceBars 
                            isActive={isVoiceSpeaking} 
                            color={statusInfo.textColor}
                            size="small"
                        />
                    )}
                    
                    <AppIcon
                        name="close"
                        size={14}
                        color={statusInfo.textColor}
                        style={[styles.closeIcon, { marginLeft: isVoiceSpeaking ? 4 : 8 }]}
                    />
                </View>
            </Pressable>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        borderRadius: 0,
        marginHorizontal: 0,
        marginVertical: 0,
    },
    fullContainer: {
        justifyContent: 'flex-end',
    },
    sidebarContainer: {
    },
    pressable: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 12,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        marginRight: 6,
    },
    micIcon: {
        marginRight: 6,
    },
    closeIcon: {
        marginLeft: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        ...Typography.default(),
    },
    sidebarStatusText: {
        fontSize: 12,
    },
    tapToEndText: {
        fontSize: 12,
        fontWeight: '400',
        opacity: 0.8,
        ...Typography.default(),
    },
});
