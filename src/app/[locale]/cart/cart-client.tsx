'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { useRouter } from 'next/navigation';
import { useUser, SignInButton } from '@clerk/nextjs';

import { QuantitySelector } from '@/components/cart/quantity-selector';
import { PriceDisplay, PriceTotal } from '@/components/price-display';

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
  const { isSignedIn } = useUser();

  /* Translations now managed by next-intl hook */
  const t = useTranslations('cart');

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

  /* handleCheckout removed */

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-xl text-muted-foreground mb-6">{t('emptyCart')}</p>
        <a
          href={`/${locale}/shop`}
          className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors"
        >
          {t('continueShopping')}
        </a>
      </div>
    );
  }

  const itemsForTotal = cart.items.map(item => ({
    quantity: item.quantity,
    pricing: item.variant.pricing,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {cart.items.map(item => {
          const translation = item.variant.product.translations[0];
          const image = item.variant.product.media[0]?.url;

          return (
            <div
              key={item.id}
              className="flex gap-4 border border-border rounded-lg p-4"
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
                <p className="text-sm text-muted-foreground mb-2">
                  SKU: {item.variant.sku}
                </p>
                <PriceDisplay
                  pricing={item.variant.pricing}
                  className="text-lg font-bold mb-3 block"
                  locale={locale}
                />
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {t('quantity')}:
                  </span>
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
                  className="text-error hover:text-error/80 text-sm disabled:opacity-50"
                >
                  {t('remove')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="lg:col-span-1">
        <div className="border border-border rounded-lg p-6 sticky top-4">
          <h2 className="text-xl font-bold mb-4">{t('total')}</h2>
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-semibold">Total</span>
              <PriceTotal
                items={itemsForTotal}
                className="text-2xl font-bold"
                locale={locale}
              />
            </div>
            {isSignedIn ? (
              <a
                href={`/${locale}/checkout`}
                className="w-full block text-center bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary-hover transition-colors"
              >
                {t('checkout')}
              </a>
            ) : (
              <SignInButton mode="modal">
                <button className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg hover:bg-primary-hover transition-colors">
                  {t('signInToCheckout')}
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
