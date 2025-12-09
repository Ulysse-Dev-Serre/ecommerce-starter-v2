'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

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

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || isLoading}
      className={`bg-[#7a7a7a] hover:bg-[#696969] text-white px-4 py-2 rounded text-sm disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${fullWidth ? 'w-full py-3 px-6 rounded-lg text-base' : ''}`}
    >
      {isLoading
        ? locale === 'fr'
          ? 'Ajout...'
          : 'Adding...'
        : locale === 'fr'
          ? fullWidth
            ? 'Ajouter au panier'
            : 'Ajouter'
          : fullWidth
            ? 'Add to cart'
            : 'Add'}
    </button>
  );
}
