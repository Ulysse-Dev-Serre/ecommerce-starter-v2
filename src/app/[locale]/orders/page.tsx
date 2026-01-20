import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import { prisma } from '@/lib/db/prisma';
import { getUserOrders } from '@/lib/services/order.service';
import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider, useTranslations } from 'next-intl';

export const dynamic = 'force-dynamic';

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function OrdersPage({
  params,
}: OrdersPageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  const messages = await getMessages();
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

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <OrdersListContent orders={orders} locale={locale} />
    </NextIntlClientProvider>
  );
}

function OrdersListContent({
  orders,
  locale,
}: {
  orders: any[];
  locale: string;
}) {
  const t = useTranslations('Orders.list');
  const tDetail = useTranslations('Orders.detail');

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_TRANSIT':
        return 'bg-indigo-100 text-indigo-800';
      case 'DELIVERED':
        return 'bg-purple-100 text-purple-800';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-100 text-red-800';
      case 'REFUND_REQUESTED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="flex-1 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600 mb-6">{t('noOrders')}</p>
            <Link
              href={`/${locale}/shop`}
              className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-bold"
            >
              {t('shopNow')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div
                key={order.id}
                className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
              >
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="space-y-1">
                    <p className="font-black text-xl text-gray-900">
                      {tDetail('orderNumber')} #{order.orderNumber}
                    </p>
                    <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">
                      {tDetail('date')}:{' '}
                      {new Date(order.createdAt).toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm font-bold text-gray-500">
                      {order.items.length}{' '}
                      {order.items.length > 1
                        ? tDetail('items').toLowerCase()
                        : tDetail('items').toLowerCase().replace(/s$/, '')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border ${getStatusColor(order.status)}`}
                    >
                      {statusLabels[order.status] || order.status}
                    </div>
                    <p className="mt-3 text-2xl font-black text-gray-900">
                      {order.totalAmount.toString()} {order.currency}
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-50 flex justify-end">
                  <Link
                    href={`/${locale}/orders/${order.id}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 hover:text-black hover:translate-x-1 transition-all"
                  >
                    {t('viewDetails')}
                    <span className="text-lg">→</span>
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
