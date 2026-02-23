'use client';

import { useLocale } from 'next-intl';

import { SupportedCurrency, SITE_CURRENCY } from '@/lib/config/site';
import { getPriceFromPricingArray, formatPrice } from '@/lib/utils/currency';

interface PriceDisplayProps {
  pricing: Array<{ price: number; currency: string }>;
  className?: string;
  locale?: string;
  showFallbackIndicator?: boolean;
  dataTestId?: string;
}

export function PriceDisplay({
  pricing,
  className = '',
  locale,
  showFallbackIndicator: _showFallbackIndicator = false,
  dataTestId,
}: PriceDisplayProps) {
  const defaultLocale = useLocale();
  const currentLocale = locale || defaultLocale;
  const currency = SITE_CURRENCY;

  const { price, currency: displayCurrency } = getPriceFromPricingArray(
    pricing,
    currency
  );

  const formattedPrice = formatPrice(
    parseFloat(price),
    displayCurrency as SupportedCurrency,
    currentLocale
  );

  return (
    <span className={className} data-testid={dataTestId}>
      {formattedPrice}
    </span>
  );
}

interface PriceTotalProps {
  items: Array<{
    quantity: number;
    pricing: Array<{ price: number; currency: string }>;
  }>;
  className?: string;
  locale?: string;
}

export function PriceTotal({ items, className = '', locale }: PriceTotalProps) {
  const defaultLocale = useLocale();
  const currentLocale = locale || defaultLocale;
  const currency = SITE_CURRENCY;

  const total = items.reduce((sum, item) => {
    const { price } = getPriceFromPricingArray(item.pricing, currency);
    return sum + parseFloat(price) * item.quantity;
  }, 0);

  const formattedTotal = formatPrice(total, currency, currentLocale);

  return <span className={className}>{formattedTotal}</span>;
}
