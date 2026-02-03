import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reserveStock } from './stock-reserve.service';
import { prisma } from '@/lib/core/db';
import { checkStockAvailability } from './stock-check.service';
import { AppError } from '@/lib/types/api/errors';

vi.mock('@/lib/core/db', () => ({
  prisma: {
    productVariantInventory: {
      update: vi.fn(),
    },
  },
}));

vi.mock('./stock-check.service', () => ({
  checkStockAvailability: vi.fn(),
}));

describe('StockReserveService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('reserveStock', () => {
    const mockItems = [{ variantId: 'v1', quantity: 2 }];

    it('should increment reserved stock if available', async () => {
      vi.mocked(checkStockAvailability).mockResolvedValue({
        available: true,
        currentStock: 10,
      } as any);

      await reserveStock(mockItems);

      expect(prisma.productVariantInventory.update).toHaveBeenCalledWith({
        where: { variantId: 'v1' },
        data: { reservedStock: { increment: 2 } },
      });
    });

    it('should throw AppError if stock is insufficient', async () => {
      vi.mocked(checkStockAvailability).mockResolvedValue({
        available: false,
        currentStock: 1,
      } as any);

      await expect(reserveStock(mockItems)).rejects.toThrow(AppError);
      expect(prisma.productVariantInventory.update).not.toHaveBeenCalled();
    });
  });
});
