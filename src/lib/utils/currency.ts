import type { Decimal } from '@prisma/client/runtime/library';

import { SupportedCurrency } from '@/lib/config/site';

export const CURRENCY_DECIMALS: Record<string, number> = {
  CAD: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
  CLP: 0,
};

/**
 * Formate un prix de manière localisée.
 * @param amount - Montant (number, string ou Decimal Prisma)
 * @param currency - Devise (ex: CAD, USD, EUR)
 * @param locale - Langue (ex: 'fr', 'en')
 * @param showCurrencyCode - Si true, affiche le code (ex: CAD 10.00)
 */
export function formatPrice(
  amount: number | string | Decimal,
  currency: SupportedCurrency,
  locale: string,
  showCurrencyCode: boolean = false
): string {
  if (!currency) {
    throw new Error(
      `CURRENCY_ERROR: La devise est manquante dans formatPrice. Vérifiez la configuration.`
    );
  }

  // Conversion sécurisée des types
  const numericAmount =
    typeof amount === 'object' && amount !== null && 'toNumber' in amount
      ? (amount as any).toNumber()
      : typeof amount === 'string'
        ? parseFloat(amount)
        : amount;

  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  };

  if (!showCurrencyCode) {
    options.currencyDisplay = 'symbol';
  } else {
    options.currencyDisplay = 'code';
  }

  const formatted = new Intl.NumberFormat(locale, options).format(
    numericAmount
  );

  if (!showCurrencyCode) {
    // Supprime les codes pays/devise superflus (ex: "CA$", "US$", "CLP$") pour ne garder que le symbole
    // Cette regex cherche des séquences de 2-3 lettres majuscules collées au symbole ou séparées par un espace
    return formatted.replace(/[A-Z]{2,3}\s?\$|\$\s?[A-Z]{2,3}/g, '$').trim();
  }

  return formatted;
}

/**
 * Interface pour les données de prix structurées par code de devise.
 * Exemple: { CAD: 10, USD: 8 }
 */
export interface PriceData {
  [currencyCode: string]: string | number | null | undefined;
}

/**
 * Récupère le prix pour une devise donnée avec logique de fallback.
 */
import { SITE_CURRENCY } from '@/lib/config/site';

export function getPriceForCurrency(
  prices: PriceData,
  requestedCurrency: SupportedCurrency
): { price: string; currency: SupportedCurrency; isFallback: boolean } {
  // 1. Essayer la devise demandée
  const requestedPrice = prices[requestedCurrency];
  if (requestedPrice != null && parseFloat(String(requestedPrice)) > 0) {
    return {
      price: String(requestedPrice),
      currency: requestedCurrency,
      isFallback: false,
    };
  }

  // 2. Fallback sur la devise par défaut du site s'il y a un prix
  if (
    requestedCurrency !== SITE_CURRENCY &&
    prices[SITE_CURRENCY] != null &&
    parseFloat(String(prices[SITE_CURRENCY])) > 0
  ) {
    return {
      price: String(prices[SITE_CURRENCY]),
      currency: SITE_CURRENCY as SupportedCurrency,
      isFallback: true,
    };
  }

  // 3. Fallback sur n'importe quel premier prix disponible
  const availableCurrencies = Object.keys(prices).filter(
    curr => prices[curr] != null && parseFloat(String(prices[curr])) > 0
  );

  if (availableCurrencies.length > 0) {
    const firstCurrency = availableCurrencies[0];
    return {
      price: String(prices[firstCurrency]),
      currency: firstCurrency as SupportedCurrency,
      isFallback: true,
    };
  }

  return { price: '0', currency: requestedCurrency, isFallback: false };
}

/**
 * Utilitaire pour extraire le prix depuis un tableau de prix (format Prisma)
 */
export function getPriceFromPricingArray(
  pricing: Array<{ price: any; currency: string }>,
  requestedCurrency: SupportedCurrency
): { price: string; currency: SupportedCurrency; isFallback: boolean } {
  const priceMap: PriceData = {};
  pricing.forEach(p => {
    priceMap[p.currency] = p.price;
  });

  return getPriceForCurrency(priceMap, requestedCurrency);
}

/**
 * Convertit un montant d'une devise source vers une devise cible.
 * Utilise les taux de conversion définis dans la configuration du site.
 */
import { CAD_TO_USD_RATE } from '@/lib/config/site';

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // CAD -> USD
  if (fromCurrency === 'CAD' && toCurrency === 'USD') {
    return amount * CAD_TO_USD_RATE;
  }

  // Ajoutez d'autres paires de devises ici si nécessaire
  // Ex: USD -> CAD, EUR -> USD, etc.

  // Si aucune conversion n'est trouvée, lever une erreur ou retourner le montant original (selon la stratégie)
  // Ici on lève une erreur pour éviter les pertes financières silencieuses
  throw new Error(
    `CONVERSION_ERROR: Taux de conversion introuvable pour ${fromCurrency} -> ${toCurrency}`
  );
}
