// -----------------------------------------------------------------------------
// GLOBAL DEFINITIONS (What the system supports fully in DB/Admin)
// -----------------------------------------------------------------------------

/**
 * All currencies supported by the database and admin interface.
 * Used for product pricing entry and multi-currency storage.
 */
export const DB_CURRENCIES = ['CAD', 'USD'] as const;
export type DbCurrency = (typeof DB_CURRENCIES)[number];

/**
 * All locales supported by the application.
 * Used for i18n routing, translations, and database localized fields.
 */
export const SUPPORTED_LOCALES = ['en', 'fr'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

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
import { env } from '@/lib/env';

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
