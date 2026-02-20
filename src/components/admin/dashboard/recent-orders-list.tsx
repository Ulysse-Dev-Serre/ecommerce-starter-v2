import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';

import { SupportedCurrency } from '@/lib/config/site';
import { formatPrice } from '@/lib/utils/currency';
import { getOrderStatusKey } from '@/lib/utils/order-status';

import { Order } from '@/generated/prisma';

import { StatusBadge } from '@/components/ui/status-badge';

type OrderWithUser = Order & { user: { email: string | null } | null };

interface RecentOrdersListProps {
  orders: OrderWithUser[];
}

export async function RecentOrdersList({ orders }: RecentOrdersListProps) {
  const locale = await getLocale();
  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.dashboard',
  });
  const tOrders = await getTranslations({
    locale,
    namespace: 'orders.detail',
  });

  return (
    <div className="admin-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="admin-section-title">{t('recentOrders')}</h3>
        <Link href={`/${locale}/admin/orders`} className="admin-link text-sm">
          {t('viewAll')}
        </Link>
      </div>
      <div className="space-y-4">
        {orders.length === 0 ? (
          <p className="text-center text-sm admin-text-subtle py-8">
            {t('noRecentOrders')}
          </p>
        ) : (
          orders.map(order => {
            const timeAgo = Math.floor(
              (Date.now() - new Date(order.createdAt).getTime()) / 60000
            );
            const displayTime =
              timeAgo < 60
                ? `${timeAgo} min`
                : timeAgo < 1440
                  ? `${Math.floor(timeAgo / 60)}h`
                  : `${Math.floor(timeAgo / 1440)}${t('time.daysShort')}`;

            return (
              <Link
                key={order.id}
                href={`/${locale}/admin/orders/${order.id}`}
                className="flex items-center justify-between border-b border-gray-100 pb-3 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {order.orderNumber}
                  </p>
                  <p className="text-xs admin-text-subtle truncate">
                    {order.user?.email} • {displayTime}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(
                      Number(order.totalAmount),
                      order.currency as SupportedCurrency,
                      locale
                    )}
                  </span>
                  <StatusBadge
                    status={order.status}
                    label={tOrders(getOrderStatusKey(order.status))}
                  />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
