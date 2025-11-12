export type SupportedCurrency = 'CAD' | 'USD' | 'EUR';

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  CAD: '$',
  USD: '$',
  EUR: '€',
};

export const CURRENCY_DECIMALS: Record<SupportedCurrency, number> = {
  CAD: 2,
  USD: 2,
  EUR: 2,
};

export function formatPrice(
  amount: number | string,
  currency: SupportedCurrency = 'CAD',
  locale: string = 'en-CA'
): string {
  const numericAmount =
    typeof amount === 'string' ? parseFloat(amount) : amount;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: CURRENCY_DECIMALS[currency],
    maximumFractionDigits: CURRENCY_DECIMALS[currency],
  }).format(numericAmount);
}

export function toStripeAmount(
  amount: number | string,
  currency: SupportedCurrency = 'CAD'
): number {
  const numericAmount =
    typeof amount === 'string' ? parseFloat(amount) : amount;
  const decimals = CURRENCY_DECIMALS[currency];
  return Math.round(numericAmount * Math.pow(10, decimals));
}

export function fromStripeAmount(
  stripeAmount: number,
  currency: SupportedCurrency = 'CAD'
): number {
  const decimals = CURRENCY_DECIMALS[currency];
  return stripeAmount / Math.pow(10, decimals);
}
