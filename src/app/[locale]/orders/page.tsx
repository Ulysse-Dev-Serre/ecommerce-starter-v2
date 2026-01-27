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
import { SUPPORTED_LOCALES } from '@/lib/constants';

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
    <div className="flex-1 py-12 animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-12">
          {t('title')}
        </h1>

        {orders.length === 0 ? (
          <div className="vibe-info-box">
            <div className="text-5xl mb-6 text-muted-foreground/50">📦</div>
            <p className="text-xl text-muted-foreground mb-8">
              {t('noOrders')}
            </p>
            <Link
              href={`/${locale}/shop`}
              className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-xl hover:bg-primary-hover transition-all font-bold shadow-lg shadow-primary/10"
            >
              {t('shopNow')}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, idx) => (
              <div
                key={order.id}
                className="vibe-card group animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex flex-wrap justify-between items-start gap-6">
                  <div className="space-y-2">
                    <p className="font-extrabold text-2xl text-foreground">
                      {tDetail('orderNumber')} #{order.orderNumber}
                    </p>
                    <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                      <span>{formatDate(order.createdAt, locale)}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-border" />
                      <span>
                        {order.items.length}{' '}
                        {order.items.length > 1
                          ? tDetail('items').toLowerCase()
                          : tDetail('items').toLowerCase().replace(/s$/, '')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge
                      status={order.status}
                      label={statusLabels[order.status]}
                      className="px-4 py-1.5 font-black uppercase tracking-wider"
                    />
                    <p className="mt-3 text-3xl font-black text-foreground">
                      {formatPrice(
                        order.totalAmount,
                        order.currency as any,
                        locale
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-border flex justify-end">
                  <Link
                    href={`/${locale}/orders/${order.id}`}
                    className="inline-flex items-center gap-2 text-base font-bold text-foreground hover:text-primary transition-all group/link"
                  >
                    {t('viewDetails')}
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
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
