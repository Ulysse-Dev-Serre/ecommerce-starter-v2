import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  previewShippingRates,
  purchaseShippingLabel,
  createReturnLabel,
} from './order-fulfillment.service';
import { prisma } from '@/lib/core/db';
import { ShippingService } from '@/lib/services/shipping/shipping.service';
import * as shippo from '@/lib/integrations/shippo';

// Mocks
vi.mock('@/lib/core/db', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
    },
    shipment: {
      create: vi.fn(),
    },
    orderItem: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/services/shipping/shipping.service', () => ({
  ShippingService: {
    getShippingRates: vi.fn(),
    validateAddress: vi.fn(addr => addr),
  },
}));

vi.mock('@/lib/integrations/shippo', () => ({
  createTransaction: vi.fn(),
  getReturnShippingRates: vi.fn(), // If needed by other tests in same file
}));

describe('OrderFulfillmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('previewShippingRates', () => {
    it('should return rates when found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'ord_1',
        shippingAddress: { city: 'Paris' },
        items: [{ variant: { id: 'var_1' }, quantity: 1 }],
      } as any);

      vi.mocked(ShippingService.getShippingRates).mockResolvedValue([
        { amount: '10.00', currency: 'EUR', provider: 'DHL' } as any,
      ]);

      const result = await previewShippingRates('ord_1');
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe('10.00');
    });

    it('should throw if order not found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);
      await expect(previewShippingRates('invalid')).rejects.toThrow(
        'Order findUnique returned null for invalid'
      );
    });
  });

  describe('purchaseShippingLabel', () => {
    it('should purchase label successfully', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'ord_1',
        shippingAddress: { city: 'Paris' },
        items: [{ variant: { id: 'var_1' }, quantity: 1 }],
        shipments: [],
        orderEmail: 'test@example.com',
      } as any);

      vi.mocked(shippo.createTransaction).mockResolvedValue({
        status: 'SUCCESS',
        tracking_number: 'TRACK123',
        label_url: 'http://label.pdf',
        rate: { provider: 'DHL' },
      } as any);

      vi.mocked(prisma.shipment.create).mockResolvedValue({
        id: 'ship_1',
      } as any);

      const result = await purchaseShippingLabel('ord_1', 'rate_123');

      expect(result.success).toBe(true);
      expect(result.trackingNumber).toBe('TRACK123');
      expect(prisma.shipment.create).toHaveBeenCalled();
    });

    it('should throw if label already exists', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'ord_1',
        shipments: [{ trackingCode: 'EXISTING' }],
      } as any);

      await expect(purchaseShippingLabel('ord_1', 'rate_123')).rejects.toThrow(
        'A shipping label already exists for this order.'
      );
    });

    it('should recalculate rate if missing', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'ord_1',
        shippingAddress: { city: 'Paris' },
        items: [{ variant: { id: 'var_1' }, quantity: 1 }],
        shipments: [],
        orderEmail: 'test@example.com',
      } as any);

      vi.mocked(ShippingService.getShippingRates).mockResolvedValue([
        { object_id: 'new_rate_id', amount: '10.00' } as any,
      ]);

      vi.mocked(shippo.createTransaction).mockResolvedValue({
        status: 'SUCCESS',
        tracking_number: 'TRACK123',
        label_url: 'http://label.pdf',
      } as any);

      await purchaseShippingLabel('ord_1'); // No rateId

      expect(ShippingService.getShippingRates).toHaveBeenCalled();
      expect(shippo.createTransaction).toHaveBeenCalledWith('new_rate_id');
    });
  });

  describe('createReturnLabel', () => {
    it('should create return label successfully', async () => {
      // Mock complex order structure needed for return label
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'ord_1',
        orderEmail: 'test@example.com',
        shippingAddress: { city: 'Paris', country: 'FR' },
        items: [
          {
            product: {
              slug: 'test-product',
              weight: 1,
              dimensions: {
                length: 10,
                width: 10,
                height: 10,
              },
              translations: [{ language: 'FR', name: 'Produit Test' }],
              shippingOrigin: {
                address: {
                  city: 'Warehouse',
                  country: 'FR',
                  street1: 'Rue',
                  zip: '75000',
                },
                name: 'Supplier',
              },
            },
            quantity: 1,
            unitPrice: { toString: () => '10.00' },
          },
        ],
        currency: 'CAD',
        user: { email: 'client@example.com' },
      } as any);

      // Correction: prisma.orderItem.findMany is called to calculate weight
      vi.mocked(prisma.orderItem.findMany).mockResolvedValue([
        { quantity: 1, product: { weight: 1 } },
      ] as any);

      vi.mocked(shippo.getReturnShippingRates).mockResolvedValue({
        rates: [{ object_id: 'rate_1', amount: '5.00', provider: 'UPS' }],
      } as any);

      vi.mocked(shippo.createTransaction).mockResolvedValue({
        status: 'SUCCESS',
        tracking_number: 'RET123',
        label_url: 'http://return.pdf',
      } as any);

      const result = (await createReturnLabel('ord_1')) as any;

      expect(result.status).toBe('SUCCESS');
      expect(prisma.shipment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            trackingCode: 'RET123',
            carrierService: 'RETURN',
          }),
        })
      );
    });
  });
});
