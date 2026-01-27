import Link from 'next/link';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

import { auth } from '@clerk/nextjs/server';

import { prisma } from '@/lib/db/prisma';
import { getUserOrders } from '@/lib/services/order.service';
import { getTranslations } from 'next-intl/server';
import { formatDate } from '@/lib/utils/date';
import { formatPrice } from '@/lib/utils/currency';
import { StatusBadge } from '@/components/ui/status-badge';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
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

async function OrdersListContent({
  orders,
  locale,
}: {
  orders: any[];
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: 'Orders.list' });
  const tDetail = await getTranslations({ locale, namespace: 'Orders.detail' });

  const statusLabels: Record<string, string> = {
    PENDING: tDetail('statusPending'),
    PAID: tDetail('statusPaid'),
    SHIPPED: tDetail('statusShipped'),
    IN_TRANSIT: tDetail('statusInTransit'),
    DELIVERED: tDetail('statusDelivered'),
    CANCELLED: tDetail('statusCancelled'),
    REFUNDED: tDetail('statusRefunded'),
    REFUND_REQUESTED: tDetail('statusRefundRequested'),
  };

  return (
    <div className="flex-1 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-6">
              {t('noOrders')}
            </p>
            <Link
              href={`/${locale}/shop`}
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors font-bold"
            >
              {t('shopNow')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div
                key={order.id}
                className="bg-background border border-border rounded-2xl p-6 hover:shadow-lg hover:border-border-focus transition-all duration-300"
              >
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="space-y-1">
                    <p className="font-black text-xl text-foreground">
                      {tDetail('orderNumber')} #{order.orderNumber}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                      {tDetail('date')}: {formatDate(order.createdAt, locale)}
                    </p>
                    <p className="text-sm font-bold text-muted-foreground">
                      {order.items.length}{' '}
                      {order.items.length > 1
                        ? tDetail('items').toLowerCase()
                        : tDetail('items').toLowerCase().replace(/s$/, '')}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge
                      status={order.status}
                      label={statusLabels[order.status]}
                      className="px-4 py-1.5 font-black uppercase tracking-wider"
                    />
                    <p className="mt-3 text-2xl font-black text-foreground">
                      {formatPrice(
                        order.totalAmount,
                        order.currency as any,
                        locale
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-border flex justify-end">
                  <Link
                    href={`/${locale}/orders/${order.id}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary hover:translate-x-1 transition-all"
                  >
                    {t('viewDetails')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
