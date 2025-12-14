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
  locale: string = 'en-CA',
  showCurrencyCode: boolean = false
): string {
  const numericAmount =
    typeof amount === 'string' ? parseFloat(amount) : amount;

  if (showCurrencyCode) {
    // Format with currency code (default Intl behavior)
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: CURRENCY_DECIMALS[currency],
      maximumFractionDigits: CURRENCY_DECIMALS[currency],
    }).format(numericAmount);
  } else {
    // Format without currency code (just symbol and amount)
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: CURRENCY_DECIMALS[currency],
      maximumFractionDigits: CURRENCY_DECIMALS[currency],
      currencyDisplay: 'symbol',
    }).format(numericAmount);

    // Remove all currency codes/identifiers: "USD", "CAD", "EUR", "US", "CA", "EU"
    return formatted.replace(/\s?(USD|CAD|EUR|US|CA|EU)\s?/g, '').trim();
  }
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
