import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPaymentIntent,
  updatePaymentIntent,
} from './payment-intent.service';
import { prisma } from '@/lib/core/db';
import { stripe } from '@/lib/integrations/stripe/client';
import { AppError } from '@/lib/types/api/errors';

vi.mock('@/lib/core/db', () => ({
  prisma: {
    productVariant: {
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/integrations/stripe/client', () => ({
  stripe: {
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('PaymentIntentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    const mockItems = [{ variantId: 'v1', quantity: 2 }];
    const mockVariants = [
      {
        id: 'v1',
        sku: 'SKU1',
        pricing: [
          { currency: 'CAD', price: 10, isActive: true, priceType: 'base' },
        ],
        product: { translations: [{ name: 'Product 1' }] },
      },
    ];

    it('should create a payment intent successfully', async () => {
      vi.mocked(prisma.productVariant.findMany).mockResolvedValue(
        mockVariants as any
      );
      vi.mocked(stripe.paymentIntents.create).mockResolvedValue({
        id: 'pi_123',
        client_secret: 'secret_123',
        amount: 2000,
        currency: 'cad',
        status: 'requires_payment_method',
      } as any);

      const result = await createPaymentIntent({
        items: mockItems,
        currency: 'CAD',
        cartId: 'c1',
      });

      expect(result.paymentIntentId).toBe('pi_123');
      expect(result.amount).toBe(20); // 10 * 2
      expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2000,
          currency: 'cad',
        })
      );
    });

    it('should throw AppError if variants are missing', async () => {
      vi.mocked(prisma.productVariant.findMany).mockResolvedValue([]);

      await expect(
        createPaymentIntent({
          items: mockItems,
          currency: 'CAD',
        })
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError if price is not found', async () => {
      const variantNoPrice = [
        {
          id: 'v1',
          sku: 'SKU1',
          pricing: [],
          product: { translations: [{ name: 'Product 1' }] },
        },
      ];
      vi.mocked(prisma.productVariant.findMany).mockResolvedValue(
        variantNoPrice as any
      );

      await expect(
        createPaymentIntent({
          items: mockItems,
          currency: 'CAD',
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('updatePaymentIntent', () => {
    const mockIntent = {
      id: 'pi_123',
      amount: 2000, // $20.00
      currency: 'cad',
      metadata: {
        subtotal: '2000',
      },
    };

    it('should update payment intent with shipping amount', async () => {
      vi.mocked(stripe.paymentIntents.retrieve).mockResolvedValue(
        mockIntent as any
      );
      vi.mocked(stripe.paymentIntents.update).mockResolvedValue({
        ...mockIntent,
        amount: 2500, // $20.00 + $5.00 shipping
      } as any);

      const result = await updatePaymentIntent('pi_123', {
        shippingAmount: '5.00',
        currency: 'CAD',
      });

      expect(result.amount).toBe(2500);
      expect(stripe.paymentIntents.update).toHaveBeenCalledWith(
        'pi_123',
        expect.objectContaining({
          amount: 2500,
          metadata: expect.objectContaining({
            shipping_cost: '5.00',
            subtotal: '2000',
          }),
        })
      );
    });

    it('should include shipping and receipt_email if provided', async () => {
      vi.mocked(stripe.paymentIntents.retrieve).mockResolvedValue(
        mockIntent as any
      );
      vi.mocked(stripe.paymentIntents.update).mockResolvedValue({
        ...mockIntent,
      } as any);

      await updatePaymentIntent('pi_123', {
        shippingAmount: '5.00',
        shippingDetails: {
          name: 'John Doe',
          phone: '1234567890',
          email: 'john@example.com',
          street1: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          zip: 'M1M 1M1',
          country: 'CA',
        },
      });

      expect(stripe.paymentIntents.update).toHaveBeenCalledWith(
        'pi_123',
        expect.objectContaining({
          receipt_email: 'john@example.com',
          shipping: expect.objectContaining({
            name: 'John Doe',
            phone: '1234567890',
          }),
        })
      );
    });
  });
});
