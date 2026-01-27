'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, ShoppingCart } from 'lucide-react';

interface AddToCartButtonProps {
  variantId: string;
  locale: string;
  disabled?: boolean;
  fullWidth?: boolean;
  quantity?: number;
}

export function AddToCartButton({
  variantId,
  locale,
  disabled,
  fullWidth,
  quantity = 1,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cart/lines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variantId,
          quantity,
        }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tProducts = useTranslations('products');
  const tShop = useTranslations('shop');

  const label = fullWidth ? tProducts('addToCart') : tShop('addToCart');

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || isLoading}
      className={`vibe-button-primary ${fullWidth ? 'w-full h-12' : 'h-10 px-6'}`}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <ShoppingCart className="h-5 w-5" />
      )}
      <span>{isLoading ? tProducts('adding') : label}</span>
    </button>
  );
}
