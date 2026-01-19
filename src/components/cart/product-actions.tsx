'use client';

import { useState } from 'react';

import { ShoppingCart, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useToast } from '../ui/toast-provider';

interface ProductActionsProps {
  variantId: string;
  locale: string;
  disabled?: boolean;
  showQuantitySelector?: boolean;
  maxQuantity?: number;
  initialQuantity?: number;
  compact?: boolean;
}

export function ProductActions({
  variantId,
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

  const translations = {
    fr: {
      quantity: 'Quantité',
      addToCart: compact ? 'Ajouter' : 'Ajouter au panier',
      buyNow: compact ? 'Acheter' : 'Acheter maintenant',
      adding: 'Ajout...',
      buying: 'Achat...',
      addedToCart: (qty: number) =>
        `${qty} article${qty > 1 ? 's' : ''} ajouté${qty > 1 ? 's' : ''} au panier`,
    },
    en: {
      quantity: 'Quantity',
      addToCart: compact ? 'Add' : 'Add to cart',
      buyNow: compact ? 'Buy' : 'Buy now',
      adding: 'Adding...',
      buying: 'Buying...',
      addedToCart: (qty: number) =>
        `${qty} item${qty > 1 ? 's' : ''} added to cart`,
    },
  };

  const t =
    translations[locale as keyof typeof translations] || translations.en;

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
        showToast(t.addedToCart(quantity), 'success');
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
      // Redirection vers le checkout avec les paramètres pour l'achat direct
      router.push(
        `/${locale}/checkout?directVariantId=${variantId}&directQuantity=${quantity}`
      );
    } catch (error) {
      console.error('Failed to buy now:', error);
      showToast(
        locale === 'fr' ? "Erreur lors de l'achat" : 'Purchase failed',
        'error'
      );
      setIsBuyingNow(false);
    }
  };

  const incrementQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className={`space-y-4 ${compact ? 'space-y-2' : ''}`}>
      {showQuantitySelector && (
        <div className="flex items-center gap-3">
          {!compact && (
            <span className="text-sm font-medium text-gray-700">
              {t.quantity}:
            </span>
          )}
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={decrementQuantity}
              disabled={disabled || quantity <= 1}
              className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              -
            </button>
            <span className="px-4 py-2 min-w-12 text-center font-medium">
              {quantity}
            </span>
            <button
              onClick={incrementQuantity}
              disabled={disabled || quantity >= maxQuantity}
              className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
        </div>
      )}

      <div
        className={`flex gap-3 ${compact ? 'flex-col' : 'flex-row'} ${compact ? 'w-full' : ''}`}
      >
        <button
          onClick={handleAddToCart}
          disabled={disabled || isAddingToCart || isBuyingNow}
          className={`flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${compact ? 'text-sm px-4 py-2' : ''} ${compact ? 'w-full' : 'flex-1'}`}
        >
          {!compact && <ShoppingCart className="w-5 h-5" />}
          {isAddingToCart ? t.adding : t.addToCart}
        </button>

        <button
          onClick={handleBuyNow}
          disabled={disabled || isAddingToCart || isBuyingNow}
          className={`flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${compact ? 'text-sm px-4 py-2' : ''} ${compact ? 'w-full' : 'flex-1'}`}
        >
          {!compact && <Zap className="w-5 h-5" />}
          {isBuyingNow ? t.buying : t.buyNow}
        </button>
      </div>
    </div>
  );
}
