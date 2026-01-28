import { env } from '@/lib/core/env';

/**
 * =============================================================================
 * SITE IDENTITY
 * =============================================================================
 */
export const SITE_NAME = 'AgTechNest';

export const siteConfig = {
  name: SITE_NAME,
  url: env.NEXT_PUBLIC_SITE_URL,
  description: "Starter e-commerce universel, flexible et prêt à l'emploi.",
};

/**
 * =============================================================================
 * I18N & CURRENCY CONFIGURATION
 * =============================================================================
 * Single source of truth for internationalization and monetary settings.
 */

// --- LOCALES ---
export const SUPPORTED_LOCALES = ['en', 'fr'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE = 'en' as SupportedLocale;

// --- CURRENCIES ---
export const SUPPORTED_CURRENCIES = ['CAD', 'USD'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
export const DEFAULT_CURRENCY = 'CAD' as SupportedCurrency;

/**
 * Mapping of Country Codes (ISO 3166-1 alpha-2) to Currencies.
 * Used for auto-detection in middleware.
 */
export const COUNTRY_TO_CURRENCY: Record<string, SupportedCurrency> = {
  US: 'USD',
  CA: 'CAD',
  // Add other countries here:
  // FR: 'EUR',
  // GB: 'GBP',
};

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
 * =============================================================================
 * SITE INFORMATION
 * =============================================================================
 */
export const SITE_EMAIL = 'agtechnest@gmail.com';
export const SITE_ADDRESS = 'Montreal, QC\nCanada';

/**
 * Manual exchange rate fallback.
 * Used primarily for shipping calculations between Shippo (CAD) and site currency.
 */
export const CAD_TO_USD_RATE = 0.72;

/**
 * =============================================================================
 * LEGAL
 * =============================================================================
 */
export const LEGAL_LAST_UPDATED = new Date('2025-01-01');
