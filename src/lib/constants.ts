import { env } from '@/lib/env';

/**
 * =============================================================================
 * I18N & CURRENCY CONFIGURATION
 * =============================================================================
 * Single source of truth for internationalization and monetary settings.
 */

// --- LOCALES ---
export const SUPPORTED_LOCALES = env.NEXT_PUBLIC_LOCALES as string[];
export type SupportedLocale = string;
export const DEFAULT_LOCALE = env.NEXT_PUBLIC_DEFAULT_LOCALE as SupportedLocale;

// --- CURRENCIES ---
export const SUPPORTED_CURRENCIES =
  env.NEXT_PUBLIC_SUPPORTED_CURRENCIES as string[];
export type SupportedCurrency = string;
export const DEFAULT_CURRENCY = env.NEXT_PUBLIC_CURRENCY as SupportedCurrency;

/**
 * Site-wide active currency for this specific deployment.
 * Use this for checkout and primary price displays.
 */
export const SITE_CURRENCY = DEFAULT_CURRENCY;

/**
 * =============================================================================
 * PRODUCT & BUSINESS CONSTANTS
 * =============================================================================
 */

export const PRODUCT_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'INACTIVE',
  'ARCHIVED',
] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/**
 * Manual exchange rate fallback.
 * Used primarily for shipping calculations between Shippo (CAD) and site currency.
 */
export const CAD_TO_USD_RATE = env.CAD_TO_USD_RATE;
