'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { API_ROUTES } from '@/lib/config/api-routes';
import { useToast } from '@/components/ui/toast-provider';

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
  const { showToast } = useToast();
  const tProduct = useTranslations('product');
  const tShop = useTranslations('shop');
  const tCommon = useTranslations('common');

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ROUTES.CART.LINES(), {
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
        showToast(tProduct('addedToCart', { count: quantity }), 'success');
        router.refresh();
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      showToast(tCommon('error'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const label = fullWidth ? tProduct('addToCart') : tShop('addToCart');

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || isLoading}
      className={cn(
        'vibe-button-primary',
        fullWidth ? 'vibe-btn-full-lg' : 'vibe-btn-sm-h10'
      )}
    >
      {isLoading ? (
        <Loader2 className="vibe-icon-sm vibe-icon-spin" />
      ) : (
        <ShoppingCart className="vibe-icon-sm" />
      )}
      <span>{isLoading ? tProduct('adding') : label}</span>
    </button>
  );
}
