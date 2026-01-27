import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, getMessages } from 'next-intl/server';

import { cookies } from 'next/headers';

import { CheckoutService } from '@/lib/services/checkout.service';
import { CheckoutClient } from '@/components/checkout/checkout-client';
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
  const messages = await getMessages({ locale });
  const geography = (messages as any).geography;
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
  // Appel au Service pour préparer les données du checkout
  const checkoutSummary = await CheckoutService.getCheckoutSummary({
    userId,
    anonymousId,
    locale,
    directVariantId,
    directQuantity,
  });

  // Si pas de résultat (ex: panier vide ou utilisateur non trouvé), redirection vers le panier
  if (!checkoutSummary) {
    redirect(`/${locale}/cart`);
  }

  const {
    currency,
    initialTotal,
    cartId: currentCartId,
    summaryItems,
  } = checkoutSummary;

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
    geography: geography,
  };

  return (
    <div className="bg-background min-h-screen pb-12">
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
