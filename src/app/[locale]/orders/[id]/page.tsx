import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ArrowLeft, Check, ExternalLink, Package } from 'lucide-react';

import { auth } from '@clerk/nextjs/server';

import { prisma } from '@/lib/db/prisma';
import { getOrderById } from '@/lib/services/order.service';
import { RefundRequestForm } from '@/components/orders/refund-request-form';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { formatDate } from '@/lib/utils/date';
import { formatPrice } from '@/lib/utils/currency';
import { StatusBadge } from '@/components/ui/status-badge';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import { Order, OrderItem, Payment, Shipment } from '@/generated/prisma';
import { OrderDetailContent } from '@/components/orders/order-detail-content';

type OrderDetail = Order & {
  items: OrderItem[];
  payments: Payment[];
  shipments: Shipment[];
};

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

  let order;
  try {
    order = await getOrderById(id, user.id);
  } catch {
    try {
      const orderByNumber = await prisma.order.findUnique({
        where: { orderNumber: id },
        include: {
          items: true,
          payments: true,
          shipments: true,
        },
      });

      if (!orderByNumber || orderByNumber.userId !== user.id) {
        return notFound();
      }
      order = orderByNumber;
    } catch {
      return notFound();
    }
  }

  const productIds = order.items
    .map(item => item.productId)
    .filter((id): id is string => !!id);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      slug: true,
      translations: {
        where: { language: locale.toUpperCase() as any },
        select: {
          name: true,
        },
      },
      media: {
        where: { isPrimary: true },
        take: 1,
      },
    },
  });

  const productData = products.reduce(
    (acc, product) => {
      acc[product.id] = {
        image: product.media[0]?.url,
        slug: product.slug,
        name: product.translations[0]?.name,
      };
      return acc;
    },
    {} as Record<string, { image?: string; slug: string; name?: string }>
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
