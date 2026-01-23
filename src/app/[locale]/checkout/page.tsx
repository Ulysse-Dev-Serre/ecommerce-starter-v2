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
  searchParams: Promise<{ directVariantId?: string; directQuantity?: string }>;
}

export default async function CheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  const { directVariantId, directQuantity } = await searchParams;

  const t = await getTranslations({ locale, namespace: 'Checkout' });
  const { userId: clerkId } = await auth();

  // Résolution du User ID local (Prisma) à partir du Clerk ID
  let userId: string | undefined;
  if (clerkId) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, email: true },
    });
    userId = user?.id;
  }
  let userEmail: string | undefined;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    userEmail = user?.email || undefined;
  }

  const cookieStore = await cookies();
  const anonymousId = cookieStore.get('cart_anonymous_id')?.value;
  const currency = cookieStore.get('currency')?.value || 'CAD';

  // Si achat direct, on calcule le total sans panier
  let initialTotal = 0;
  let currentCartId = '';

  // Préparation des items pour le résumé
  const summaryItems: Array<{
    name: string;
    quantity: number;
    price: number;
    currency: string;
    image?: string;
  }> = [];

  if (directVariantId && directQuantity) {
    // Mode Achat Direct
    currentCartId = 'direct_purchase'; // Placeholder, pas utilisé par CheckoutClient en mode direct

    const variant = await prisma.productVariant.findUnique({
      where: { id: directVariantId },
      include: {
        pricing: true,
        media: { take: 1, orderBy: { sortOrder: 'asc' } },
        product: {
          include: {
            translations: {
              where: { language: locale.toUpperCase() as Language },
            },
            media: { take: 1, orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    if (variant) {
      const priceRecord = variant.pricing.find(p => p.currency === currency);
      // Fallback USD si CAD manquant (ou vice versa) logic simple
      const price = Number(priceRecord?.price || 0);
      initialTotal = price * parseInt(directQuantity);

      // Image: Variante > Produit Principal
      const image = (variant.media[0]?.url ||
        (variant.product as any).media[0]?.url) as string | undefined;

      summaryItems.push({
        name:
          variant.product.translations[0]?.name ||
          variant.product.slug + (variant.sku ? ` (${variant.sku})` : ''),
        quantity: parseInt(directQuantity),
        price: price,
        currency: currency,
        image: image,
      });
    }
  } else {
    // Mode Panier Standard
    // On récupère le panier pour avoir le total inital
    if (!userId && !anonymousId) {
      return (
        <div className="p-8 text-center">
          Redirecting to cart...
          <meta httpEquiv="refresh" content={`0; url = /${locale}/cart`} />
        </div>
      );
    }

    const cart = await getOrCreateCart(userId, anonymousId);

    if (!cart || cart.items.length === 0) {
      // Si panier vide, on redirige vers le panier
      // Sauf si on vient d'ajouter un item (race condition?)
      // Pour l'instant on garde la redirection si vide
      return (
        <div className="p-8 text-center">
          Your cart is empty. Redirecting...
          <meta httpEquiv="refresh" content={`0; url = /${locale}/cart`} />
        </div>
      );
    }

    currentCartId = cart.id;
    initialTotal = Number(
      cart.items.reduce((acc, item) => {
        // Find price matching cart currency
        const priceRecord = item.variant.pricing.find(
          p => p.currency === cart.currency
        );

        const price = Number(priceRecord?.price || 0);

        // Image logic: getOrCreateCart returns variant.media (primary or take 1)
        const image = item.variant.media[0]?.url;

        summaryItems.push({
          name:
            item.variant.product.translations[0]?.name ||
            item.variant.product.slug,
          quantity: item.quantity,
          price: price,
          currency: cart.currency,
          image: image,
        });

        return acc + price * item.quantity;
      }, 0)
    );
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
    securePayment: t('securePayment'),
    fullName: t('fullName'),
    phone: t('phone'),
    addressLine1: t('addressLine1'),
    addressLine2: t('addressLine2'),
    city: t('city'),
    state: t('state'),
    zipCode: t('zipCode'),
    country: t('country'),
    selectState: t('selectState'),
    statePlaceholder: t('statePlaceholder'),
    validation: {
      phone: t('validation.phone'),
    },
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <CheckoutClient
        cartId={currentCartId}
        locale={locale}
        initialTotal={initialTotal}
        currency={currency}
        translations={clientTranslations}
        userEmail={userEmail}
        summaryItems={summaryItems}
      />
    </div>
  );
}
