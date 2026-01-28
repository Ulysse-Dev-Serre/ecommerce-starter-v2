'use client';

import { API_ROUTES } from '@/lib/constants/api-routes';
import { useToast } from '@/components/ui/toast-provider';

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

  const { showToast } = useToast();

  const handleRemove = async (itemId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ROUTES.CART.LINES(itemId), {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast(t('itemRemoved'), 'success');
        router.refresh();
      } else {
        throw new Error(t('errorRemovingItem'));
      }
    } catch (error) {
      showToast(t('errorRemovingItem'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="vibe-empty-state">
        <ShoppingCart className="vibe-empty-state-icon" />
        <p className="vibe-empty-state-title">{t('emptyCart')}</p>
        <Link href={`/${locale}/shop`} className="vibe-empty-state-button">
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
      <div className="vibe-grid-main">
        <div className="vibe-list-stack">
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

      <div className="vibe-grid-side">
        <CartSummary
          items={summaryItems}
          locale={locale}
          isSignedIn={!!isSignedIn}
        />
      </div>
    </div>
  );
}
