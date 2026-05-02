import React from 'react';
import { View, Text, Platform, Pressable } from 'react-native';
import { Typography } from '@/constants/Typography';
import { RoundButton } from '@/components/RoundButton';
import { useConnectTerminal } from '@/hooks/useConnectTerminal';
import { Modal } from '@/modal';
import { t } from '@/text';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { AppIcon } from '@/components/AppIcon';

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    title: {
        marginBottom: 6,
        textAlign: 'center',
        fontSize: 24,
        color: theme.colors.text,
        ...Typography.default('semiBold'),
    },
    subtitle: {
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.textSecondary,
        marginHorizontal: 24,
        marginBottom: 16,
    },
    commandList: {
        width: 320,
        maxWidth: '100%',
        marginHorizontal: 24,
        marginBottom: 14,
        gap: 10,
    },
    commandStepRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    commandCard: {
        flex: 1,
        backgroundColor: theme.colors.surfaceHighest,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.divider,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 4,
    },
    commandLabel: {
        ...Typography.default('semiBold'),
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    commandLineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    commandText: {
        ...Typography.mono(),
        fontSize: 14,
        color: theme.colors.status.connected,
        flex: 1,
    },
    commandCopyButton: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepsContainer: {
        marginTop: 6,
        marginHorizontal: 24,
        marginBottom: 40,
        width: 250,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    stepRowLast: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.surfaceHigh,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    stepNumberText: {
        ...Typography.default('semiBold'),
        fontSize: 14,
        color: theme.colors.text,
    },
    stepText: {
        ...Typography.default(),
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    successHint: {
        ...Typography.default(),
        textAlign: 'center',
        fontSize: 13,
        lineHeight: 19,
        color: theme.colors.textSecondary,
        marginHorizontal: 24,
        marginBottom: 16,
    },
    buttonsContainer: {
        alignItems: 'center',
        width: '100%',
    },
    buttonWrapper: {
        width: 240,
        marginBottom: 12,
    },
    buttonWrapperSecondary: {
        width: 240,
    },
}));

export function EmptyMainScreen() {
    const { connectTerminal, connectWithUrl, isLoading } = useConnectTerminal();
    const { theme } = useUnistyles();
    const styles = stylesheet;
    const router = useRouter();
    const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

    const commandSteps = React.useMemo(() => ([
        {
            key: 'install',
            title: t('components.emptyMainScreen.installCli'),
            command: 'npm install -g easycoder-cli',
        },
        {
            key: 'login',
            title: t('components.emptyMainScreen.loginAccount'),
            command: 'easycoder auth login',
        },
        {
            key: 'daemon',
            title: t('components.emptyMainScreen.startDaemon'),
            command: 'easycoder daemon start',
        },
    ]), []);

    const handleCopy = React.useCallback(async (key: string, command: string) => {
        await Clipboard.setStringAsync(command);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1800);
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('components.emptyMainScreen.readyToCode')}</Text>
            <Text style={styles.subtitle}>{t('components.emptyMainScreen.subtitle')}</Text>

            <View style={styles.commandList}>
                {commandSteps.map((step, index) => (
                    <View key={step.key} style={styles.commandStepRow}>
                        <View style={[styles.stepNumber, { marginTop: 2 }]}>
                            <Text style={styles.stepNumberText}>{index + 1}</Text>
                        </View>
                        <View style={styles.commandCard}>
                            <Text style={styles.commandLabel}>{step.title}</Text>
                            <View style={styles.commandLineRow}>
                                <Text style={styles.commandText}>
                                    {step.command}
                                </Text>
                                <Pressable
                                    style={styles.commandCopyButton}
                                    hitSlop={8}
                                    onPress={() => handleCopy(step.key, step.command)}
                                >
                                    <AppIcon
                                        name={copiedKey === step.key ? 'checkmark' : 'copy-outline'}
                                        size={16}
                                        color={copiedKey === step.key ? theme.colors.status.connected : theme.colors.textSecondary}
                                    />
                                </Pressable>
                            </View>
                            {step.key === 'daemon' && (
                                <Text style={[styles.commandText, { fontSize: 12, color: theme.colors.textSecondary }]}>
                                    {t('components.emptyMainScreen.optionalStatusCommand')}
                                </Text>
                            )}
                        </View>
                    </View>
                ))}
            </View>

            <Text style={styles.successHint}>
                {t('components.emptyMainScreen.successHint')}
            </Text>

            {Platform.OS !== 'web' && (
                <>
                    <View style={styles.stepsContainer}>
                        <View style={styles.stepRow}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>1</Text>
                            </View>
                            <Text style={styles.stepText}>
                                {t('components.emptyMainScreen.installCli')}
                            </Text>
                        </View>
                        <View style={styles.stepRow}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <Text style={styles.stepText}>
                                {t('components.emptyMainScreen.runIt')}
                            </Text>
                        </View>
                        <View style={styles.stepRowLast}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>3</Text>
                            </View>
                            <Text style={styles.stepText}>
                                {t('components.emptyMainScreen.scanQrCode')}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.buttonsContainer}>
                        <View style={styles.buttonWrapper}>
                            <RoundButton
                                title={t('components.emptyMainScreen.openCamera')}
                                size="large"
                                loading={isLoading}
                                onPress={connectTerminal}
                            />
                        </View>
                        <View style={styles.buttonWrapperSecondary}>
                            <RoundButton
                                title={t('connect.enterUrlManually')}
                                size="normal"
                                display="inverted"
                                onPress={async () => {
                                    const url = await Modal.prompt(
                                        t('modals.authenticateTerminal'),
                                        t('modals.pasteUrlFromTerminal'),
                                        {
                                            placeholder: 'easycoder://terminal?...',
                                            cancelText: t('common.cancel'),
                                            confirmText: t('common.authenticate')
                                        }
                                    );

                                    if (url?.trim()) {
                                        connectWithUrl(url.trim());
                                    }
                                }}
                            />
                        </View>
                        <View style={[styles.buttonWrapperSecondary, { marginTop: 12 }]}>
                            <RoundButton
                                title={t('components.emptyMainScreen.viewSystemStatus')}
                                size="normal"
                                display="inverted"
                                onPress={() => router.push('/help')}
                            />
                        </View>
                    </View>
                </>
            )}
        </View>
    );
}
