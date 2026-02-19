/**
 * Utilitaires pour Stripe
 * Fonctions spécifiques à l'intégration Stripe
 */

import { SupportedCurrency, CURRENCY_DECIMALS } from '@/lib/config/site';

/**
 * Convertit un montant en centimes pour Stripe
 * @param amount - Montant en devise (ex: 10.50)
 * @param currency - Code devise (CAD, USD, etc.)
 * @returns Montant en centimes (ex: 1050)
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
 * @param stripeAmount - Montant en centimes (ex: 1050)
 * @param currency - Code devise (CAD, USD, etc.)
 * @returns Montant en devise (ex: 10.50)
 */
export function fromStripeAmount(
  stripeAmount: number,
  currency: SupportedCurrency
): number {
  if (!currency) throw new Error('fromStripeAmount: currency is required');
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  return stripeAmount / Math.pow(10, decimals);
}
