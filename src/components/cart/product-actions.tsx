'use client';

import { useState } from 'react';
import { ShoppingCart, Zap, Plus, Minus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '../ui/toast-provider';
import { trackEvent } from '@/lib/analytics/tracker';

interface ProductActionsProps {
  variantId: string;
  productName: string;
  locale: string;
  disabled?: boolean;
  showQuantitySelector?: boolean;
  maxQuantity?: number;
  initialQuantity?: number;
  compact?: boolean;
}

export function ProductActions({
  variantId,
  productName,
  locale,
  disabled = false,
  showQuantitySelector = true,
  maxQuantity = 99,
  initialQuantity = 1,
  compact = false,
}: ProductActionsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const t = useTranslations('products');
  const tCommon = useTranslations('common');

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
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
        showToast(t('addedToCart', { count: quantity }), 'success');
        void trackEvent(
          'add_to_cart',
          { variantId, quantity, productName },
          productName
        );
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    setIsBuyingNow(true);
    try {
      void trackEvent(
        'begin_checkout',
        { variantId, quantity, productName, type: 'direct' },
        productName
      );
      router.push(
        `/${locale}/checkout?directVariantId=${variantId}&directQuantity=${quantity}`
      );
    } catch (error) {
      console.error('Failed to buy now:', error);
      showToast(tCommon('error'), 'error');
      setIsBuyingNow(false);
    }
  };

  const incrementQuantity = () => {
    if (quantity < maxQuantity) setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  return (
    <div className={`space-y-6 ${compact ? 'space-y-3' : ''}`}>
      {showQuantitySelector && (
        <div className="flex items-center gap-4">
          {!compact && (
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {tCommon('quantity')}
            </span>
          )}
          <div className="flex items-center bg-muted rounded-lg p-1 border border-border/50">
            <button
              onClick={decrementQuantity}
              disabled={disabled || quantity <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed text-foreground"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center font-bold text-foreground">
              {quantity}
            </span>
            <button
              onClick={incrementQuantity}
              disabled={disabled || quantity >= maxQuantity}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className={`flex gap-3 ${compact ? 'flex-col' : 'flex-row'}`}>
        <button
          onClick={handleAddToCart}
          disabled={disabled || isAddingToCart || isBuyingNow}
          className={`vibe-button-primary flex-1 h-12 ${compact ? 'h-10 text-xs' : ''}`}
        >
          {isAddingToCart ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ShoppingCart className="h-5 w-5" />
          )}
          <span>{isAddingToCart ? t('adding') : t('addToCart')}</span>
        </button>

        <button
          onClick={handleBuyNow}
          disabled={disabled || isAddingToCart || isBuyingNow}
          className={`vibe-button-secondary flex-1 h-12 bg-foreground text-background hover:opacity-90 ${compact ? 'h-10 text-xs' : ''}`}
        >
          {isBuyingNow ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Zap className="h-5 w-5 fill-current" />
          )}
          <span>{isBuyingNow ? t('buying') : t('buyNow')}</span>
        </button>
      </div>
    </div>
  );
}
