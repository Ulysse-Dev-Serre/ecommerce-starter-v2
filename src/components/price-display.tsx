'use client';

import {
  useCurrency,
  getPriceFromPricingArray,
  type Currency,
} from '@/hooks/use-currency';
import { formatPrice } from '@/lib/utils/currency';
import { useLocale } from 'next-intl';
import { SupportedCurrency } from '@/lib/constants';

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
  const { currency, isLoaded } = useCurrency();

  if (!isLoaded) {
    return <span className={className}>--</span>;
  }

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
        <span className="vibe-text-xs vibe-text-muted vibe-ml-1">
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
  const { currency, isLoaded } = useCurrency();

  if (!isLoaded) {
    return <span className={className}>--</span>;
  }

  const total = items.reduce((sum, item) => {
    const { price } = getPriceFromPricingArray(item.pricing, currency);
    return sum + parseFloat(price) * item.quantity;
  }, 0);

  const formattedTotal = formatPrice(total, currency, currentLocale);

  return <span className={className}>{formattedTotal}</span>;
}
