import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { getUserOrders } from '@/lib/services/order.service';
import { getTranslations } from 'next-intl/server';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import { OrdersListContent } from '@/components/orders/orders-list-content';

export const dynamic = 'force-dynamic';

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: OrdersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Orders.list' });

  return {
    title: t('title'),
    robots: { index: false, follow: false },
    alternates: {
      canonical: `/${locale}/orders`,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map(loc => [loc, `/${loc}/orders`])
      ),
    },
  };
}

export default async function OrdersPage({
  params,
}: OrdersPageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect(`/${locale}/sign-in`);
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  const orders = await getUserOrders(user.id);

  return <OrdersListContent orders={orders} locale={locale} />;
}
