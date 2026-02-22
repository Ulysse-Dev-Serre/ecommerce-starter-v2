'use client';

import { useState } from 'react';

import { Loader2, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { trackEvent } from '@/lib/client/analytics';
import { addToCart } from '@/lib/client/cart';
import { cn } from '@/lib/utils/cn';

import { useToast } from '@/components/ui/toast-provider';

interface AddToCartButtonProps {
  variantId: string;
  productName: string;
  disabled?: boolean;
  fullWidth?: boolean;
  quantity?: number;
}

export function AddToCartButton({
  variantId,
  productName,
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
      await addToCart(variantId, quantity);

      // Tracking Marketing
      void trackEvent(
        'add_to_cart',
        {
          variantId,
          quantity,
          productName,
        },
        productName
      );

      showToast(tProduct('addedToCart', { count: quantity }), 'success');
      router.refresh();
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
      data-testid="add-to-cart-button"
      className={cn(
        'vibe-button-primary',
        fullWidth ? 'w-full h-12' : 'h-10 px-6'
      )}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <ShoppingCart className="h-5 w-5" />
      )}
      <span>{isLoading ? tProduct('adding') : label}</span>
    </button>
  );
}
