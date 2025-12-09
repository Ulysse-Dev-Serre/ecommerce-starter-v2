'use client';

export type Currency = 'CAD' | 'USD';

const DEFAULT_CURRENCY: Currency = 'CAD';

function getCurrencyFromEnv(): Currency {
  const envCurrency = process.env.NEXT_PUBLIC_CURRENCY;
  return envCurrency === 'CAD' || envCurrency === 'USD'
    ? envCurrency
    : DEFAULT_CURRENCY;
}

export function useCurrency() {
  const currency = getCurrencyFromEnv();

  return { currency, isLoaded: true };
}

export interface PriceData {
  priceCAD?: string | number | null;
  priceUSD?: string | number | null;
}

export function getPriceForCurrency(
  prices: PriceData,
  currency: Currency
): { price: string; currency: Currency; isFallback: boolean } {
  const cadPrice = prices.priceCAD != null ? String(prices.priceCAD) : null;
  const usdPrice = prices.priceUSD != null ? String(prices.priceUSD) : null;

  if (currency === 'USD') {
    if (usdPrice && parseFloat(usdPrice) > 0) {
      return { price: usdPrice, currency: 'USD', isFallback: false };
    }
    if (cadPrice && parseFloat(cadPrice) > 0) {
      return { price: cadPrice, currency: 'CAD', isFallback: true };
    }
  } else {
    if (cadPrice && parseFloat(cadPrice) > 0) {
      return { price: cadPrice, currency: 'CAD', isFallback: false };
    }
    if (usdPrice && parseFloat(usdPrice) > 0) {
      return { price: usdPrice, currency: 'USD', isFallback: true };
    }
  }

  return { price: '0', currency: currency, isFallback: false };
}

export function getPriceFromPricingArray(
  pricing: Array<{ price: string; currency: string }>,
  currency: Currency
): { price: string; currency: Currency; isFallback: boolean } {
  const cadPricing = pricing.find(p => p.currency === 'CAD');
  const usdPricing = pricing.find(p => p.currency === 'USD');

  return getPriceForCurrency(
    {
      priceCAD: cadPricing?.price,
      priceUSD: usdPricing?.price,
    },
    currency
  );
}
