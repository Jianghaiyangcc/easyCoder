/**
 * Unified payment system interface that handles different platforms
 * Platform-specific implementations:
 * - iOS: Apple IAP (StoreKit 2.0)
 * - Android: Google Play Billing API
 * - Web: Stripe integration
 */

import { Platform } from 'react-native';
import type {
    Product,
    PurchaseResult,
    SubscriptionStatus,
    PaymentPlatform,
    PaywallOptions,
    PaywallResult,
} from './types';
import { appleIapPayments } from './appleIap';

/**
 * Unified payment interface
 * Provides consistent API across all platforms
 */
class Payments {
    private currentPlatform: PaymentPlatform | null = null;
    private initialized = false;

    /**
     * Initialize payment system for current platform
     * @param userId User identifier for purchase tracking
     */
    async initialize(userId: string): Promise<void> {
        if (this.initialized) {
            console.log('[Payments] Already initialized');
            return;
        }

        // Determine platform
        this.currentPlatform = this.detectPlatform();
        console.log('[Payments] Initializing for platform:', this.currentPlatform);

        // Platform-specific initialization
        switch (this.currentPlatform) {
            case 'ios':
                await appleIapPayments.initialize(userId);
                break;
            case 'android':
                // TODO: Initialize Google Play Billing
                console.log('[Payments] Android payments not yet implemented');
                break;
            case 'web':
                // TODO: Initialize Stripe
                console.log('[Payments] Web payments not yet implemented');
                break;
        }

        this.initialized = true;
        console.log('[Payments] Initialization complete');
    }

    /**
     * Purchase a product
     * @param productId Product identifier
     * @returns Purchase result
     */
    async purchaseProduct(productId: string): Promise<PurchaseResult> {
        if (!this.initialized) {
            console.warn('[Payments] Attempting to purchase before initialization');
            return {
                success: false,
                error: 'Payment system not initialized',
            };
        }

        switch (this.currentPlatform) {
            case 'ios':
                return await appleIapPayments.purchaseProduct(productId);
            case 'android':
                // TODO: Android purchase
                return { success: false, error: 'Android payments not yet implemented' };
            case 'web':
                // TODO: Web purchase
                return { success: false, error: 'Web payments not yet implemented' };
            default:
                return { success: false, error: 'Unknown platform' };
        }
    }

    /**
     * Get available products for current platform
     * @returns Array of available products
     */
    async getProducts(): Promise<Product[]> {
        if (!this.initialized) {
            console.warn('[Payments] Attempting to get products before initialization');
            return [];
        }

        switch (this.currentPlatform) {
            case 'ios':
                return await appleIapPayments.getProducts();
            case 'android':
                // TODO: Android products
                return [];
            case 'web':
                // TODO: Web products
                return [];
            default:
                return [];
        }
    }

    /**
     * Present paywall UI for subscriptions
     * @param options Paywall configuration options
     * @returns Paywall result
     */
    async presentPaywall(options?: PaywallOptions): Promise<{
        success: boolean;
        purchased?: boolean;
        error?: string;
    }> {
        if (!this.initialized) {
            return {
                success: false,
                error: 'Payment system not initialized',
            };
        }

        try {
            // Get available products
            const products = await this.getProducts();
            if (products.length === 0) {
                return {
                    success: false,
                    error: 'No products available',
                };
            }

            // For iOS, we'll use native paywall if available
            // For now, use the first available product
            const defaultProduct = products.find(p => p.recommended) || products[0];
            if (!defaultProduct) {
                return {
                    success: false,
                    error: 'No default product found',
                };
            }

            console.log('[Payments] Presenting paywall for product:', defaultProduct.id);

            // Purchase the default product
            const result = await this.purchaseProduct(defaultProduct.id);

            return {
                success: result.success,
                purchased: result.purchased,
                error: result.error,
            };
        } catch (error: any) {
            console.error('[Payments] Paywall error:', error);
            return {
                success: false,
                error: error?.message || 'Paywall error',
            };
        }
    }

    /**
     * Restore previous purchases
     * @returns Restore result
     */
    async restorePurchases(): Promise<PurchaseResult> {
        if (!this.initialized) {
            return {
                success: false,
                error: 'Payment system not initialized',
            };
        }

        switch (this.currentPlatform) {
            case 'ios':
                return await appleIapPayments.restorePurchases();
            case 'android':
                // TODO: Android restore
                return { success: false, error: 'Android restore not yet implemented' };
            case 'web':
                // TODO: Web restore
                return { success: false, error: 'Web restore not yet implemented' };
            default:
                return { success: false, error: 'Unknown platform' };
        }
    }

    /**
     * Get current subscription status
     * @returns Subscription status or null
     */
    getSubscriptionStatus(): SubscriptionStatus | null {
        switch (this.currentPlatform) {
            case 'ios':
                return appleIapPayments.getSubscriptionStatus();
            default:
                return null;
        }
    }

    /**
     * Check if user has active subscription
     * @returns true if subscription is active
     */
    hasActiveSubscription(): boolean {
        switch (this.currentPlatform) {
            case 'ios':
                return appleIapPayments.hasActiveSubscription();
            default:
                return false;
        }
    }

    /**
     * Get current platform
     * @returns Payment platform
     */
    getPlatform(): PaymentPlatform | null {
        return this.currentPlatform;
    }

    /**
     * Detect current platform
     * @returns Detected platform
     */
    private detectPlatform(): PaymentPlatform {
        if (Platform.OS === 'ios') {
            return 'ios';
        } else if (Platform.OS === 'android') {
            return 'android';
        } else if (Platform.OS === 'web') {
            return 'web';
        }

        // Default to web for unknown platforms
        return 'web';
    }

    /**
     * Get configuration for current platform
     * @returns Platform-specific product IDs
     */
    getPlatformProducts(): {
        monthly?: string;
        annual?: string;
        lifetime?: string;
    } {
        switch (this.currentPlatform) {
            case 'ios':
                return {
                    monthly: 'com.club.daima.code.monthly',
                    annual: 'com.club.daima.code.annual',
                };
            case 'android':
                return {
                    monthly: 'club.daima.code.monthly',
                    annual: 'club.daima.code.annual',
                };
            case 'web':
                return {
                    monthly: 'stripe_monthly',
                    annual: 'stripe_annual',
                };
            default:
                return {};
        }
    }
}

// Export singleton instance
export const payments = new Payments();
