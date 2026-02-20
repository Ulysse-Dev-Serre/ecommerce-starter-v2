import { Eye } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { SupportedCurrency } from '@/lib/config/site';
import { OrderWithIncludes } from '@/lib/types/domain/order';
import { formatPrice } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { getOrderStatusKey } from '@/lib/utils/order-status';

import { StatusBadge } from '@/components/ui/status-badge';

interface OrderListTableProps {
  orders: OrderWithIncludes[];
  locale: string;
}

export async function OrderListTable({ orders, locale }: OrderListTableProps) {
  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.orders',
  });
  const tDetail = await getTranslations({ locale, namespace: 'orders.detail' });

  return (
    <div className="admin-card p-0 overflow-hidden min-h-[400px]">
      <table className="admin-table">
        <thead className="admin-table-thead">
          <tr>
            <th className="admin-table-th">{t('table.order')}</th>
            <th className="admin-table-th">{t('table.customer')}</th>
            <th className="admin-table-th">{t('table.date')}</th>
            <th className="admin-table-th">{t('table.total')}</th>
            <th className="admin-table-th">{t('table.status')}</th>
            <th className="admin-table-th">{t('table.payment')}</th>
            <th className="admin-table-th text-right">{t('table.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y admin-border-subtle">
          {orders.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-6 py-12 text-center admin-text-subtle"
              >
                {t('table.noOrders')}
              </td>
            </tr>
          ) : (
            orders.map(order => (
              <tr key={order.id} className="admin-table-tr">
                <td className="admin-table-td">
                  <div className="font-medium admin-text-main">
                    {order.orderNumber}
                  </div>
                  <div className="admin-text-subtle">
                    {order.items.length}{' '}
                    {order.items.length > 1
                      ? t('table.items')
                      : t('table.item')}
                  </div>
                </td>
                <td className="admin-table-td">
                  <div className="admin-text-main">
                    {order.user?.firstName && order.user?.lastName
                      ? `${order.user.firstName} ${order.user.lastName}`
                      : t('table.customerUnknown')}
                  </div>
                  <div className="admin-text-subtle">
                    {order.user?.email || t('table.noEmail')}
                  </div>
                </td>
                <td className="admin-table-td admin-text-subtle">
                  {formatDate(order.createdAt, locale)}
                </td>
                <td className="admin-table-td">
                  <div className="font-medium admin-text-main">
                    {formatPrice(
                      Number(order.totalAmount),
                      order.currency as SupportedCurrency,
                      locale
                    )}
                  </div>
                </td>
                <td className="admin-table-td">
                  <StatusBadge
                    status={order.status}
                    label={tDetail(getOrderStatusKey(order.status))}
                  />
                </td>
                <td className="admin-table-td">
                  {order.payments[0] && (
                    <div className="text-sm">
                      <div className="font-medium admin-text-main">
                        {order.payments[0].method}
                      </div>
                      <div className="admin-text-subtle">
                        {order.payments[0].externalId?.substring(0, 20)}...
                      </div>
                    </div>
                  )}
                </td>
                <td className="admin-table-td text-right font-medium">
                  <Link
                    href={`/${locale}/admin/orders/${order.id}`}
                    className="admin-link inline-flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    {t('table.view')}
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
