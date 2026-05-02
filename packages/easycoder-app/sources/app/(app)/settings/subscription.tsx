import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUnistyles } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Modal } from '@/modal';
import { t } from '@/text';
import { useEntitlement } from '@/sync/storage';
import { layout } from '@/components/layout';
import { sync } from '@/sync/sync';
import { StyleSheet } from 'react-native-unistyles';

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        width: '100%',
        maxWidth: layout.maxWidth,
        alignSelf: 'center',
    },
    currentPlanSection: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 20,
        margin: 16,
        alignItems: 'center',
    },
    planBadge: {
        backgroundColor: theme.colors.primary || '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 12,
    },
    planBadgeText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    expiryText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        marginTop: 8,
    },
    featuresContainer: {
        marginVertical: 16,
        width: '100%',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureIcon: {
        marginRight: 12,
    },
    featureText: {
        fontSize: 15,
        color: theme.colors.text,
    },
    planCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 20,
        margin: 16,
        borderWidth: 2,
        borderColor: theme.colors.border,
    },
    recommendedCard: {
        borderColor: theme.colors.primary || '#007AFF',
        backgroundColor: `${theme.colors.primary || '#007AFF'}10`,
    },
    recommendedBadge: {
        position: 'absolute',
        top: -10,
        right: 20,
        backgroundColor: theme.colors.primary || '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    recommendedBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    planTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 8,
    },
    planPrice: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.colors.primary || '#007AFF',
        marginBottom: 4,
    },
    planPeriod: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 16,
    },
    planFeatures: {
        marginBottom: 20,
    },
    upgradeButton: {
        backgroundColor: theme.colors.primary || '#007AFF',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
    },
    upgradeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.5,
    },
    manageButton: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.primary || '#007AFF',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
        marginTop: 12,
    },
    manageButtonText: {
        color: theme.colors.primary || '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    loadingText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginTop: 12,
    },
}));

// 临时产品数据 - 稍后会从实际支付系统获取
const MOCK_PRODUCTS = [
    {
        id: 'monthly',
        title: t('subscription.monthlyPlan'),
        price: 9.9,
        priceString: '¥9.9/月',
        period: 'monthly',
        features: [
            t('subscription.features.unlimitedAI'),
            t('subscription.features.prioritySupport'),
            t('subscription.features.exclusiveFeatures'),
            t('subscription.features.adFree'),
        ],
        recommended: false,
    },
    {
        id: 'annual',
        title: t('subscription.annualPlan'),
        price: 99,
        priceString: '¥99/年',
        period: 'annual',
        features: [
            t('subscription.features.unlimitedAI'),
            t('subscription.features.prioritySupport'),
            t('subscription.features.exclusiveFeatures'),
            t('subscription.features.adFree'),
            t('subscription.save17Percent'),
        ],
        recommended: true,
    },
];

