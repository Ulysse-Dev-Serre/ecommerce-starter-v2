import { env } from '@/lib/env';
import { SupportedCurrency } from '@/lib/types/currency';

export type Currency = SupportedCurrency;

const DEFAULT_CURRENCY: Currency =
  (env.NEXT_PUBLIC_CURRENCY as Currency) || 'CAD';

function getCurrencyFromEnv(): Currency {
  const envCurrency = env.NEXT_PUBLIC_CURRENCY;
  return (envCurrency as Currency) || DEFAULT_CURRENCY;
}

export function useCurrency() {
  const currency = getCurrencyFromEnv();

  const setCurrency = (newCurrency: Currency) => {
    document.cookie = `currency=${newCurrency}; path=/; max-age=31536000`; // 1 year
    window.location.reload();
  };

  return { currency, setCurrency, isLoaded: true };
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

  // 1. Essayer la devise demandée
  const requestedPrice = currency === 'USD' ? prices.priceUSD : prices.priceCAD;
  if (requestedPrice != null && parseFloat(String(requestedPrice)) > 0) {
    return { price: String(requestedPrice), currency, isFallback: false };
  }

  // 2. Fallback sur l'autre devise principale (CAD <-> USD)
  const fallbackCurrency = currency === 'USD' ? 'CAD' : 'USD';
  const fallbackPrice = currency === 'USD' ? prices.priceCAD : prices.priceUSD;

  if (fallbackPrice != null && parseFloat(String(fallbackPrice)) > 0) {
    return {
      price: String(fallbackPrice),
      currency: fallbackCurrency,
      isFallback: true,
    };
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
