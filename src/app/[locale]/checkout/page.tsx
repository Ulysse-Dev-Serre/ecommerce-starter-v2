import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { cookies } from 'next/headers';

import { getCheckoutSummary } from '@/lib/services/checkout';
import { CheckoutClient } from '@/components/checkout/checkout-client';
import { getCurrentUser } from '@/lib/services/users';
import { NAV_ROUTES, CHECKOUT_URL_PARAMS } from '@/lib/config/nav-routes';
import { CART_COOKIE_NAME } from '@/lib/config/site';

interface CheckoutPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function CheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  const searchParamsValue = await searchParams;
  const directVariantId =
    searchParamsValue[CHECKOUT_URL_PARAMS.DIRECT_VARIANT_ID];
  const directQuantity = searchParamsValue[CHECKOUT_URL_PARAMS.DIRECT_QUANTITY];

  const t = await getTranslations({ locale, namespace: 'checkout' });

  const user = await getCurrentUser();
  const userId = user?.id;
  const userEmail = user?.email; // Use email directly from user object

  const cookieStore = await cookies();
  const anonymousId = cookieStore.get(CART_COOKIE_NAME)?.value;
  // Appel au Service pour préparer les données du checkout
  const checkoutSummary = await getCheckoutSummary({
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
    <div className="py-8 lg:py-12 flex-grow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
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
