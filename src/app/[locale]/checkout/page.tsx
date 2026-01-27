import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

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

  return (
    <div className="bg-background min-h-screen pb-12">
      <CheckoutClient
        cartId={currentCartId}
        locale={locale}
        initialTotal={initialTotal}
        currency={currency}
        userEmail={userEmail}
        summaryItems={summaryItems}
      />
    </div>
  );
}
