import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import { formatPrice } from '@/lib/utils/currency';
import { StatusBadge } from '@/components/ui/status-badge';
import { getOrderStatusKey } from '@/lib/utils/order-status';
import { Order, Shipment } from '@/generated/prisma';
import { SupportedCurrency } from '@/lib/config/site';

type OrderWithRelations = Order & { shipments: Shipment[] };

interface CustomerOrderTableProps {
  orders: OrderWithRelations[];
}

export async function CustomerOrderTable({ orders }: CustomerOrderTableProps) {
  const locale = await getLocale();
  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.customers.detail',
  });
  const tDetail = await getTranslations({ locale, namespace: 'orders.detail' });

  return (
    <div className="admin-card">
      <h3 className="admin-section-title">{t('orderHistory')}</h3>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead className="admin-table-thead">
            <tr>
              <th className="admin-table-th">{t('table.orderNumber')}</th>
              <th className="admin-table-th">{t('table.date')}</th>
              <th className="admin-table-th">{t('table.amount')}</th>
              <th className="admin-table-th">{t('table.status')}</th>
              <th className="admin-table-th text-right">
                {t('table.tracking')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y admin-border-subtle">
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center admin-text-subtle italic"
                >
                  {t('noOrders')}
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} className="admin-table-tr">
                  <td className="admin-table-td font-medium admin-text-info">
                    <Link
                      href={`/${locale}/admin/orders/${order.id}`}
                      className="hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="admin-table-td admin-text-subtle">
                    {formatDate(order.createdAt, locale)}
                  </td>
                  <td className="admin-table-td font-medium admin-text-main">
                    {formatPrice(
                      Number(order.totalAmount),
                      order.currency as SupportedCurrency,
                      locale
                    )}
                  </td>
                  <td className="admin-table-td">
                    <StatusBadge
                      status={order.status}
                      label={tDetail(getOrderStatusKey(order.status))}
                    />
                  </td>
                  <td className="admin-table-td text-right">
                    {order.shipments?.[0]?.trackingCode ? (
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-semibold admin-text-subtle uppercase">
                          {order.shipments[0].carrier}
                        </span>
                        <span className="text-xs admin-text-info flex items-center gap-1">
                          {order.shipments[0].trackingCode}
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs admin-text-subtle opacity-60">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
