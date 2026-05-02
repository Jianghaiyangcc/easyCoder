import React from 'react';
import { View, ActivityIndicator, Pressable } from 'react-native';
import { AppIcon } from '@/components/AppIcon';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/components/StyledText';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { useAuth } from '@/auth/AuthContext';
import { getUsageSummary, type UsageSummaryResponse } from '@/sync/apiUsage';
import { useEntitlement } from '@/sync/storage';
import { UsageBar } from './UsageBar';
import { UsageChart, type UsageMetric } from './UsageChart';
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
    chartSection: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    metricSwitchRow: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 8,
        paddingTop: 8,
    },
    metricSwitchButton: {
        flex: 1,
        borderRadius: 10,
        borderWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricSwitchButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
}));

function formatCount(value: number): string {
    return Math.max(0, Math.round(value)).toLocaleString();
}

function formatMinutes(value: number): string {
    const normalized = Number.isFinite(value) ? Math.max(0, value) : 0;
    return `${normalized.toFixed(1)}m`;
}

type UsageItem = {
    key: UsageMetric;
    label: string;
    value: number;
    limit: number;
    formattedValue: string;
    formattedLimit: string;
};

export const UsagePanel: React.FC = () => {
    const { theme } = useUnistyles();
    const auth = useAuth();
    const hasPro = useEntitlement('pro');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [summary, setSummary] = React.useState<UsageSummaryResponse | null>(null);
    const [selectedMetric, setSelectedMetric] = React.useState<UsageMetric>('messageCount');

    React.useEffect(() => {
        const run = async () => {
            if (!auth.credentials) {
                setError(t('usage.notAuthenticated'));
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const nextSummary = await getUsageSummary(auth.credentials);
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
                <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <AppIcon name="alert-circle-outline" size={48} color={theme.colors.status.error} />
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

    const usageItems: UsageItem[] = [
        {
            key: 'messageCount',
            label: t('usage.messageCount'),
            value: Math.max(0, summary.currentMonth.messageCount),
            limit: Math.max(1, summary.currentMonth.messageCountLimit),
            formattedValue: formatCount(summary.currentMonth.messageCount),
            formattedLimit: formatCount(summary.currentMonth.messageCountLimit),
        },
        {
            key: 'voiceMinutes',
            label: t('usage.voiceMinutes'),
            value: Math.max(0, summary.currentMonth.voiceMinutes),
            limit: Math.max(0.1, summary.currentMonth.voiceMinutesLimit),
            formattedValue: formatMinutes(summary.currentMonth.voiceMinutes),
            formattedLimit: formatMinutes(summary.currentMonth.voiceMinutesLimit),
        },
        {
            key: 'voiceCount',
            label: t('usage.voiceCount'),
            value: Math.max(0, summary.currentMonth.voiceCount),
            limit: Math.max(1, summary.currentMonth.voiceCountLimit),
            formattedValue: formatCount(summary.currentMonth.voiceCount),
            formattedLimit: formatCount(summary.currentMonth.voiceCountLimit),
        },
    ];

    const reachedFreeLimits = hasPro
        ? []
        : usageItems.filter((item) => item.value >= item.limit);

    const metricSwitchItems: Array<{ metric: UsageMetric; label: string }> = [
        { metric: 'messageCount', label: t('usage.messageCount') },
        { metric: 'voiceMinutes', label: t('usage.voiceMinutes') },
        { metric: 'voiceCount', label: t('usage.voiceCount') },
    ];

    return (
        <>
            <ItemGroup
                title={t('usage.summaryTitle')}
                footer={hasPro
                    ? t('usage.proLimitsFooterMonthly', { month: summary.currentMonth.month })
                    : t('usage.freeLimitsFooterMonthly', { month: summary.currentMonth.month })}
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
                                    color={isLimitReached ? '#FF3B30' : theme.colors.accent}
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
                        icon={<AppIcon name="alert-circle-outline" size={29} color={theme.colors.status.error} />}
                        showChevron={false}
                    />
                ))}

                {!hasPro && reachedFreeLimits.length > 0 && (
                    <Item
                        title={t('subscription.upgradeToPro')}
                        subtitle={t('settingsVoice.supportSubtitle')}
                        icon={<AppIcon name="pricetag-outline" size={29} color={theme.colors.icon?.warning ?? theme.colors.warning} />}
                        onPress={handleUpgrade}
                    />
                )}
            </ItemGroup>

            <ItemGroup
                title={t('usage.usageOverTime')}
                footer={t('usage.last6MonthsFooter')}
            >
                <View style={styles.chartSection}>
                    <View style={styles.metricSwitchRow}>
                        {metricSwitchItems.map((item) => {
                            const active = selectedMetric === item.metric;
                            return (
                                <Pressable
                                    key={item.metric}
                                    onPress={() => setSelectedMetric(item.metric)}
                                    style={[
                                        styles.metricSwitchButton,
                                        {
                                            borderColor: active ? theme.colors.accent : theme.colors.divider,
                                            backgroundColor: active
                                                ? `${theme.colors.accent}1A`
                                                : theme.colors.surface,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.metricSwitchButtonText,
                                            {
                                                color: active ? theme.colors.accent : theme.colors.textSecondary,
                                            },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {item.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <UsageChart
                        data={summary.last6FullMonths}
                        metric={selectedMetric}
                    />
                </View>
            </ItemGroup>
        </>
    );
};
