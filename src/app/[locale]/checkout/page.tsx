import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { cookies } from 'next/headers';

import { getOrCreateCart } from '@/lib/services/cart.service';
import { CheckoutClient } from '@/components/checkout/checkout-client';
import { Language } from '@/generated/prisma';
import { prisma } from '@/lib/db/prisma';

interface CheckoutPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CheckoutPage({
  params,
}: CheckoutPageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Checkout' });
  const { userId: clerkId } = await auth();

  // Résolution du User ID local (Prisma) à partir du Clerk ID
  let userId: string | undefined;
  if (clerkId) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    userId = user?.id;
  }

  const cookieStore = await cookies();
  const anonymousId = cookieStore.get('cart_anonymous_id')?.value;

  // On récupère le panier pour avoir le total inital
  // (Même si on recalculera tout côté client, c'est bien d'avoir l'état initial)
  if (!userId && !anonymousId) {
    // Pas de session, on redirige vers le panier (vide)
    // ou on laisse faire et getOrCreateCart throw ? Non on évite le crash.
    return (
      <div className="p-8 text-center">
        Redirecting to cart...
        <meta httpEquiv="refresh" content={`0; url = /${locale}/cart`} />
      </div>
    );
  }

  const cart = await getOrCreateCart(userId, anonymousId);

  if (!cart || cart.items.length === 0) {
    // Si panier vide, on redirige ou on affiche une erreur (géré par le client ou redirect serveur)
    // Pour l'instant on laisse le client gérer ou on render null
  }

  // On prépare les props pour le client
  // Le client devra initialiser Stripe Elements

  const clientTranslations = {
    title: t('title'),
    shippingAddress: t('shippingAddress'),
    shippingMethod: t('shippingMethod'),
    payment: t('payment'),
    payNow: t('payNow'),
    loading: t('loading'),
    error: t('error'),
    orderSummary: t('orderSummary'),
    subtotal: t('subtotal'),
    shipping: t('shipping'),
    totalToPay: t('totalToPay'),
    confirmAddress: t('confirmAddress'),
    calculating: t('calculating'),
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <CheckoutClient
        cartId={cart.id}
        locale={locale}
        initialTotal={Number(
          cart.items.reduce((acc, item) => {
            // Find price matching cart currency
            const priceRecord =
              item.variant.pricing.find(
                p => p.currency === cart.currency && p.isActive
              ) || item.variant.pricing.find(p => p.currency === cart.currency);

            const price = priceRecord?.price || 0;
            return acc + Number(price) * item.quantity;
          }, 0)
        )}
        currency={cart.currency}
        translations={clientTranslations}
      />
    </div>
  );
}
