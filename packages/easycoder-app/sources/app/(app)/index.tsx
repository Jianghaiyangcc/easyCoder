import { RoundButton } from "@/components/RoundButton";
import { useAuth } from "@/auth/AuthContext";
import { Text, View, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as React from 'react';
import { encodeBase64 } from "@/encryption/base64";
import { authGetToken } from "@/auth/authGetToken";
import { usePathname, useRouter } from "expo-router";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { getRandomBytesAsync } from "expo-crypto";
import { useIsLandscape, useIsTablet } from "@/utils/responsive";
import { Typography } from "@/constants/Typography";
import { trackAccountCreated, trackAccountRestored } from '@/track';
import { HomeHeaderNotAuth } from "@/components/HomeHeader";
import { MainView } from "@/components/MainView";
import { t } from '@/text';
import { useSessionListViewData } from '@/sync/storage';
import { navigateToSession } from '@/hooks/useNavigateToSession';
import { Modal } from '@/modal';
import { PhoneApiRequestError, sendPhoneLoginCode, verifyPhoneLoginCode } from '@/sync/apiPhone';

export default function Home() {
    const auth = useAuth();
    if (!auth.isAuthenticated) {
        return <NotAuthenticated />;
    }
    return (
        <Authenticated />
    )
}

function Authenticated() {
    const router = useRouter();
    const pathname = usePathname();
    const isTablet = useIsTablet();
    const sessionListViewData = useSessionListViewData();
    const hasAutoRoutedRef = React.useRef(false);

    React.useEffect(() => {
        if (!isTablet) {
            return;
        }

        if (hasAutoRoutedRef.current) {
            return;
        }

        if (pathname !== '/' && pathname !== '/index') {
            return;
        }

        if (!sessionListViewData) {
            return;
        }

        const activeSessionsGroup = sessionListViewData.find((item) => item.type === 'active-sessions');
        const firstActiveSessionId = activeSessionsGroup?.sessions[0]?.id;

        hasAutoRoutedRef.current = true;

        if (firstActiveSessionId) {
            navigateToSession(router, firstActiveSessionId);
            return;
        }

        router.replace('/new');
    }, [isTablet, pathname, router, sessionListViewData]);

    return <MainView variant="phone" />;
}

function NotAuthenticated() {
    const { theme } = useUnistyles();
    const auth = useAuth();
    const router = useRouter();
    const isLandscape = useIsLandscape();
    const insets = useSafeAreaInsets();

    const createAccount = async () => {
        try {
            const secret = await getRandomBytesAsync(32);
            const token = await authGetToken(secret);
            if (token && secret) {
                await auth.login(token, encodeBase64(secret, 'base64url'));
                trackAccountCreated();
            }
        } catch (error) {
            console.error('Error creating account', error);
        }
    }

    const loginWithPhone = async () => {
        const phoneInput = await Modal.prompt(
            t('settingsAccount.enterPhoneTitle'),
            t('settingsAccount.enterPhoneMessage'),
            {
                placeholder: t('settingsAccount.enterPhonePlaceholder'),
                inputType: 'numeric',
            }
        );

        if (phoneInput === null) {
            return;
        }

        const phone = phoneInput.trim();
        if (!phone) {
            Modal.alert(t('common.error'), t('settingsAccount.phoneEmptyError'));
            return;
        }

        try {
            const sendResult = await sendPhoneLoginCode({ phone });
            const codeInput = await Modal.prompt(
                t('settingsAccount.enterCodeTitle'),
                t('settingsAccount.enterCodeMessage', { phone: sendResult.phone }),
                {
                    placeholder: t('settingsAccount.enterCodePlaceholder'),
                    inputType: 'numeric',
                }
            );

            if (codeInput === null) {
                return;
            }

            const code = codeInput.trim();
            if (!code) {
                Modal.alert(t('common.error'), t('settingsAccount.codeEmptyError'));
                return;
            }

            const loginResult = await verifyPhoneLoginCode({ phone, code });
            await auth.login(loginResult.token, loginResult.secret);
            if (loginResult.isNewAccount) {
                trackAccountCreated();
                return;
            }
            trackAccountRestored();
        } catch (error) {
            console.error('Error logging in with phone', error);
            if (error instanceof PhoneApiRequestError) {
                Modal.alert(t('common.error'), error.message);
                return;
            }
            Modal.alert(t('common.error'), t('settingsAccount.phoneActionFailed'));
        }
    }

    const portraitLayout = (
        <View style={styles.portraitContainer}>
            <Image
                source={theme.dark ? require('@/assets/images/logotype-light.png') : require('@/assets/images/logotype-dark.png')}
                resizeMode="contain"
                style={styles.logo}
            />
            <Text style={styles.title}>
                {t('welcome.title')}
            </Text>
            <Text style={styles.subtitle}>
                {t('welcome.subtitle')}
            </Text>
            {Platform.OS !== 'android' && Platform.OS !== 'ios' ? (
                <>
                    <View style={styles.buttonContainer}>
                        <RoundButton
                            title={t('welcome.loginWithMobileApp')}
                            onPress={() => {
                                trackAccountRestored();
                                router.push('/restore');
                            }}
                        />
                    </View>
                    <View style={styles.buttonContainerSecondary}>
                        <RoundButton
                            size="normal"
                            title={t('welcome.loginWithPhone')}
                            action={loginWithPhone}
                            display="inverted"
                        />
                    </View>
                    <View style={styles.buttonContainerTertiary}>
                        <RoundButton
                            size="normal"
                            title={t('welcome.createAccount')}
                            action={createAccount}
                            display="inverted"
                        />
                    </View>
                </>
            ) : (
                <>
                    <View style={styles.buttonContainer}>
                        <RoundButton
                            title={t('welcome.loginWithPhone')}
                            action={loginWithPhone}
                        />
                    </View>
                    <View style={styles.buttonContainerSecondary}>
                        <RoundButton
                            size="normal"
                            title={t('navigation.restoreWithSecretKey')}
                            onPress={() => {
                                trackAccountRestored();
                                router.push('/restore/manual');
                            }}
                            display="inverted"
                        />
                    </View>
                    <View style={styles.buttonContainerTertiary}>
                        <RoundButton
                            size="normal"
                            title={t('welcome.createAccount')}
                            action={createAccount}
                            display="inverted"
                        />
                    </View>
                </>
            )}
        </View>
    );

    const landscapeLayout = (
        <View style={[styles.landscapeContainer, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.landscapeInner}>
                <View style={styles.landscapeLogoSection}>
                    <Image
                        source={theme.dark ? require('@/assets/images/logotype-light.png') : require('@/assets/images/logotype-dark.png')}
                        resizeMode="contain"
                        style={styles.landscapeLogo}
                    />
                </View>
                <View style={styles.landscapeContentSection}>
                    <Text style={styles.landscapeTitle}>
                        {t('welcome.title')}
                    </Text>
                    <Text style={styles.landscapeSubtitle}>
                        {t('welcome.subtitle')}
                    </Text>
                    {Platform.OS !== 'android' && Platform.OS !== 'ios'
                        ? (<>
                            <View style={styles.landscapeButtonContainer}>
                                <RoundButton
                                    title={t('welcome.loginWithMobileApp')}
                                    onPress={() => {
                                        trackAccountRestored();
                                        router.push('/restore');
                                    }}
                                />
                            </View>
                            <View style={styles.landscapeButtonContainerSecondary}>
                                <RoundButton
                                    size="normal"
                                    title={t('welcome.loginWithPhone')}
                                    action={loginWithPhone}
                                    display="inverted"
                                />
                            </View>
                            <View style={styles.landscapeButtonContainerTertiary}>
                                <RoundButton
                                    size="normal"
                                    title={t('welcome.createAccount')}
                                    action={createAccount}
                                    display="inverted"
                                />
                            </View>
                        </>)
                        : (<>
                            <View style={styles.landscapeButtonContainer}>
                                <RoundButton
                                    title={t('welcome.loginWithPhone')}
                                    action={loginWithPhone}
                                />
                            </View>
                            <View style={styles.landscapeButtonContainerSecondary}>
                                <RoundButton
                                    size="normal"
                                    title={t('navigation.restoreWithSecretKey')}
                                    onPress={() => {
                                        trackAccountRestored();
                                        router.push('/restore/manual');
                                    }}
                                    display="inverted"
                                />
                            </View>
                            <View style={styles.landscapeButtonContainerTertiary}>
                                <RoundButton
                                    size="normal"
                                    title={t('welcome.createAccount')}
                                    action={createAccount}
                                    display="inverted"
                                />
                            </View>
                        </>)
                    }
                </View>
            </View>
        </View>
    );

    return (
        <>
            <HomeHeaderNotAuth />
            {isLandscape ? landscapeLayout : portraitLayout}
        </>
    )
}

const styles = StyleSheet.create((theme) => ({
    // NotAuthenticated styles
    portraitContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 300,
        height: 90,
    },
    title: {
        marginTop: 16,
        textAlign: 'center',
        fontSize: 24,
        ...Typography.default('semiBold'),
        color: theme.colors.text,
    },
    subtitle: {
        ...Typography.default(),
        fontSize: 18,
        color: theme.colors.textSecondary,
        marginTop: 16,
        textAlign: 'center',
        marginHorizontal: 24,
        marginBottom: 64,
    },
    buttonContainer: {
        maxWidth: 280,
        width: '100%',
        marginBottom: 16,
    },
    buttonContainerSecondary: {
        maxWidth: 280,
        width: '100%',
        marginBottom: 16,
    },
    buttonContainerTertiary: {
        maxWidth: 280,
        width: '100%',
    },
    // Landscape styles
    landscapeContainer: {
        flexBasis: 0,
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 48,
    },
    landscapeInner: {
        flexGrow: 1,
        flexBasis: 0,
        maxWidth: 800,
        flexDirection: 'row',
    },
    landscapeLogoSection: {
        flexBasis: 0,
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 24,
    },
    landscapeLogo: {
        width: '100%',
        maxWidth: 420,
        aspectRatio: 1408 / 768,
    },
    landscapeContentSection: {
        flexBasis: 0,
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 24,
    },
    landscapeTitle: {
        textAlign: 'center',
        fontSize: 24,
        ...Typography.default('semiBold'),
        color: theme.colors.text,
    },
    landscapeSubtitle: {
        ...Typography.default(),
        fontSize: 18,
        color: theme.colors.textSecondary,
        marginTop: 16,
        textAlign: 'center',
        marginBottom: 32,
        paddingHorizontal: 16,
    },
    landscapeButtonContainer: {
        width: 280,
        marginBottom: 16,
    },
    landscapeButtonContainerSecondary: {
        width: 280,
        marginBottom: 16,
    },
    landscapeButtonContainerTertiary: {
        width: 280,
    },
}));
