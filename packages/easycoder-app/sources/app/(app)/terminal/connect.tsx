import React, { useState, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { Text } from '@/components/StyledText';
import { useRouter } from 'expo-router';
import { Typography } from '@/constants/Typography';
import { RoundButton } from '@/components/RoundButton';
import { useConnectTerminal } from '@/hooks/useConnectTerminal';
import { useAuth } from '@/auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { ItemList } from '@/components/ItemList';
import { ItemGroup } from '@/components/ItemGroup';
import { Item } from '@/components/Item';
import { t } from '@/text';

export default function TerminalConnectScreen() {
    const router = useRouter();
    const auth = useAuth();
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [hashProcessed, setHashProcessed] = useState(false);
    const { processAuthUrl, isLoading } = useConnectTerminal({
        onSuccess: () => {
            router.back();
        }
    });

    // Extract key from query/hash on web platform
    useEffect(() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && !hashProcessed) {
            const params = new URLSearchParams(window.location.search);
            const keyFromQuery = params.get('key');
            const hash = window.location.hash;
            const keyFromHash = hash.startsWith('#key=') ? hash.substring(5) : null;
            const key = keyFromQuery || keyFromHash;

            if (key) {
                setPublicKey(key);

                // Clear key from URL to prevent exposure in browser history
                params.delete('key');
                const nextQuery = params.toString();
                const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;
                window.history.replaceState(null, '', nextUrl);
                setHashProcessed(true);
            } else {
                setHashProcessed(true);
            }
        }
    }, [hashProcessed]);

    const handleConnect = async () => {
        if (publicKey) {
            // Convert the hash key format to the expected easycoder:// URL format
            const authUrl = `easycoder://terminal?${publicKey}`;
            await processAuthUrl(authUrl);
        }
    };

    const handleReject = () => {
        router.back();
    };

    // Show placeholder for mobile platforms
    if (Platform.OS !== 'web') {
        return (
            <ItemList>
                <ItemGroup>
                    <View style={{ 
                        alignItems: 'center',
                        paddingVertical: 32,
                        paddingHorizontal: 16
                    }}>
                        <Ionicons 
                            name="laptop-outline" 
                            size={64} 
                            color="#8E8E93" 
                            style={{ marginBottom: 16 }} 
                        />
                        <Text style={{ 
                            ...Typography.default('semiBold'), 
                            fontSize: 18, 
                            textAlign: 'center',
                            marginBottom: 12 
                        }}>
                            {t('terminal.webBrowserRequired')}
                        </Text>
                        <Text style={{ 
                            ...Typography.default(), 
                            fontSize: 14, 
                            color: '#666', 
                            textAlign: 'center',
                            lineHeight: 20 
                        }}>
                            {t('terminal.webBrowserRequiredDescription')}
                        </Text>
                    </View>
                </ItemGroup>
            </ItemList>
        );
    }

    // Show loading state while processing hash
    if (!hashProcessed) {
        return (
            <ItemList>
                <ItemGroup>
                    <View style={{ 
                        alignItems: 'center',
                        paddingVertical: 32,
                        paddingHorizontal: 16
                    }}>
                        <Text style={{ ...Typography.default(), color: '#666' }}>
                            {t('terminal.processingConnection')}
                        </Text>
                    </View>
                </ItemGroup>
            </ItemList>
        );
    }

    // Show error if no key found
    if (!publicKey) {
        return (
            <ItemList>
                <ItemGroup>
                    <View style={{ 
                        alignItems: 'center',
                        paddingVertical: 32,
                        paddingHorizontal: 16
                    }}>
                        <Ionicons 
                            name="warning-outline" 
                            size={48} 
                            color="#FF3B30" 
                            style={{ marginBottom: 16 }} 
                        />
                        <Text style={{ 
                            ...Typography.default('semiBold'), 
                            fontSize: 16, 
                            color: '#FF3B30',
                            textAlign: 'center',
                            marginBottom: 8 
                        }}>
                            {t('terminal.invalidConnectionLink')}
                        </Text>
                        <Text style={{ 
                            ...Typography.default(), 
                            fontSize: 14, 
                            color: '#666', 
                            textAlign: 'center',
                            lineHeight: 20 
                        }}>
                            {t('terminal.invalidConnectionLinkDescription')}
                        </Text>
                    </View>
                </ItemGroup>
            </ItemList>
        );
    }

    // Show confirmation screen for valid connection
    return (
        <ItemList>
            {/* Connection Request Header */}
            <ItemGroup>
                <View style={{ 
                    alignItems: 'center',
                    paddingVertical: 24,
                    paddingHorizontal: 16
                }}>
                    <Ionicons 
                        name="terminal-outline" 
                        size={48} 
                        color="#007AFF" 
                        style={{ marginBottom: 16 }} 
                    />
                    <Text style={{ 
                        ...Typography.default('semiBold'), 
                        fontSize: 20, 
                        textAlign: 'center',
                        marginBottom: 12
                    }}>
                        {t('terminal.connectTerminal')}
                    </Text>
                    <Text style={{ 
                        ...Typography.default(), 
                        fontSize: 14, 
                        color: '#666', 
                        textAlign: 'center',
                        lineHeight: 20 
                    }}>
                        {t('terminal.terminalRequestDescription')}
                    </Text>
                </View>
            </ItemGroup>

            {/* Connection Details */}
            <ItemGroup title={t('terminal.connectionDetails')}>
                <Item
                    title={t('terminal.publicKey')}
                    detail={`${publicKey.substring(0, 12)}...`}
                    icon={<Ionicons name="key-outline" size={29} color="#007AFF" />}
                    showChevron={false}
                />
                <Item
                    title={t('terminal.encryption')}
                    detail={t('terminal.endToEndEncrypted')}
                    icon={<Ionicons name="lock-closed-outline" size={29} color="#34C759" />}
                    showChevron={false}
                />
            </ItemGroup>

            {/* Action Buttons */}
            <ItemGroup>
                <View style={{ 
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    gap: 12 
                }}>
                    {!auth.isAuthenticated && (
                        <Item
                            title={t('settingsAccount.statusNotAuthenticated')}
                            subtitle={t('welcome.loginWithMobileApp')}
                            icon={<Ionicons name="person-circle-outline" size={29} color="#FF9500" />}
                            showChevron={false}
                        />
                    )}
                    <RoundButton
                        title={isLoading ? t('terminal.connecting') : t('terminal.acceptConnection')}
                        onPress={handleConnect}
                        size="large"
                        disabled={isLoading || !auth.isAuthenticated}
                        loading={isLoading}
                    />
                    <RoundButton
                        title={t('terminal.reject')}
                        onPress={handleReject}
                        size="large"
                        display="inverted"
                        disabled={isLoading}
                    />
                </View>
            </ItemGroup>

            {/* Security Notice */}
            <ItemGroup 
                title={t('terminal.security')}
                footer={t('terminal.securityFooter')}
            >
                <Item
                    title={t('terminal.clientSideProcessing')}
                    subtitle={t('terminal.linkProcessedLocally')}
                    icon={<Ionicons name="shield-checkmark-outline" size={29} color="#34C759" />}
                    showChevron={false}
                />
            </ItemGroup>
        </ItemList>
    );
}
