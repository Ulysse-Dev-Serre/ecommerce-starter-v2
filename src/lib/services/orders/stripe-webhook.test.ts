import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StripeWebhookService } from './stripe-webhook.service';
import { prisma } from '@/lib/core/db';
import { AppError } from '@/lib/types/api/errors';
// Need to mock the entire module to spy on exported functions
import * as OrderService from '@/lib/services/orders';
import * as CartService from '@/lib/services/cart';

// Mock Prisma
vi.mock('@/lib/core/db', () => ({
  prisma: {
    payment: { findFirst: vi.fn() },
    productVariant: { findMany: vi.fn() },
  },
}));

// Mock External Services
vi.mock('@/lib/services/orders', () => ({
  createOrderFromCart: vi.fn(),
  sendOrderConfirmationEmail: vi.fn(),
  sendAdminNewOrderAlert: vi.fn(),
}));

vi.mock('@/lib/services/cart', () => ({
  clearCart: vi.fn(),
  getOrCreateCart: vi.fn(),
}));

vi.mock('@/lib/services/inventory', () => ({
  releaseStock: vi.fn(),
}));

describe('StripeWebhookService', () => {
  const requestId = 'req_123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleCheckoutSessionCompleted', () => {
    const mockSession: any = {
      id: 'sess_123',
      payment_status: 'paid',
      payment_intent: 'pi_123',
      metadata: {
        userId: 'user_1',
        items: JSON.stringify([{ variantId: 'var_1', quantity: 2 }]),
        cartId: 'cart_1',
      },
      amount_total: 2000,
      currency: 'eur',
      customer_details: {
        email: 'test@example.com',
        name: 'John Doe',
        address: {
          line1: '123 Main St',
          city: 'Paris',
          country: 'FR',
          postal_code: '75001',
        },
      },
    };

    it('should create order and clear cart on success', async () => {
      // payment check
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null);
      // variants
      vi.mocked(prisma.productVariant.findMany).mockResolvedValue([
        { id: 'var_1', pricing: [], product: {} } as any,
      ]);
      // create order
      vi.mocked(OrderService.createOrderFromCart).mockResolvedValue({
        id: 'order_1',
        items: [],
      } as any);

      await StripeWebhookService.handleCheckoutSessionCompleted(
        mockSession,
        requestId
      );

      expect(OrderService.createOrderFromCart).toHaveBeenCalled();
      expect(CartService.clearCart).toHaveBeenCalledWith('cart_1');
      expect(OrderService.sendOrderConfirmationEmail).toHaveBeenCalled();
    });

    it('should skip if payment already exists', async () => {
      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: 'pay_1',
      } as any);

      await StripeWebhookService.handleCheckoutSessionCompleted(
        mockSession,
        requestId
      );

      expect(OrderService.createOrderFromCart).not.toHaveBeenCalled();
    });

    it('should throw if invalid metadata', async () => {
      const badSession = { ...mockSession, metadata: { items: '[]' } };
      await expect(
        StripeWebhookService.handleCheckoutSessionCompleted(
          badSession,
          requestId
        )
      ).rejects.toThrow(AppError);
      expect(OrderService.createOrderFromCart).not.toHaveBeenCalled();
    });
  });

  describe('handlePaymentIntentFailed', () => {
    it('should release stock if cartId present', async () => {
      const mockPI: any = {
        id: 'pi_fail',
        last_payment_error: { message: 'Decline' },
        metadata: { cartId: 'cart_1', userId: 'u1' },
      };

      // Mock getting cart for release
      const mockCart = { items: [{ variant: { id: 'v1' }, quantity: 1 }] };
      vi.mocked(CartService.getOrCreateCart).mockResolvedValue(mockCart as any);

      await StripeWebhookService.handlePaymentIntentFailed(mockPI, requestId);

      const { releaseStock } = await import('@/lib/services/inventory');
      expect(CartService.getOrCreateCart).toHaveBeenCalledWith('u1', undefined);
      expect(releaseStock).toHaveBeenCalled();
    });
  });
});
