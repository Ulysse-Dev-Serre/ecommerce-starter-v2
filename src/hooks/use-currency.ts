import { env } from '@/lib/core/env';
import { SupportedCurrency, SITE_CURRENCY } from '@/lib/config/site';

export type Currency = SupportedCurrency;

function getCurrencyFromEnv(): Currency {
  return SITE_CURRENCY;
}

export function useCurrency() {
  const currency = SITE_CURRENCY;

  const setCurrency = (newCurrency: Currency) => {
    document.cookie = `currency=${newCurrency}; path=/; max-age=31536000`; // 1 year
    window.location.reload();
  };

  return { currency, setCurrency, isLoaded: true };
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
export function getPriceForCurrency(
  prices: PriceData,
  requestedCurrency: Currency
): { price: string; currency: Currency; isFallback: boolean } {
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
      currency: SITE_CURRENCY as Currency,
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
      currency: firstCurrency as Currency,
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
  requestedCurrency: Currency
): { price: string; currency: Currency; isFallback: boolean } {
  const priceMap: PriceData = {};
  pricing.forEach(p => {
    priceMap[p.currency] = p.price;
  });

  return getPriceForCurrency(priceMap, requestedCurrency);
}
