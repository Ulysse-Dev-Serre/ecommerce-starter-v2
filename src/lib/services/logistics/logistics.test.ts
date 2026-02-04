import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  logisticsLocationService,
  CreateLocationData,
} from './logistics-location.service';
import { prisma } from '@/lib/core/db';

// Mock Prisma
vi.mock('@/lib/core/db', () => ({
  prisma: {
    supplier: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(callback => callback(prisma)),
  },
}));

describe('LogisticsLocationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockLocation: CreateLocationData = {
    name: 'Test Warehouse',
    type: 'LOCAL_STOCK',
    incoterm: 'DDU',
    address: {
      name: 'Warehouse 1',
      street1: '123 Test St',
      city: 'Paris',
      state: 'IDF',
      zip: '75001',
      country: 'FR',
      email: 'test@example.com',
      phone: '0102030405',
    },
  };

  it('should create a location', async () => {
    vi.mocked(prisma.supplier.create).mockResolvedValue({
      id: 'loc_1',
      ...mockLocation,
      isActive: true,
    } as any);

    const result = await logisticsLocationService.createLocation(mockLocation);

    expect(prisma.supplier.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Test Warehouse' }),
      })
    );
    expect(result.id).toBe('loc_1');
  });

  it('should get all active locations', async () => {
    vi.mocked(prisma.supplier.findMany).mockResolvedValue([
      { id: 'loc_1', name: 'W1', isActive: true },
      { id: 'loc_2', name: 'W2', isActive: true },
    ] as any);

    const result = await logisticsLocationService.getLocations();

    expect(prisma.supplier.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toHaveLength(2);
  });

  it('should delete location and draft active products', async () => {
    // Mock active products using this origin
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: 'prod_1', slug: 'product-1' },
    ] as any);

    await logisticsLocationService.deleteLocation('loc_1');

    // 1. Should find active products
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { shippingOriginId: 'loc_1', status: 'ACTIVE' },
      })
    );

    // 2. Should force draft
    expect(prisma.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['prod_1'] } },
        data: { status: 'DRAFT' },
      })
    );

    // 3. Should deactivate supplier
    expect(prisma.supplier.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'loc_1' },
        data: { isActive: false },
      })
    );
  });
});
