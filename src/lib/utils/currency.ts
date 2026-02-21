import {
  SupportedCurrency,
  CURRENCY_DECIMALS,
  EXCHANGE_RATES,
} from '@/lib/config/site';
import { AppError, ErrorCode } from '@/lib/types/api/errors';
import { toNum } from '@/lib/utils/number';

import { Prisma, Decimal } from '@/generated/prisma';

/**
 * Formate un prix de manière localisée.
 */
export function formatPrice(
  amount: number | string | Decimal,
  currency: SupportedCurrency,
  locale: string,
  showCurrencyCode: boolean = false
): string {
  if (!currency) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'CURRENCY_ERROR: La devise est manquante dans formatPrice. Vérifiez la configuration.',
      400
    );
  }

  const numericAmount = toNum(amount);
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  };

  options.currencyDisplay = showCurrencyCode ? 'code' : 'symbol';

  const formatted = new Intl.NumberFormat(locale, options).format(
    numericAmount
  );

  if (!showCurrencyCode) {
    // Nettoyage générique des symboles (remplace par le symbole seul si le code ISO est présent)
    return formatted.replace(/[A-Z]{2,3}\s?/g, '').trim();
  }

  return formatted;
}

/**
 * Interface pour les données de prix structurées par code de devise.
 */
export interface PriceData {
  [currencyCode: string]: string | number | Decimal | null | undefined;
}

/**
 * Récupère le prix pour une devise donnée.
 * ZERO FALLBACK POLICY: Lance une erreur si le prix est manquant pour la devise demandée.
 */
export function getPriceForCurrency(
  prices: PriceData,
  requestedCurrency: SupportedCurrency
): { price: string; currency: SupportedCurrency } {
  const price = prices[requestedCurrency];

  if (price != null && toNum(price) > 0) {
    return {
      price: String(price),
      currency: requestedCurrency,
    };
  }

  throw new AppError(
    ErrorCode.MISSING_REQUIRED_FIELD,
    `PRICING_ERROR: Aucun prix défini pour la devise ${requestedCurrency}. Zéro Fallback Policy activée.`,
    400
  );
}

/**
 * Utilitaire pour extraire le prix depuis un tableau de prix (format Prisma)
 */
export function getPriceFromPricingArray(
  pricing: Array<{ price: number | string | Decimal; currency: string }>,
  requestedCurrency: SupportedCurrency
): { price: string; currency: SupportedCurrency } {
  const priceMap: PriceData = {};
  pricing.forEach(p => {
    priceMap[p.currency] = p.price;
  });

  return getPriceForCurrency(priceMap, requestedCurrency);
}

/**
 * Convertit un montant d'une devise source vers une devise cible.
 * Utilise les taux de conversion centralisés.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rate = EXCHANGE_RATES[fromCurrency]?.[toCurrency];

  if (rate) {
    return amount * rate;
  }

  throw new AppError(
    ErrorCode.EXTERNAL_SERVICE_ERROR,
    `CONVERSION_ERROR: Taux de conversion introuvable pour ${fromCurrency} -> ${toCurrency}`,
    500
  );
}
