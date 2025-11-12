'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

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

  const updateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > maxQuantity) return;

    setQuantity(newQuantity);

    if (cartItemId) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/cart/lines/${cartItemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quantity: newQuantity,
          }),
        });

        if (response.ok) {
          router.refresh();
        } else {
          setQuantity(initialQuantity);
        }
      } catch (error) {
        console.error('Failed to update quantity:', error);
        setQuantity(initialQuantity);
      } finally {
        setIsLoading(false);
      }
    }

    if (onQuantityChange) {
      onQuantityChange(newQuantity);
    }
  };

  const increment = () => {
    if (quantity < maxQuantity) {
      void updateQuantity(quantity + 1);
    }
  };

  const decrement = () => {
    if (quantity > 1) {
      void updateQuantity(quantity - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= maxQuantity) {
      void updateQuantity(value);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={decrement}
        disabled={quantity <= 1 || isLoading}
        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={
          locale === 'fr' ? 'Diminuer la quantité' : 'Decrease quantity'
        }
      >
        −
      </button>
      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        disabled={isLoading}
        className="w-16 h-8 text-center border border-gray-300 rounded disabled:opacity-50"
        min="1"
        max={maxQuantity}
      />
      <button
        type="button"
        onClick={increment}
        disabled={quantity >= maxQuantity || isLoading}
        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={
          locale === 'fr' ? 'Augmenter la quantité' : 'Increase quantity'
        }
      >
        +
      </button>
    </div>
  );
}
