import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/lib/utils/date';
import { getOrderStatusKey } from '@/lib/utils/order-status';
import { StatusActions } from './status-actions';

interface OrderHeaderProps {
  order: any;
  locale: string;
}

export async function OrderHeader({ order, locale }: OrderHeaderProps) {
  const t = await getTranslations('adminDashboard.orders.detail');
  const tStatus = await getTranslations('Orders.detail');

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/admin/orders`}
          className="admin-btn-secondary p-2 rounded-full"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="admin-page-title">{order.orderNumber}</h1>
            <StatusBadge
              status={order.status}
              label={tStatus(getOrderStatusKey(order.status))}
            />
          </div>
          <p className="admin-page-subtitle">
            {t('placedOn', {
              date: formatDate(order.createdAt, locale, {
                dateStyle: 'long',
                timeStyle: 'short',
              }),
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <StatusActions
          orderId={order.id}
          orderNumber={order.orderNumber}
          customerName={`${order.user?.firstName} ${order.user?.lastName}`}
          totalAmount={order.totalAmount.toString()}
          currency={order.currency}
          currentStatus={order.status}
        />
      </div>
    </div>
  );
}
