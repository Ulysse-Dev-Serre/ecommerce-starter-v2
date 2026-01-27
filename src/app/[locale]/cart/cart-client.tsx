'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { ShoppingCart } from 'lucide-react';

import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';

interface CartItemData {
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
  items: CartItemData[];
}

interface CartClientProps {
  cart: Cart | null;
  locale: string;
}

export function CartClient({ cart, locale }: CartClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { isSignedIn } = useUser();
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

  if (!cart || cart.items.length === 0) {
    return (
      <div className="cart-empty-state">
        <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <p className="cart-empty-state-title">{t('emptyCart')}</p>
        <Link href={`/${locale}/shop`} className="cart-empty-state-button">
          {t('continueShopping')}
        </Link>
      </div>
    );
  }

  const summaryItems = cart.items.map(item => ({
    quantity: item.quantity,
    pricing: item.variant.pricing,
  }));

  return (
    <div className="vibe-grid-layout">
      <div className="lg:col-span-8 space-y-6">
        <div className="flex flex-col gap-4">
          {cart.items.map(item => (
            <CartItem
              key={item.id}
              item={item}
              locale={locale}
              onRemove={handleRemove}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>

      <div className="lg:col-span-4 h-full">
        <CartSummary
          items={summaryItems}
          locale={locale}
          isSignedIn={!!isSignedIn}
        />
      </div>
    </div>
  );
}
