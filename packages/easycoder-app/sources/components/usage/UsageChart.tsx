import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/StyledText';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { MonthlyUsagePoint } from '@/sync/apiUsage';
import { t } from '@/text';

export type UsageMetric = 'messageCount' | 'voiceMinutes' | 'voiceCount';

interface UsageChartProps {
    data: MonthlyUsagePoint[];
    metric: UsageMetric;
    height?: number;
    onBarPress?: (dataPoint: MonthlyUsagePoint, index: number) => void;
}

const styles = StyleSheet.create((theme) => ({
    container: {
        marginVertical: 16,
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        paddingHorizontal: 16,
        paddingBottom: 28,
    },
    barWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    bar: {
        width: '100%',
        borderRadius: 6,
        minHeight: 2,
    },
    barValue: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        marginBottom: 4,
        fontWeight: '600',
    },
    barLabel: {
        position: 'absolute',
        bottom: -24,
        fontSize: 10,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    emptyState: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
}));

function formatMonthLabel(month: string): string {
    const match = /^(\d{4})-(\d{2})$/.exec(month);
    if (!match) {
        return month;
    }
    return `${match[1].slice(2)}-${match[2]}`;
}

function formatValue(metric: UsageMetric, value: number): string {
    if (metric === 'voiceMinutes') {
        return `${value.toFixed(1)}m`;
    }
    return Math.max(0, Math.round(value)).toLocaleString();
}

function getValue(metric: UsageMetric, point: MonthlyUsagePoint): number {
    switch (metric) {
        case 'messageCount':
            return point.messageCount;
        case 'voiceMinutes':
            return point.voiceMinutes;
        case 'voiceCount':
            return point.voiceCount;
        default:
            return 0;
    }
}

export const UsageChart: React.FC<UsageChartProps> = ({
    data,
    metric,
    height = 180,
    onBarPress,
}) => {
    const { theme } = useUnistyles();

    if (!data || data.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{t('usage.noData')}</Text>
            </View>
        );
    }

    const maxValue = Math.max(
        ...data.map((point) => getValue(metric, point)),
        1,
    );

    return (
        <View style={styles.container}>
            <View style={[styles.chartContainer, { height }]}> 
                {data.map((point, index) => {
                    const value = getValue(metric, point);
                    const barHeight = (value / maxValue) * (height - 22);
                    const showValue = value > 0 && barHeight > 20;

                    return (
                        <Pressable
                            key={`${point.month}-${index}`}
                            style={styles.barWrapper}
                            onPress={() => onBarPress?.(point, index)}
                        >
                            {showValue && (
                                <Text style={styles.barValue}>{formatValue(metric, value)}</Text>
                            )}
                            <View
                                style={[
                                    styles.bar,
                                    {
                                        height: Math.max(barHeight, 2),
                                        backgroundColor: theme.colors.accent,
                                    },
                                ]}
                            />
                            <Text style={styles.barLabel}>{formatMonthLabel(point.month)}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};
