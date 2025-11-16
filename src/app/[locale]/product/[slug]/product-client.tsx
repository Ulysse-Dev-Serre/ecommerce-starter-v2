'use client';

import { ProductActions } from '@/components/cart/product-actions';

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
  return (
    <ProductActions
      variantId={variantId}
      locale={locale}
      disabled={disabled}
      maxQuantity={stock}
      showQuantitySelector={true}
    />
  );
}
