import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/components/StyledText';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { useAuth } from '@/auth/AuthContext';
import { getUsageSummary, type UsageSummaryResponse } from '@/sync/apiUsage';
import { useEntitlement } from '@/sync/storage';
import { UsageBar } from './UsageBar';
import { t } from '@/text';
import { sync } from '@/sync/sync';
import { Modal } from '@/modal';

const styles = StyleSheet.create((theme) => ({
    loadingContainer: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorContainer: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    errorText: {
        fontSize: 14,
        color: theme.colors.status.error,
        textAlign: 'center',
    },
    usageSection: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    usageDetailText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
}));

function formatCount(value: number): string {
    return Math.max(0, Math.round(value)).toLocaleString();
}

function formatMinutes(value: number): string {
    const normalized = Number.isFinite(value) ? Math.max(0, value) : 0;
    return `${normalized.toFixed(1)}m`;
}

export const UsagePanel: React.FC = () => {
    const { theme } = useUnistyles();
    const auth = useAuth();
    const hasPro = useEntitlement('pro');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [summary, setSummary] = React.useState<UsageSummaryResponse | null>(null);

    React.useEffect(() => {
        const run = async () => {
            if (!auth.credentials) {
                setError(t('usage.notAuthenticated'));
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const nextSummary = await getUsageSummary(auth.credentials, 30);
                setSummary(nextSummary);
            } catch (nextError) {
                console.error('Failed to load usage summary:', nextError);
                setError(t('usage.loadFailed'));
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [auth.credentials]);

    const handleUpgrade = React.useCallback(async () => {
        const result = await sync.presentPaywall('usage_limit_reached');
        if (!result.success) {
            Modal.alert(
                t('common.error'),
                `${t('errors.operationFailed')}${result.error ? `: ${result.error}` : ''}`,
            );
        }
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.colors.status.error} />
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (!summary) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{t('usage.noData')}</Text>
            </View>
        );
    }

    const usageItems = [
        {
            key: 'voiceAsrCount' as const,
            label: t('usage.voiceAsrCount'),
            value: Math.max(0, summary.voiceAsrCount),
            limit: Math.max(1, summary.voiceAsrCountLimit),
            formattedValue: formatCount(summary.voiceAsrCount),
            formattedLimit: formatCount(summary.voiceAsrCountLimit),
        },
        {
            key: 'voiceMinutes' as const,
            label: t('usage.voiceMinutes'),
            value: Math.max(0, summary.voiceMinutes),
            limit: Math.max(0.1, summary.voiceMinutesLimit),
            formattedValue: formatMinutes(summary.voiceMinutes),
            formattedLimit: formatMinutes(summary.voiceMinutesLimit),
        },
        {
            key: 'globalMessageCount' as const,
            label: t('usage.globalMessageCount'),
            value: Math.max(0, summary.globalMessageCount),
            limit: Math.max(1, summary.globalMessageCountLimit),
            formattedValue: formatCount(summary.globalMessageCount),
            formattedLimit: formatCount(summary.globalMessageCountLimit),
        },
    ];

    const reachedFreeLimits = hasPro
        ? []
        : usageItems.filter((item) => item.value >= item.limit);

    return (
        <ItemGroup
            title={t('usage.summaryTitle')}
            footer={hasPro
                ? t('usage.proLimitsFooter', { days: summary.windowDays })
                : t('usage.freeLimitsFooter', { days: summary.windowDays })}
        >
            <View style={styles.usageSection}>
                {usageItems.map((item) => {
                    const isLimitReached = !hasPro && item.value >= item.limit;
                    const maxValue = hasPro ? Math.max(item.value, 1) : item.limit;
                    return (
                        <View key={item.key}>
                            <UsageBar
                                label={item.label}
                                value={item.value}
                                maxValue={maxValue}
                                color={isLimitReached ? '#FF3B30' : '#007AFF'}
                            />
                            <Text style={styles.usageDetailText}>
                                {hasPro
                                    ? `${item.formattedValue} / ${t('usage.unlimited')}`
                                    : `${item.formattedValue} / ${item.formattedLimit}`}
                            </Text>
                        </View>
                    );
                })}
            </View>

            {reachedFreeLimits.map((item) => (
                <Item
                    key={`${item.key}-limit`}
                    title={t('usage.limitReachedTitle')}
                    subtitle={t('usage.limitReachedSubtitle', { metric: item.label })}
                    icon={<Ionicons name="alert-circle-outline" size={29} color={theme.colors.status.error} />}
                    showChevron={false}
                />
            ))}

            {!hasPro && reachedFreeLimits.length > 0 && (
                <Item
                    title={t('subscription.upgradeToPro')}
                    subtitle={t('settingsVoice.supportSubtitle')}
                    icon={<Ionicons name="pricetag-outline" size={29} color="#FF9500" />}
                    onPress={handleUpgrade}
                />
            )}
        </ItemGroup>
    );
};
