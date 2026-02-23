import { env } from '@/lib/core/env';

/**
 * =============================================================================
 * 🏬 IDENTITÉ DU SITE
 * =============================================================================
 * Configuration de base affichée sur le storefront et utilisée pour le SEO.
 */
export const SITE_NAME = 'AgTechNest';

export const siteConfig = {
  name: SITE_NAME,
  url: env.NEXT_PUBLIC_SITE_URL,
  description: "Starter e-commerce universel, flexible et prêt à l'emploi.",
} as const;

/**
 * =============================================================================
 * 📧 COMMUNICATIONS & ADMINISTRATION
 * =============================================================================
 * Adresses emails et préférences pour les notifications système.
 */
export const SITE_EMAIL = 'agtechnest@gmail.com';
export const ADMIN_EMAIL = 'agtechnest@gmail.com'; // Réception des alertes commandes/logs
export const ADMIN_LOCALE = 'fr'; // Langue utilisée pour les emails envoyés à l'admin
export const FROM_EMAIL = `AgTechNest <onboarding@resend.dev>`; // Expéditeur des emails clients

/**
 * =============================================================================
 * 🌍 INTERNATIONALISATION (I18N) & MONNAIE
 * =============================================================================
 * Configuration des langues, devises et détections géographiques.
 */

// --- Langues ---
export const SUPPORTED_LOCALES = ['en', 'fr'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE = 'en' as SupportedLocale;

// --- Devises ---
export const SUPPORTED_CURRENCIES = ['CAD', 'USD'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
export const DEFAULT_CURRENCY = 'CAD' as SupportedCurrency;
export const SITE_CURRENCY = DEFAULT_CURRENCY; // Devise active pour la boutique

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
 * Détection automatique de la devise par pays (Code ISO 3166-1 alpha-2).
 * Utilisé par le middleware pour personnaliser l'expérience.
 */
export const COUNTRY_TO_CURRENCY: Record<string, SupportedCurrency> = {
  US: 'USD',
  CA: 'CAD',
};

export const SUPPORTED_COUNTRIES = Object.keys(COUNTRY_TO_CURRENCY);

/**
 * Pays principal d'exploitation du site.
 * Déduit automatiquement de la devise active (SITE_CURRENCY).
 * Définit la règle "Un Site = Un Pays".
 */
const _mainCountryEntry = Object.entries(COUNTRY_TO_CURRENCY).find(
  ([_, curr]) => curr === SITE_CURRENCY
);
if (!_mainCountryEntry) {
  throw new Error(
    `Critical Configuration Error: SITE_CURRENCY "${SITE_CURRENCY}" has no matching country in COUNTRY_TO_CURRENCY table.`
  );
}
export const SITE_MAIN_COUNTRY = _mainCountryEntry[0];

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
 * Configuration technique globale pour les envois.
 */

export const SITE_ADDRESS = ''; // Sera récupéré dynamiquement depuis la DB

export const PHONE_PREFIX = '+1'; // Préfixe par défaut pour les formulaires d'adresse

export const SHIPPING_UNITS = {
  DISTANCE: 'cm',
  MASS: 'kg',
} as const;

/**
 * Filtre des transporteurs Shippo.
 * Laissez vide [] pour tout afficher, ou spécifiez ['ups', 'usps'].
 */
export const SHIPPING_PROVIDERS_FILTER: string[] = ['ups'];

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
export const STRIPE_AUTOMATIC_TAX = true;

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
