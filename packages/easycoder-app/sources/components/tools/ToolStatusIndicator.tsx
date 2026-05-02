import * as React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AppIcon } from '@/components/AppIcon';
import { ToolCall } from '@/sync/typesMessage';
import { useUnistyles } from 'react-native-unistyles';
interface ToolStatusIndicatorProps {
    tool: ToolCall;
}

export function ToolStatusIndicator({ tool }: ToolStatusIndicatorProps) {
    return (
        <View style={styles.container}>
            <StatusIndicator state={tool.state} />
        </View>
    );
}

function StatusIndicator({ state }: { state: ToolCall['state'] }) {
    const { theme } = useUnistyles();
    const iconColor = theme.colors.icon ?? {
        primary: theme.colors.text,
        secondary: theme.colors.textSecondary,
        accent: theme.colors.textLink,
        success: theme.colors.status.connected,
        warning: theme.colors.warning,
        danger: theme.colors.textDestructive,
    };
    switch (state) {
        case 'running':
            return <ActivityIndicator size="small" color={iconColor.accent} />;
        case 'completed':
            return <AppIcon name="checkmark-circle" size={22} color={iconColor.success} />;
        case 'error':
            return <AppIcon name="close-circle" size={22} color={iconColor.danger} />;
        default:
            return null;
    }
}

const styles = StyleSheet.create({
    container: {
        width: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
