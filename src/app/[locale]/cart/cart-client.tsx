'use client';

import { removeFromCart } from '@/lib/client/cart';
import { useToast } from '@/components/ui/toast-provider';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { ShoppingCart } from 'lucide-react';

import { CartItem } from '@/components/cart/cart-item';
import { CartSummary } from '@/components/cart/cart-summary';
import { NAV_ROUTES } from '@/lib/config/nav-routes';

import { Cart } from '@/lib/types/ui/cart';

interface CartClientProps {
  cart: Cart | null;
  locale: string;
}

export function CartClient({ cart, locale }: CartClientProps) {
  const router = useRouter();
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const { isSignedIn } = useUser();
  const t = useTranslations('cart');

  const { showToast } = useToast();

  const handleRemove = async (itemId: string) => {
    setLoadingItems(prev => new Set(prev).add(itemId));
    try {
      await removeFromCart(itemId);
      showToast(t('itemRemoved'), 'success');
      router.refresh();
    } catch (error) {
      showToast(t('errorRemovingItem'), 'error');
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-20 bg-background border border-dashed border-border rounded-3xl mx-auto max-w-2xl px-6">
        <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <p className="text-2xl font-bold mb-8 text-foreground">
          {t('emptyCart')}
        </p>
        <Link
          href={`/${locale}${NAV_ROUTES.SHOP}`}
          className="vibe-button-primary px-8 py-3 text-base"
        >
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      <div className="lg:col-span-8 space-y-6">
        <div className="flex flex-col gap-4">
          {cart.items.map(item => (
            <CartItem
              key={item.id}
              item={item}
              locale={locale}
              onRemove={handleRemove}
              isLoading={loadingItems.has(item.id)}
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
