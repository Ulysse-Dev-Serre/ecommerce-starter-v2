import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { SUPPORTED_LOCALES } from '@/lib/config/site';
import {
  getOrderDetailsWithData,
  getOrderMetadata,
} from '@/lib/services/orders';
import { getCurrentUser } from '@/lib/services/users';

import { OrderDetailContent } from '@/components/orders/order-detail-content';

export const dynamic = 'force-dynamic';

interface OrderDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: OrderDetailPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'orders.detail' });

  // On essaie de récupérer le vrai numéro de commande si possible, sinon titre générique
  try {
    const order = await getOrderMetadata(id);

    if (order?.orderNumber) {
      return {
        title: `${t('orderNumber')} #${order.orderNumber}`,
        robots: { index: false, follow: false },
      };
    }
  } catch {
    // Fallback silencieux
  }

  return {
    title: t('title'), // Titre générique "Détail de la commande"
    robots: { index: false, follow: false },
    alternates: {
      canonical: `/${locale}/orders/${id}`,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map(loc => [loc, `/${loc}/orders/${id}`])
      ),
    },
  };
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps): Promise<React.ReactElement> {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  const { order, itemData } = await getOrderDetailsWithData(
    id,
    user.id,
    locale
  );

  return (
    <OrderDetailContent
      order={order}
      user={user}
      locale={locale}
      itemData={itemData}
    />
  );
}
