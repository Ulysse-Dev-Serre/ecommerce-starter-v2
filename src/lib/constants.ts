// -----------------------------------------------------------------------------
// GLOBAL DEFINITIONS (What the system supports fully in DB/Admin)
// -----------------------------------------------------------------------------

/**
 * All currencies supported by the database and admin interface.
 * Used for product pricing entry and multi-currency storage.
 */
export const DB_CURRENCIES = ['CAD', 'USD'] as const;
export type DbCurrency = (typeof DB_CURRENCIES)[number];

import { env } from '@/lib/env';

/**
 * All locales supported by the application.
 * Dynamically pulled from the environment (NEXT_PUBLIC_LOCALES).
 * In a multi-tenant setup, each deployment defines its own active languages.
 */
export const SUPPORTED_LOCALES = env.NEXT_PUBLIC_LOCALES as string[];
export type SupportedLocale = string;

/**
 * Product statuses available for management.
 */
export const PRODUCT_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'INACTIVE',
  'ARCHIVED',
] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

// -----------------------------------------------------------------------------
// ACTIVE SITE CONFIGURATION (What this specific deployment uses)
// -----------------------------------------------------------------------------

/**
 * The single active currency for this deployment.
 * Determined by NEXT_PUBLIC_CURRENCY env var.
 * Example: 'CAD' for site.ca, 'USD' for site.com
 */
export const SITE_CURRENCY = env.NEXT_PUBLIC_CURRENCY as DbCurrency;

/**
 * Only used if you wanted to restrict site languages per domain,
 * but currently both domains support both languages.
 */
export const SITE_DEFAULT_LOCALE =
  env.NEXT_PUBLIC_DEFAULT_LOCALE as SupportedLocale;

/**
 * Manual exchange rate for shipping calculations (Shippo returns CAD, site uses USD).
 * This acts as a fallback/override since we don't query live exchange rates.
 */
export const CAD_TO_USD_RATE = env.CAD_TO_USD_RATE;
