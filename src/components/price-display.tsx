'use client';

import { getPriceFromPricingArray } from '@/lib/utils/currency';
import { formatPrice } from '@/lib/utils/currency';
import { useLocale } from 'next-intl';
import { SupportedCurrency, SITE_CURRENCY } from '@/lib/config/site';

interface PriceDisplayProps {
  pricing: Array<{ price: string; currency: string }>;
  className?: string;
  locale?: string;
  showFallbackIndicator?: boolean;
}

export function PriceDisplay({
  pricing,
  className = '',
  locale,
  showFallbackIndicator = false,
}: PriceDisplayProps) {
  const defaultLocale = useLocale();
  const currentLocale = locale || defaultLocale;
  const currency = SITE_CURRENCY;

  const {
    price,
    currency: displayCurrency,
    isFallback,
  } = getPriceFromPricingArray(pricing, currency);

  const formattedPrice = formatPrice(
    parseFloat(price),
    displayCurrency as SupportedCurrency,
    currentLocale
  );

  return (
    <span className={className}>
      {formattedPrice}
      {showFallbackIndicator && isFallback && (
        <span className="vibe-text-xs text-muted-foreground ml-1">
          ({displayCurrency})
        </span>
      )}
    </span>
  );
}

interface PriceTotalProps {
  items: Array<{
    quantity: number;
    pricing: Array<{ price: string; currency: string }>;
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
