'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Minus, Plus, Loader2 } from 'lucide-react';
import { updateCartItem } from '@/lib/client/cart';
import { cn } from '@/lib/utils/cn';

interface QuantitySelectorProps {
  cartItemId?: string;
  initialQuantity: number;
  maxQuantity?: number;
  onQuantityChange?: (quantity: number) => void;
  locale: string;
}

export function QuantitySelector({
  cartItemId,
  initialQuantity,
  maxQuantity = 99,
  onQuantityChange,
  locale,
}: QuantitySelectorProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSentQuantity = useRef<number>(initialQuantity);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > maxQuantity) return;
    setQuantity(newQuantity);

    if (onQuantityChange) {
      onQuantityChange(newQuantity);
    }
  };

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (quantity === lastSentQuantity.current || !cartItemId) {
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        await updateCartItem(cartItemId, quantity);
        lastSentQuantity.current = quantity;
        router.refresh();
      } catch (error) {
        setQuantity(lastSentQuantity.current);
      } finally {
        setIsLoading(false);
      }
    }, 1200);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [quantity, cartItemId]);

  const increment = () => {
    if (quantity < maxQuantity) {
      handleQuantityChange(quantity + 1);
    }
  };

  const decrement = () => {
    if (quantity > 1) {
      handleQuantityChange(quantity - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= maxQuantity) {
      handleQuantityChange(value);
    }
  };

  const t = useTranslations('cart');

  return (
    <div className="flex items-center justify-center gap-2">
      <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border/50 h-10">
        <button
          type="button"
          onClick={decrement}
          disabled={quantity <= 1 || isLoading}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-foreground"
          aria-label={t('decreaseQuantity')}
          data-testid="quantity-decrease"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Minus className="h-3.5 w-3.5" />
          )}
        </button>

        <input
          type="number"
          value={quantity}
          onChange={handleInputChange}
          disabled={isLoading}
          className="w-10 text-center border-none focus:ring-0 font-bold text-sm bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          min="1"
          max={maxQuantity}
          data-testid="quantity-input"
        />

        <button
          type="button"
          onClick={increment}
          disabled={quantity >= maxQuantity || isLoading}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-foreground"
          aria-label={t('increaseQuantity')}
          data-testid="quantity-increase"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
