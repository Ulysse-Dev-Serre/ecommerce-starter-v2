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
 * Default phone prefix for the site region.
 * Used in checkout address forms.
 */
export const PHONE_PREFIX = '+1';

export const CART_COOKIE_NAME = 'cart_anonymous_id';

/**
 * =============================================================================
 * LEGAL
 * =============================================================================
 */
export const LEGAL_LAST_UPDATED = new Date('2025-01-01');

/**
 * =============================================================================
 * SHIPPING CONFIGURATION
 * =============================================================================
 */
export const SHIPPING_UNITS = {
  DISTANCE: 'cm',
  MASS: 'kg',
} as const;

/**
 * Filter to only show rates from specific providers (lowercase).
 * If empty, all providers are shown.
 * Example: ['ups', 'fedex']
 */
export const SHIPPING_PROVIDERS_FILTER: string[] = ['ups'];

/**
 * Default Incoterm for shipping (DDU = Delivered Duty Unpaid).
 * Change to 'DDP' if you handle duties/taxes for the customer.
 */
export const DEFAULT_SHIPPING_INCOTERM = 'DDP';

/**
 * Filter keywords to categorize shipping rates (lowercase).
 * Used to group rates into "Standard" and "Express" categories.
 */
export const SHIPPING_STRATEGIES = {
  STANDARD: {
    LABEL: 'Standard',
    KEYWORDS: ['standard', 'ground'],
    EXCLUDES: [],
  },
  EXPRESS: {
    LABEL: 'Express',
    KEYWORDS: ['express', 'saver', 'next day'],
    EXCLUDES: ['early', 'plus', '3 day'],
  },
} as const;

/**
 * Standard box sizes for shipping (Dimensions in cm, weight in kg).
 * Used by the 3D Bin Packing algorithm to optimize parcel selection.
 */
export const SHIPPING_BOX_CATALOG = [
  {
    id: 'box-small',
    name: 'Small Box',
    width: 20,
    length: 15,
    height: 10,
    maxWeight: 5,
  },
  {
    id: 'box-medium',
    name: 'Medium Box',
    width: 35,
    length: 25,
    height: 20,
    maxWeight: 10,
  },
  {
    id: 'box-large',
    name: 'Large Box',
    width: 50,
    length: 40,
    height: 35,
    maxWeight: 25,
  },
  {
    id: 'envelope-padded',
    name: 'Padded Envelope',
    width: 25,
    length: 18,
    height: 2,
    maxWeight: 1,
  },
] as const;
