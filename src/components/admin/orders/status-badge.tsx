import { OrderStatus } from '@/generated/prisma';

interface StatusBadgeProps {
  status: OrderStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    PENDING: {
      label: 'Pending',
      class: 'bg-yellow-100 text-yellow-800',
    },
    PAID: {
      label: 'Paid',
      class: 'bg-green-100 text-green-800',
    },
    SHIPPED: {
      label: 'Shipped',
      class: 'bg-blue-100 text-blue-800',
    },
    DELIVERED: {
      label: 'Delivered',
      class: 'bg-purple-100 text-purple-800',
    },
    CANCELLED: {
      label: 'Cancelled',
      class: 'bg-red-100 text-red-800',
    },
    REFUNDED: {
      label: 'Refunded',
      class: 'bg-gray-100 text-gray-800',
    },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.class}`}
    >
      {config.label}
    </span>
  );
}
