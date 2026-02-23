import { env } from '@/lib/core/env';

/**
 * =============================================================================
 * 🏬 IDENTITÉ DU SITE (piloté par .env)
 * =============================================================================
 * Chaque instance Vercel définit ces valeurs dans ses variables d'environnement.
 * Un seul code source → N déploiements (un par pays/région).
 */
export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME || 'Ecommerce Starter';

export const siteConfig = {
  name: SITE_NAME,
  url: env.NEXT_PUBLIC_SITE_URL,
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "Starter e-commerce universel, flexible et prêt à l'emploi.",
} as const;

/**
 * =============================================================================
 * 📧 COMMUNICATIONS & ADMINISTRATION (piloté par .env)
 * =============================================================================
 */
export const SITE_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
export const ADMIN_LOCALE = process.env.ADMIN_LOCALE || 'en';
export const FROM_EMAIL =
  process.env.FROM_EMAIL || `${SITE_NAME} <onboarding@resend.dev>`;

/**
 * =============================================================================
 * 🌍 INTERNATIONALISATION (I18N) & MONNAIE (piloté par .env)
 * =============================================================================
 *
 * Architecture Multi-Pays :
 *   1 codebase → N projets Vercel → N domaines
 *   Chaque projet Vercel définit NEXT_PUBLIC_COUNTRY, NEXT_PUBLIC_CURRENCY,
 *   NEXT_PUBLIC_DEFAULT_LOCALE et NEXT_PUBLIC_LOCALES.
 */

// --- Pays principal ---
export const SITE_COUNTRY = process.env.NEXT_PUBLIC_COUNTRY || 'CA';

// --- Langues ---
const rawLocales = process.env.NEXT_PUBLIC_LOCALES || 'en,fr';
export const SUPPORTED_LOCALES = rawLocales.split(',') as SupportedLocale[];
export type SupportedLocale = string;
export const DEFAULT_LOCALE = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE ||
  SUPPORTED_LOCALES[0] ||
  'en') as SupportedLocale;

// --- Devises ---
export const SUPPORTED_CURRENCIES = ['CAD', 'USD', 'EUR', 'GBP'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
export const DEFAULT_CURRENCY = (process.env.NEXT_PUBLIC_CURRENCY ||
  'CAD') as SupportedCurrency;
export const SITE_CURRENCY = DEFAULT_CURRENCY;

/**
 * Précision décimale par devise.
 * Indispensable pour les calculs de taxes et Stripe.
 */
export const CURRENCY_DECIMALS: Record<string, number> = {
  CAD: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
  CLP: 0,
};

/**
 * Mapping Pays → Devise (Code ISO 3166-1 alpha-2).
 * Utilisé pour la détection automatique de devise dans le middleware.
 */
export const COUNTRY_TO_CURRENCY: Record<string, SupportedCurrency> = {
  CA: 'CAD',
  US: 'USD',
  FR: 'EUR',
  DE: 'EUR',
  BE: 'EUR',
  CH: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  PT: 'EUR',
  AT: 'EUR',
  IE: 'EUR',
  GB: 'GBP',
  MX: 'USD',
};

export const SUPPORTED_COUNTRIES = Object.keys(COUNTRY_TO_CURRENCY);

/**
 * Pays principal d'exploitation du site.
 * Défini directement par la variable d'environnement NEXT_PUBLIC_COUNTRY.
 * Vérifie que le pays a une devise correspondante.
 */
const _countryCurrency = COUNTRY_TO_CURRENCY[SITE_COUNTRY];
if (!_countryCurrency) {
  // Si le pays n'est pas dans le mapping, on accepte la devise manuelle
  console.warn(
    `⚠️ SITE_COUNTRY "${SITE_COUNTRY}" n'a pas de devise dans COUNTRY_TO_CURRENCY. Utilisation de NEXT_PUBLIC_CURRENCY="${SITE_CURRENCY}".`
  );
}
export const SITE_MAIN_COUNTRY = SITE_COUNTRY;

/**
 * Préfixes téléphoniques par pays.
 */
export const COUNTRY_PHONE_PREFIXES: Record<string, string> = {
  CA: '+1',
  US: '+1',
  FR: '+33',
  DE: '+49',
  BE: '+32',
  CH: '+41',
  ES: '+34',
  IT: '+39',
  NL: '+31',
  PT: '+351',
  AT: '+43',
  IE: '+353',
  GB: '+44',
  MX: '+52',
};

/**
 * Taux de conversion manuels (Fallback).
 * Utilisé pour les conversions rapides (ex: Shippo CAD -> Site USD).
 */
export const CAD_TO_USD_RATE = 0.72;

export const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  CAD: { USD: CAD_TO_USD_RATE },
  USD: { CAD: Number((1 / CAD_TO_USD_RATE).toFixed(4)) },
};

/**
 * =============================================================================
 * 📦 LOGISTIQUE & EXPÉDITION
 * =============================================================================
 */

export const SITE_ADDRESS = ''; // Récupéré dynamiquement depuis la DB (LogisticsLocations)

export const PHONE_PREFIX = COUNTRY_PHONE_PREFIXES[SITE_COUNTRY] || '+1';

export const SHIPPING_UNITS = {
  DISTANCE: 'cm',
  MASS: 'kg',
} as const;

/**
 * Filtre des transporteurs Shippo.
 * Laissez vide [] pour tout afficher, ou spécifiez ['ups', 'usps'].
 */
export const SHIPPING_PROVIDERS_FILTER: string[] = process.env
  .SHIPPING_PROVIDERS
  ? process.env.SHIPPING_PROVIDERS.split(',')
  : [];

/**
 * Incoterm par défaut pour l'international.
 * DDP : Droits et taxes payés par le vendeur.
 * DDU : Droits et taxes payés par le client à la livraison.
 */
export const DEFAULT_SHIPPING_INCOTERM = 'DDP';

/**
 * Stratégies de regroupement des tarifs de livraison.
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
 * Code postal spécial pour déclencher le bypass de test (1$ shipping).
 */
export const SHIPPING_TEST_ZIP = '1DLR';

/**
 * Activer ou désactiver globalement le mode de test pour la logistique.
 * Pour la sécurité, doit être à FALSE en production.
 */
export const ENABLE_SHIPPING_TEST_MODE =
  process.env.ENABLE_SHIPPING_TEST_MODE === 'true';

/**
 * Catalogue des boîtes standards pour l'emballage 3D.
 * Utilisé par l'algorithme de bin-packing pour optimiser les envois.
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

/**
 * =============================================================================
 * 💳 CONFIGURATION DES PAIEMENTS
 * =============================================================================
 */

/**
 * Gestion automatique des taxes via Stripe Tax.
 * Si activé, Stripe calculera les taxes selon l'adresse du client.
 * Note : Nécessite l'activation de Stripe Tax dans votre dashboard Stripe.
 */
export const STRIPE_AUTOMATIC_TAX =
  process.env.STRIPE_AUTOMATIC_TAX !== 'false';

/**
 * =============================================================================
 * 🛠️ CONSTANTES TECHNIQUES & DOMAINE
 * =============================================================================
 */
export const PRODUCT_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'INACTIVE',
  'ARCHIVED',
] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const CART_COOKIE_NAME = 'cart_anonymous_id';

export const LEGAL_LAST_UPDATED = new Date('2025-01-01');
