/**
 * Payment system types for cross-platform payment integration
 */

export interface Product {
    id: string;
    title: string;
    price: number;
    priceString: string;
    period: 'monthly' | 'annual' | 'lifetime';
    description?: string;
    currencyCode?: string;
    features?: string[];
    recommended?: boolean;
}

export interface PurchaseResult {
    success: boolean;
    purchased?: boolean;
    cancelled?: boolean;
    error?: string;
    productId?: string;
    transactionId?: string;
    receipt?: string;
}

export interface SubscriptionStatus {
    isActive: boolean;
    productId?: string;
    expiryDate?: number;
    autoRenew?: boolean;
    planType?: 'monthly' | 'annual' | 'lifetime';
}

export interface PaymentConfig {
    appleProducts: {
        monthly: string;
        annual: string;
        lifetime?: string;
    };
    googleProducts?: {
        monthly: string;
        annual: string;
        lifetime?: string;
    };
    stripeProducts?: {
        monthly: string;
        annual: string;
        lifetime?: string;
    };
}

export type PaymentPlatform = 'ios' | 'android' | 'web';

export enum PaywallResult {
    PURCHASED = 'purchased',
    CANCELLED = 'cancelled',
    ERROR = 'error',
    NOT_PRESENTED = 'not_presented',
}

export interface PaywallOptions {
    offering?: string;
    customVariables?: Record<string, string>;
    requiredEntitlementIdentifier?: string;
}
