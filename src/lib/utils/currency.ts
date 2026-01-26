import type { Decimal } from '@prisma/client/runtime/library';

import { SupportedCurrency } from '../constants';

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
 * Convertit un montant en centimes pour Stripe
 */
export function toStripeAmount(
  amount: number | string,
  currency: SupportedCurrency
): number {
  if (!currency) throw new Error('toStripeAmount: currency is required');
  const numericAmount =
    typeof amount === 'string' ? parseFloat(amount) : amount;
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  return Math.round(numericAmount * Math.pow(10, decimals));
}

/**
 * Convertit un montant Stripe (centimes) en nombre décimal
 */
export function fromStripeAmount(
  stripeAmount: number,
  currency: SupportedCurrency
): number {
  if (!currency) throw new Error('fromStripeAmount: currency is required');
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  return stripeAmount / Math.pow(10, decimals);
}
