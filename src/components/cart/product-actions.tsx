'use client';

import { useState } from 'react';
import { ShoppingCart, Zap, Plus, Minus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '../ui/toast-provider';
import { trackEvent } from '@/lib/client/analytics';

import { API_ROUTES } from '@/lib/config/api-routes';
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
        showToast(t('addedToCart', { count: quantity }), 'success');
        void trackEvent(
          ANALYTICS_EVENTS.ADD_TO_CART,
          { variantId, quantity, productName },
          productName
        );
        router.refresh();
      } else {
        throw new Error('Failed to add to cart');
      }
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
    <div className={compact ? 'vibe-stack-y-3' : 'vibe-stack-y-6'}>
      {showQuantitySelector && (
        <div className="vibe-flex-items-center-gap-4">
          {!compact && (
            <span className="vibe-text-xs-bold-muted-caps">
              {tCommon('quantity')}
            </span>
          )}
          <div className="vibe-quantity-selector">
            <button
              onClick={decrementQuantity}
              disabled={disabled || quantity <= 1}
              className="vibe-quantity-btn"
            >
              <Minus className="vibe-icon-xxs" />
            </button>
            <span className="vibe-text-center-mono">{quantity}</span>
            <button
              onClick={incrementQuantity}
              disabled={disabled || quantity >= maxQuantity}
              className="vibe-quantity-btn"
            >
              <Plus className="vibe-icon-xxs" />
            </button>
          </div>
        </div>
      )}

      <div className={compact ? 'vibe-flex-col-gap-3' : 'vibe-flex-row-gap-3'}>
        <button
          onClick={handleAddToCart}
          disabled={disabled || isAddingToCart || isBuyingNow}
          className="vibe-button-primary vibe-flex-grow vibe-btn-sm-h10"
        >
          {isAddingToCart ? (
            <Loader2 className="vibe-icon-sm vibe-icon-spin" />
          ) : (
            <ShoppingCart className="vibe-icon-sm" />
          )}
          <span>{isAddingToCart ? t('adding') : t('addToCart')}</span>
        </button>

        <button
          onClick={handleBuyNow}
          disabled={disabled || isAddingToCart || isBuyingNow}
          className="vibe-button-buy-now vibe-flex-grow vibe-btn-sm-h10"
        >
          {isBuyingNow ? (
            <Loader2 className="vibe-icon-sm vibe-icon-spin" />
          ) : (
            <Zap className="vibe-icon-sm fill-current" />
          )}
          <span>{isBuyingNow ? t('buying') : t('buyNow')}</span>
        </button>
      </div>
    </div>
  );
}