export default function SubscriptionScreen() {
    const { theme } = useUnistyles();
    const styles = stylesheet;
    const hasPro = useEntitlement('pro');
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [loading, setLoading] = useState(true);

    // 模拟加载产品数据
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleUpgrade = async (productId: string) => {
        if (hasPro) {
            // 已是专业版，跳转到管理订阅
            Modal.alert(
                t('subscription.manageSubscription'),
                t('subscription.alreadyProMessage')
            );
            return;
        }

        setIsPurchasing(true);
        try {
            // 这里应该调用实际的支付系统
            const result = await sync.presentPaywall(productId);
            if (!result.success) {
                Modal.alert(
                    t('common.error'),
                    result.error || t('subscription.purchaseFailed')
                );
            }
        } catch (error) {
            Modal.alert(
                t('common.error'),
                t('subscription.purchaseFailed')
            );
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleManageSubscription = async () => {
        // iOS 跳转到 App Store 订阅管理
        // Web 跳转到 Stripe 订阅管理页面
        Modal.alert(
            t('subscription.manageSubscription'),
            t('subscription.manageSubscriptionMessage')
        );
    };

    if (loading) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        headerTitle: t('subscription.title'),
                    }}
                />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>
                        {t('subscription.loading')}
                    </Text>
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: t('subscription.title'),
                }}
            />

            <ItemList style={{ paddingTop: 0 }}>
                {/* 当前订阅状态 */}
                <View style={styles.container}>
                    <View style={styles.currentPlanSection}>
                        <View style={styles.planBadge}>
                            <Text style={styles.planBadgeText}>
                                {hasPro ? t('subscription.proPlan') : t('subscription.freePlan')}
                            </Text>
                        </View>

                        <View style={styles.featuresContainer}>
                            <View style={styles.featureItem}>
                                <Ionicons
                                    name={hasPro ? "checkmark-circle" : "close-circle"}
                                    size={20}
                                    color={hasPro ? "#34C759" : "#8E8E93"}
                                    style={styles.featureIcon}
                                />
                                <Text style={styles.featureText}>
                                    {t('subscription.features.unlimitedAI')}
                                </Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons
                                    name={hasPro ? "checkmark-circle" : "close-circle"}
                                    size={20}
                                    color={hasPro ? "#34C759" : "#8E8E93"}
                                    style={styles.featureIcon}
                                />
                                <Text style={styles.featureText}>
                                    {t('subscription.features.prioritySupport')}
                                </Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons
                                    name={hasPro ? "checkmark-circle" : "close-circle"}
                                    size={20}
                                    color={hasPro ? "#34C759" : "#8E8E93"}
                                    style={styles.featureIcon}
                                />
                                <Text style={styles.featureText}>
                                    {t('subscription.features.exclusiveFeatures')}
                                </Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Ionicons
                                    name={hasPro ? "checkmark-circle" : "close-circle"}
                                    size={20}
                                    color={hasPro ? "#34C759" : "#8E8E93"}
                                    style={styles.featureIcon}
                                />
                                <Text style={styles.featureText}>
                                    {t('subscription.features.adFree')}
                                </Text>
                            </View>
                        </View>

                        {hasPro && (
                            <Pressable
                                style={styles.manageButton}
                                onPress={handleManageSubscription}
                            >
                                <Text style={styles.manageButtonText}>
                                    {t('subscription.manageSubscription')}
                                </Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* 套餐选项 */}
                {!hasPro && (
                    <View style={styles.container}>
                        {MOCK_PRODUCTS.map((product) => (
                            <Pressable
                                key={product.id}
                                style={[
                                    styles.planCard,
                                    product.recommended && styles.recommendedCard,
                                ]}
                                onPress={() => handleUpgrade(product.id)}
                                disabled={isPurchasing}
                            >
                                {product.recommended && (
                                    <View style={styles.recommendedBadge}>
                                        <Text style={styles.recommendedBadgeText}>
                                            {t('subscription.recommended')}
                                        </Text>
                                    </View>
                                )}

                                <Text style={styles.planTitle}>{product.title}</Text>
                                <Text style={styles.planPrice}>{product.priceString}</Text>
                                <Text style={styles.planPeriod}>
                                    {product.period === 'monthly' ? t('subscription.billedMonthly') : t('subscription.billedAnnually')}
                                </Text>

                                <View style={styles.planFeatures}>
                                    {product.features.map((feature, index) => (
                                        <View key={index} style={styles.featureItem}>
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={18}
                                                color="#34C759"
                                                style={styles.featureIcon}
                                            />
                                            <Text style={styles.featureText}>
                                                {feature}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                <Pressable
                                    style={[
                                        styles.upgradeButton,
                                        isPurchasing && styles.disabledButton,
                                    ]}
                                    onPress={() => handleUpgrade(product.id)}
                                    disabled={isPurchasing}
                                >
                                    <Text style={styles.upgradeButtonText}>
                                        {isPurchasing ? t('subscription.purchasing') : t('subscription.upgradeToPro')}
                                    </Text>
                                </Pressable>
                            </Pressable>
                        ))}
                    </View>
                )}

                {/* 信息 */}
                <ItemGroup footer={t('subscription.footer')}>
                    <Item
                        title={t('subscription.terms')}
                        icon={<Ionicons name="document-text-outline" size={29} color="#007AFF" />}
                        onPress={() => {/* 跳转到条款 */}}
                    />
                    <Item
                        title={t('subscription.privacy')}
                        icon={<Ionicons name="shield-checkmark-outline" size={29} color="#007AFF" />}
                        onPress={() => {/* 跳转到隐私政策 */}}
                    />
                </ItemGroup>
            </ItemList>
        </>
    );
}
