'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { QuantitySelector } from '@/components/cart/quantity-selector';

interface CartItem {
  id: string;
  quantity: number;
  variant: {
    id: string;
    sku: string;
    pricing: Array<{
      price: string;
      currency: string;
    }>;
    product: {
      slug: string;
      translations: Array<{
        name: string;
      }>;
      media: Array<{
        url: string;
      }>;
    };
  };
}

interface Cart {
  id: string;
  items: CartItem[];
}

interface CartClientProps {
  cart: Cart | null;
  locale: string;
}

export function CartClient({ cart, locale }: CartClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const translations = {
    fr: {
      emptyCart: 'Votre panier est vide',
      continueShopping: 'Continuer vos achats',
      quantity: 'Quantité',
      remove: 'Supprimer',
      total: 'Total',
      checkout: 'Passer commande',
    },
    en: {
      emptyCart: 'Your cart is empty',
      continueShopping: 'Continue shopping',
      quantity: 'Quantity',
      remove: 'Remove',
      total: 'Total',
      checkout: 'Checkout',
    },
  };

  const t =
    translations[locale as keyof typeof translations] || translations.en;

  const handleRemove = async (itemId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cart/lines/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/${locale}/cart`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout');
      }

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(
        locale === 'fr' ? 'Échec de la commande' : 'Failed to start checkout'
      );
      setIsLoading(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-xl text-gray-600 mb-6">{t.emptyCart}</p>
        <a
          href={`/${locale}/shop`}
          className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
        >
          {t.continueShopping}
        </a>
      </div>
    );
  }

  const calculateTotal = () => {
    return cart.items.reduce((total, item) => {
      const price = parseFloat(item.variant.pricing[0]?.price || '0');
      return total + price * item.quantity;
    }, 0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {cart.items.map(item => {
          const translation = item.variant.product.translations[0];
          const image = item.variant.product.media[0]?.url;
          const price = item.variant.pricing[0];

          return (
            <div
              key={item.id}
              className="flex gap-4 border border-gray-200 rounded-lg p-4"
            >
              {image && (
                <img
                  src={image}
                  alt={translation?.name || ''}
                  className="w-24 h-24 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  {translation?.name || item.variant.sku}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  SKU: {item.variant.sku}
                </p>
                <p className="text-lg font-bold mb-3">
                  {price?.price || '0'} {price?.currency || 'CAD'}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{t.quantity}:</span>
                  <QuantitySelector
                    cartItemId={item.id}
                    initialQuantity={item.quantity}
                    locale={locale}
                  />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                >
                  {t.remove}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="lg:col-span-1">
        <div className="border border-gray-200 rounded-lg p-6 sticky top-4">
          <h2 className="text-xl font-bold mb-4">{t.total}</h2>
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">
                {calculateTotal().toFixed(2)} CAD
              </span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : t.checkout}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
