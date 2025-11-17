'use client';

import { useState, useEffect, useRef } from 'react';

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
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSentQuantity = useRef<number>(initialQuantity);

  console.log('[DEBUG] Component render:', {
    quantity,
    initialQuantity,
    lastSentQuantity: lastSentQuantity.current,
  });

  const handleQuantityChange = (newQuantity: number) => {
    console.log('[DEBUG] handleQuantityChange appelé:', newQuantity);
    if (newQuantity < 1 || newQuantity > maxQuantity) return;
    setQuantity(newQuantity);

    if (onQuantityChange) {
      onQuantityChange(newQuantity);
    }
  };

  useEffect(() => {
    console.log('[DEBUG] useEffect déclenché:', {
      quantity,
      lastSentQuantity: lastSentQuantity.current,
      cartItemId,
    });

    if (debounceTimeout.current) {
      console.log('[DEBUG] Annulation du timer précédent');
      clearTimeout(debounceTimeout.current);
    }

    if (quantity === lastSentQuantity.current || !cartItemId) {
      console.log('[DEBUG] Pas de changement ou pas de cartItemId, skip');
      return;
    }

    console.log('[DEBUG] Démarrage timer 1200ms pour quantity:', quantity);
    debounceTimeout.current = setTimeout(async () => {
      console.log(
        '[DEBUG] Timer expiré ! Envoi PUT au backend pour quantity:',
        quantity
      );
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
          console.log(
            '[DEBUG] PUT réussi, mise à jour lastSentQuantity et appel router.refresh()'
          );
          lastSentQuantity.current = quantity;
          router.refresh();
        } else {
          console.log('[DEBUG] PUT échoué, retour à lastSentQuantity');
          setQuantity(lastSentQuantity.current);
        }
      } catch (error) {
        console.error('[DEBUG] Erreur PUT:', error);
        setQuantity(lastSentQuantity.current);
      } finally {
        setIsLoading(false);
      }
    }, 1200);

    return () => {
      if (debounceTimeout.current) {
        console.log('[DEBUG] Cleanup: annulation timer');
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [quantity, cartItemId]);

  const increment = () => {
    console.log('[DEBUG] Bouton + cliqué');
    if (quantity < maxQuantity) {
      handleQuantityChange(quantity + 1);
    }
  };

  const decrement = () => {
    console.log('[DEBUG] Bouton - cliqué');
    if (quantity > 1) {
      handleQuantityChange(quantity - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    console.log('[DEBUG] Input changé:', value);
    if (!isNaN(value) && value >= 1 && value <= maxQuantity) {
      handleQuantityChange(value);
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
