import { describe, it, expect } from 'vitest';
import { getOrderStatusKey } from './order-status';
import { OrderStatus } from '@/generated/prisma';

describe('OrderStatus Utils', () => {
  describe('getOrderStatusKey', () => {
    it('should return correct translation keys for known statuses', () => {
      expect(getOrderStatusKey(OrderStatus.PENDING)).toBe('statusPending');
      expect(getOrderStatusKey(OrderStatus.PAID)).toBe('statusPaid');
      expect(getOrderStatusKey(OrderStatus.SHIPPED)).toBe('statusShipped');
      expect(getOrderStatusKey(OrderStatus.IN_TRANSIT)).toBe('statusInTransit');
      expect(getOrderStatusKey(OrderStatus.DELIVERED)).toBe('statusDelivered');
      expect(getOrderStatusKey(OrderStatus.CANCELLED)).toBe('statusCancelled');
      expect(getOrderStatusKey(OrderStatus.REFUNDED)).toBe('statusRefunded');
      expect(getOrderStatusKey(OrderStatus.REFUND_REQUESTED)).toBe(
        'statusRefundRequested'
      );
    });

    it('should return empty string for unknown status', () => {
      expect(getOrderStatusKey('UNKNOWN_STATUS')).toBe('');
    });
  });
});
