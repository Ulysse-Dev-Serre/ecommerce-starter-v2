'use client';

import { useState, useEffect, useCallback } from 'react';

export type Currency = 'CAD' | 'USD';

const CURRENCY_COOKIE_NAME = 'currency';
const DEFAULT_CURRENCY: Currency = 'CAD';

function getCurrencyFromCookie(): Currency {
  if (typeof document === 'undefined') return DEFAULT_CURRENCY;
  const match = document.cookie.match(
    new RegExp(`(^| )${CURRENCY_COOKIE_NAME}=([^;]+)`)
  );
  const value = match?.[2];
  return value === 'CAD' || value === 'USD' ? value : DEFAULT_CURRENCY;
}

function setCurrencyCookie(currency: Currency): void {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${CURRENCY_COOKIE_NAME}=${currency}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function useCurrency() {
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCurrencyState(getCurrencyFromCookie());
    setIsLoaded(true);

    const handleStorageChange = () => {
      setCurrencyState(getCurrencyFromCookie());
    };

    window.addEventListener('currency-change', handleStorageChange);
    return () =>
      window.removeEventListener('currency-change', handleStorageChange);
  }, []);

  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyCookie(newCurrency);
    setCurrencyState(newCurrency);
    window.dispatchEvent(new CustomEvent('currency-change'));
  }, []);

  return { currency, setCurrency, isLoaded };
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
