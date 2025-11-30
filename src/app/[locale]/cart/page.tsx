import { cookies } from 'next/headers';

import { auth } from '@clerk/nextjs/server';

import { Language } from '@/generated/prisma';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

import { CartClient } from './cart-client';

export const dynamic = 'force-dynamic';

interface CartPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CartPage({
  params,
}: CartPageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  const language = locale.toUpperCase() as Language;

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

  let userId: string | undefined;
  if (clerkId) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    userId = user?.id;
  }

  const cart =
    userId || anonymousId
      ? await prisma.cart.findFirst({
          where: userId
            ? { userId, status: 'ACTIVE' }
            : { anonymousId, status: 'ACTIVE' },
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    pricing: {
                      where: { isActive: true, priceType: 'base' },
                      orderBy: { validFrom: 'desc' },
                      take: 1,
                    },
                    product: {
                      include: {
                        translations: {
                          where: { language },
                        },
                        media: {
                          where: { isPrimary: true },
                          take: 1,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        })
      : null;

  logger.info(
    {
      action: 'cart_query_result',
      cartId: cart?.id ?? null,
      cartStatus: cart?.status ?? null,
      itemsCount: cart?.items?.length ?? 0,
    },
    'Cart query completed'
  );

  const serializedCart = cart
    ? {
        ...cart,
        items: cart.items.map(item => ({
          ...item,
          variant: {
            ...item.variant,
            pricing: item.variant.pricing.map(p => ({
              ...p,
              price: p.price.toString(),
            })),
          },
        })),
      }
    : null;

  return (
    <div className="flex-1 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">
          {locale === 'fr' ? 'Panier' : 'Cart'}
        </h1>
        <CartClient cart={serializedCart} locale={locale} />
      </div>
    </div>
  );
}
