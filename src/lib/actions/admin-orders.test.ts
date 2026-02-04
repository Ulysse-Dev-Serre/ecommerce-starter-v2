import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateOrderStatusAction } from './admin-orders';
import { updateOrderStatus } from '@/lib/services/orders';
import { OrderStatus } from '@/generated/prisma';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/services/orders', () => ({
  updateOrderStatus: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Import auth mock to change return values
import { auth } from '@clerk/nextjs/server';

describe('Admin Orders Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateOrderStatusAction', () => {
    it('should update status successfully when admin', async () => {
      // Mock Admin
      vi.mocked(auth).mockResolvedValue({
        userId: 'admin_user',
        sessionClaims: { metadata: { role: 'ADMIN' } },
      } as any);

      vi.mocked(updateOrderStatus).mockResolvedValue({
        id: 'order_1',
        status: OrderStatus.SHIPPED,
      } as any);

      const result = await updateOrderStatusAction(
        'order_1',
        OrderStatus.SHIPPED
      );

      expect(result.success).toBe(true);
      expect(updateOrderStatus).toHaveBeenCalledWith({
        orderId: 'order_1',
        status: OrderStatus.SHIPPED,
        comment: undefined,
        userId: 'admin_user',
      });
    });

    it('should fail when not authorized', async () => {
      // Mock User
      vi.mocked(auth).mockResolvedValue({
        userId: 'normal_user',
        sessionClaims: { metadata: { role: 'USER' } },
      } as any);

      await expect(
        updateOrderStatusAction('order_1', OrderStatus.SHIPPED)
      ).rejects.toThrow('Unauthorized');
    });
  });
});
