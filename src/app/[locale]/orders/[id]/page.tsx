import { redirect } from 'next/navigation';
import { Metadata } from 'next';

import { auth } from '@clerk/nextjs/server';

import { prisma } from '@/lib/db/prisma';
import { getOrderDetailsWithData } from '@/lib/services/order.service';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import { OrderDetailContent } from '@/components/orders/order-detail-content';

export const dynamic = 'force-dynamic';

interface OrderDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: OrderDetailPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'Orders.detail' });

  return {
    title: `${t('orderNumber')} #${id}`,
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
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect(`/${locale}/sign-in`);
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, firstName: true, email: true },
  });

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  const { order, productData } = await getOrderDetailsWithData(
    id,
    user.id,
    locale
  );

  return (
    <OrderDetailContent
      order={order}
      user={user}
      locale={locale}
      productData={productData}
    />
  );
}
