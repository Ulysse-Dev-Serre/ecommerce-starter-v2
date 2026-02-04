import { cookies } from 'next/headers';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { auth } from '@clerk/nextjs/server';

import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { getCartPageData } from '@/lib/services/cart';
import { getCurrentUser } from '@/lib/services/users';

import { CartClient } from './cart-client';
import { Cart } from '@/lib/types/ui/cart';
import { CART_COOKIE_NAME } from '@/lib/config/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

interface CartPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CartPage({
  params,
}: CartPageProps): Promise<React.ReactElement> {
  const { locale } = await params;

  const { userId: clerkId } = await auth();
  const cookieStore = await cookies();
  const anonymousId = cookieStore.get(CART_COOKIE_NAME)?.value;

  logger.info(
    {
      action: 'cart_page_load',
      clerkId: clerkId ?? null,
      anonymousId: anonymousId ?? null,
    },
    'Loading cart page'
  );

  const user = await getCurrentUser();
  const userId = user?.id;

  const serializedCart: Cart | null = await getCartPageData(
    userId,
    anonymousId,
    locale
  );

  logger.info(
    {
      action: 'cart_query_result',
      cartId: serializedCart?.id ?? null,
      itemsCount: serializedCart?.items?.length ?? 0,
    },
    'Cart query completed'
  );

  const t = await getTranslations({ locale, namespace: 'cart' });

  return (
    <div className="py-8 lg:py-12 flex-grow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
        <CartClient cart={serializedCart} locale={locale} />
      </div>
    </div>
  );
}
