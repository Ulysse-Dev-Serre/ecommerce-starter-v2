import { cookies } from 'next/headers';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { auth } from '@clerk/nextjs/server';

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { getCartPageData } from '@/lib/services/cart.service';
import { getCurrentUser } from '@/lib/services/user.service';

import { CartClient } from './cart-client';

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
  const anonymousId = cookieStore.get('cart_anonymous_id')?.value;

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

  const serializedCart = await getCartPageData(userId, anonymousId, locale);

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
    <div className="vibe-section-py vibe-flex-grow">
      <div className="vibe-layout-container">
        <h1 className="vibe-page-header">{t('title')}</h1>
        <CartClient cart={serializedCart} locale={locale} />
      </div>
    </div>
  );
}
