import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { cookies } from 'next/headers';

import { CheckoutService } from '@/lib/services/checkout.service';
import { CheckoutClient } from '@/components/checkout/checkout-client';
import { getCurrentUser } from '@/lib/services/user.service';
import { NAV_ROUTES } from '@/lib/config/nav-routes';

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

  const t = await getTranslations({ locale, namespace: 'checkout' });

  const user = await getCurrentUser();
  const userId = user?.id;
  const userEmail = user?.email; // Use email directly from user object

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
    redirect(`/${locale}${NAV_ROUTES.CART}`);
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
    <div className="vibe-section-py vibe-flex-grow">
      <div className="vibe-layout-container">
        <h1 className="vibe-page-header">{t('title')}</h1>
        <CheckoutClient
          cartId={currentCartId}
          locale={locale}
          initialTotal={initialTotal}
          currency={currency}
          userEmail={userEmail}
          summaryItems={summaryItems}
        />
      </div>
    </div>
  );
}
