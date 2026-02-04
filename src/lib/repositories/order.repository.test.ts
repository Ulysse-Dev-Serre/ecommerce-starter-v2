import { describe, it, expect, vi } from 'vitest';
import { orderRepository } from '@/lib/repositories/order.repository';
import { prisma } from '@/lib/core/db';

describe('OrderRepository', () => {
  describe('findById', () => {
    it('should return an order when it exists', async () => {
      const mockOrder = {
        id: 'ord_123',
        orderNumber: 'ORD-2024-001',
        totalAmount: 100,
        items: [],
        payments: [],
        statusHistory: [],
        user: { id: 'user_1', email: 'test@example.com' },
      };

      // Configuration du mock Prisma
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

      const result = await orderRepository.findById('ord_123');

      expect(prisma.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord_123' },
        })
      );
      expect(result).toEqual(mockOrder);
    });

    it('should return null when order does not exist', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      const result = await orderRepository.findById('non_existent');

      expect(result).toBeNull();
    });
  });
});
