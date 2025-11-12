'use client';

import { useState } from 'react';

import { AddToCartButton } from '@/components/cart/add-to-cart-button';
import { QuantitySelector } from '@/components/cart/quantity-selector';

interface ProductClientProps {
  variantId: string;
  locale: string;
  disabled: boolean;
  stock: number;
}

export function ProductClient({
  variantId,
  locale,
  disabled,
  stock,
}: ProductClientProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">
          {locale === 'fr' ? 'Quantité' : 'Quantity'}:
        </span>
        <QuantitySelector
          initialQuantity={1}
          maxQuantity={stock}
          onQuantityChange={setQuantity}
          locale={locale}
        />
      </div>

      <AddToCartButton
        variantId={variantId}
        locale={locale}
        fullWidth
        disabled={disabled}
        quantity={quantity}
      />
    </div>
  );
}
