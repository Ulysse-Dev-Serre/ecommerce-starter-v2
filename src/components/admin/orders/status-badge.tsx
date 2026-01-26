import { OrderStatus } from '@/generated/prisma';
import { getTranslations } from 'next-intl/server';

interface StatusBadgeProps {
  status: OrderStatus;
  locale: string;
}

export async function StatusBadge({ status, locale }: StatusBadgeProps) {
  const t = await getTranslations({ locale, namespace: 'Orders.detail' });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING:
        return t('statusPending');
      case OrderStatus.PAID:
        return t('statusPaid');
      case OrderStatus.SHIPPED:
        return t('statusShipped');
      case OrderStatus.IN_TRANSIT:
        return t('statusInTransit');
      case OrderStatus.DELIVERED:
        return t('statusDelivered');
      case OrderStatus.CANCELLED:
        return t('statusCancelled');
      case OrderStatus.REFUNDED:
        return t('statusRefunded');
      case OrderStatus.REFUND_REQUESTED:
        return t('statusRefundRequested');
      default:
        return status;
    }
  };

  const statusConfig: Record<string, string> = {
    [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [OrderStatus.PAID]: 'bg-green-100 text-green-800',
    [OrderStatus.SHIPPED]: 'bg-blue-100 text-blue-800',
    [OrderStatus.IN_TRANSIT]: 'bg-indigo-100 text-indigo-800',
    [OrderStatus.DELIVERED]: 'bg-purple-100 text-purple-800',
    [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
    [OrderStatus.REFUNDED]: 'bg-gray-100 text-gray-800',
    [OrderStatus.REFUND_REQUESTED]:
      'bg-red-600 text-white animate-pulse shadow-md border-2 border-red-800',
  };

  const className = statusConfig[status] || statusConfig[OrderStatus.PENDING];
  const label = getStatusLabel(status);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
