'use client';

import { useState, useEffect, useRef } from 'react';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

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
        const response = await fetch(`/api/cart/lines/${cartItemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quantity,
          }),
        });

        if (response.ok) {
          lastSentQuantity.current = quantity;
          router.refresh();
        } else {
          setQuantity(lastSentQuantity.current);
        }
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

  const t = useTranslations('cart'); // or common

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={decrement}
        disabled={quantity <= 1 || isLoading}
        className="w-10 h-10 flex items-center justify-center border border-border rounded-lg hover:bg-accent active:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-foreground font-bold text-lg"
        aria-label={t('quantity')}
      >
        −
      </button>
      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        disabled={isLoading}
        className="w-14 h-10 text-center border border-border bg-background rounded-lg disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-primary transition-shadow font-medium"
        min="1"
        max={maxQuantity}
      />
      <button
        type="button"
        onClick={increment}
        disabled={quantity >= maxQuantity || isLoading}
        className="w-10 h-10 flex items-center justify-center border border-border rounded-lg hover:bg-accent active:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-foreground font-bold text-lg"
        aria-label={t('quantity')}
      >
        +
      </button>
    </div>
  );
}
