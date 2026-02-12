'use client';

import { useState } from 'react';
import { ShoppingCart, Zap, Plus, Minus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '../ui/toast-provider';
import { trackEvent } from '@/lib/client/analytics';

import { addToCart } from '@/lib/client/cart';
import { NAV_ROUTES, CHECKOUT_URL_PARAMS } from '@/lib/config/nav-routes';
import { ANALYTICS_EVENTS } from '@/lib/config/analytics-events';

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

  const t = useTranslations('product');
  const tCommon = useTranslations('common');

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      await addToCart(variantId, quantity);
      showToast(t('addedToCart', { count: quantity }), 'success');
      void trackEvent(
        ANALYTICS_EVENTS.ADD_TO_CART,
        { variantId, quantity, productName },
        productName
      );
      router.refresh();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      showToast(tCommon('error'), 'error');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    setIsBuyingNow(true);
    try {
      void trackEvent(
        ANALYTICS_EVENTS.BEGIN_CHECKOUT,
        { variantId, quantity, productName, type: 'direct' },
        productName
      );
      router.push(
        `/${locale}${NAV_ROUTES.CHECKOUT}?${CHECKOUT_URL_PARAMS.DIRECT_VARIANT_ID}=${variantId}&${CHECKOUT_URL_PARAMS.DIRECT_QUANTITY}=${quantity}`
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
    <div className={compact ? 'space-y-3' : 'space-y-6'}>
      {showQuantitySelector && (
        <div className="flex items-center gap-4">
          {!compact && (
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {tCommon('quantity')}
            </span>
          )}
          <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border/50 h-10">
            <button
              onClick={decrementQuantity}
              disabled={disabled || quantity <= 1}
              data-testid="quantity-decrement"
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-foreground"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span
              className="w-10 text-center font-bold text-foreground"
              data-testid="quantity-display"
            >
              {quantity}
            </span>
            <button
              onClick={incrementQuantity}
              disabled={disabled || quantity >= maxQuantity}
              data-testid="quantity-increment"
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className={compact ? 'flex flex-col gap-3' : 'flex flex-row gap-3'}>
        <button
          onClick={handleAddToCart}
          disabled={disabled || isAddingToCart || isBuyingNow}
          data-testid="add-to-cart-button"
          className="vibe-button-primary flex-grow h-10 px-6"
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
          data-testid="buy-now-button"
          className="vibe-button-secondary bg-foreground text-background hover:opacity-90 flex-grow h-10 px-6"
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
