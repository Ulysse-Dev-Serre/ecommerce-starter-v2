'use client';

import {
  useCurrency,
  getPriceFromPricingArray,
  type Currency,
} from '@/hooks/use-currency';
import { formatPrice } from '@/lib/utils/currency';

interface PriceDisplayProps {
  pricing: Array<{ price: string; currency: string }>;
  className?: string;
  locale?: string;
  showFallbackIndicator?: boolean;
}

export function PriceDisplay({
  pricing,
  className = '',
  locale = 'fr',
  showFallbackIndicator = false,
}: PriceDisplayProps) {
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
    displayCurrency as 'CAD' | 'USD',
    locale === 'fr' ? 'fr-CA' : 'en-CA',
    false
  );

  return (
    <span className={className}>
      {formattedPrice}
      <span className="text-xs italic font-light text-gray-600 ml-1">
        {displayCurrency}
      </span>
      {showFallbackIndicator && isFallback && (
        <span className="text-xs text-muted-foreground ml-1">(fallback)</span>
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

export function PriceTotal({
  items,
  className = '',
  locale = 'fr',
}: PriceTotalProps) {
  const { currency, isLoaded } = useCurrency();

  if (!isLoaded) {
    return <span className={className}>--</span>;
  }

  const total = items.reduce((sum, item) => {
    const { price } = getPriceFromPricingArray(item.pricing, currency);
    return sum + parseFloat(price) * item.quantity;
  }, 0);

  const formattedTotal = formatPrice(
    total,
    currency,
    locale === 'fr' ? 'fr-CA' : 'en-CA',
    false
  );

  return <span className={className}>{formattedTotal}</span>;
}
