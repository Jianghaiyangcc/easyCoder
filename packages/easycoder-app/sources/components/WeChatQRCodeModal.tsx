import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { BaseModal } from '@/modal/components/BaseModal';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/Typography';
import { useUnistyles } from 'react-native-unistyles';
import { Image } from 'expo-image';

interface WeChatQRCodeModalProps {
    onClose: () => void;
}

export function WeChatQRCodeModal({ onClose }: WeChatQRCodeModalProps) {
    const { theme } = useUnistyles();
    const { width: windowWidth } = useWindowDimensions();
    const cardWidth = Math.min(windowWidth - 48, 320);
    const qrSize = Math.min(cardWidth - 64, 240);

    return (
        <BaseModal visible={true} onClose={onClose}>
            <View style={[styles.container, { backgroundColor: theme.colors.surface, width: cardWidth }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.text }, Typography.default('semiBold')]}>
                        加入我们
                    </Text>
                    <Pressable
                        onPress={onClose}
                        style={({ pressed }) => [
                            styles.closeButton,
                            pressed && styles.closeButtonPressed
                        ]}
                        hitSlop={8}
                    >
                        <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
                    </Pressable>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* QR Code */}
                    <View style={[styles.qrContainer, { width: qrSize, height: qrSize }]}>
                        <Image
                            source={{ uri: 'https://via.placeholder.com/240x240/07C160/FFFFFF?text=WeChat+QR+Code' }}
                            style={styles.qrImage}
                            contentFit="contain"
                        />
                    </View>

                    {/* Subtitle */}
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }, Typography.default()]}>
                        扫描二维码加入我们
                    </Text>
                </View>

                {/* Footer Button */}
                <View style={styles.footer}>
                    <Pressable
                        onPress={onClose}
                        style={({ pressed }) => [
                            styles.confirmButton,
                            { backgroundColor: theme.colors.textLink },
                            pressed && styles.confirmButtonPressed
                        ]}
                    >
                        <Text style={[styles.confirmButtonText, { color: '#FFFFFF' }, Typography.default('semiBold')]}>
                            确定
                        </Text>
                    </Pressable>
                </View>
            </View>
        </BaseModal>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
    },
    title: {
        fontSize: 18,
        textAlign: 'center',
        flex: 1,
    },
    closeButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonPressed: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    qrContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#F5F5F5',
    },
    qrImage: {
        width: '100%',
        height: '100%',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 16,
        textAlign: 'center',
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    confirmButton: {
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonPressed: {
        opacity: 0.8,
    },
    confirmButtonText: {
        fontSize: 16,
    },
});
