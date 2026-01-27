import { OrderStatus } from '@/generated/prisma';

/**
 * Returns the translation key for a given OrderStatus.
 * Used with getTranslations({ namespace: 'Orders.detail' })
 */
export function getOrderStatusKey(status: OrderStatus | string): string {
  switch (status) {
    case OrderStatus.PENDING:
      return 'statusPending';
    case OrderStatus.PAID:
      return 'statusPaid';
    case OrderStatus.SHIPPED:
      return 'statusShipped';
    case OrderStatus.IN_TRANSIT:
      return 'statusInTransit';
    case OrderStatus.DELIVERED:
      return 'statusDelivered';
    case OrderStatus.CANCELLED:
      return 'statusCancelled';
    case OrderStatus.REFUNDED:
      return 'statusRefunded';
    case OrderStatus.REFUND_REQUESTED:
      return 'statusRefundRequested';
    default:
      return '';
  }
}
