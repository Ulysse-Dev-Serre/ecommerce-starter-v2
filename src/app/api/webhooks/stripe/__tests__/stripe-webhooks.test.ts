import { NextRequest } from 'next/server';
import Stripe from 'stripe';

import { prisma } from '../../../../../lib/db/prisma';
import {
  generatePayloadHash,
  validateWebhookSignature,
} from '../../../../../lib/stripe/webhooks';

// Mock Prisma
jest.mock('../../../../../lib/db/prisma', () => ({
  prisma: {
    webhookEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    payment: {
      findFirst: jest.fn(),
    },
    productVariant: {
      findMany: jest.fn(),
    },
    cart: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock stripe webhooks
jest.mock('../../../../../lib/stripe/webhooks', () => ({
  validateWebhookSignature: jest.fn(),
  generatePayloadHash: jest.fn(),
}));

// Mock services
jest.mock('../../../../../lib/services/webhook-alert.service', () => ({
  alertWebhookFailure: jest.fn(),
  alertInvalidSignature: jest.fn(),
}));

jest.mock('../../../../../lib/services/cart.service', () => ({
  clearCart: jest.fn(),
  getOrCreateCart: jest.fn(),
}));

jest.mock('../../../../../lib/services/inventory.service', () => ({
  releaseStock: jest.fn(),
}));

jest.mock('../../../../../lib/services/order.service', () => ({
  createOrderFromCart: jest.fn(),
}));

describe('Stripe Webhook Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'test_secret_123';
  });

  describe('Signature Validation', () => {
    it('should reject webhook without signature header', async () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' });

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: payload,
        headers: {
          'content-type': 'application/json',
        },
      });

      // Import and call the handler
      const { POST } = await import('../route');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Missing signature');
    });

    it('should reject webhook with invalid signature', async () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
      const invalidSignature = 'invalid_sig_123';

      (validateWebhookSignature as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': invalidSignature,
          'content-type': 'application/json',
        },
      });

      const { POST } = await import('../route');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid webhook signature');
    });
  });

  describe('Idempotence', () => {
    it('should skip already processed events', async () => {
      const eventId = 'evt_test_123';
      const payload = JSON.stringify({
        id: eventId,
        type: 'payment_intent.succeeded',
      });

      const mockEvent: Stripe.Event = {
        id: eventId,
        type: 'payment_intent.succeeded',
        data: { object: {} },
      } as any;

      (validateWebhookSignature as jest.Mock).mockReturnValue(mockEvent);
      (generatePayloadHash as jest.Mock).mockReturnValue('hash_123');

      // Already processed event
      (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue({
        id: 'webhook_id_123',
        processed: true,
        retryCount: 0,
      });

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': 'sig_valid',
          'content-type': 'application/json',
        },
      });

      const { POST } = await import('../route');
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.received).toBe(true);

      // Should not update the event
      expect(prisma.webhookEvent.update).not.toHaveBeenCalled();
    });

    it('should create new webhook event record on first attempt', async () => {
      const eventId = 'evt_test_456';
      const payload = JSON.stringify({
        id: eventId,
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test', amount: 5000, currency: 'usd' } },
      });

      const mockEvent: Stripe.Event = {
        id: eventId,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test',
            amount: 5000,
            currency: 'usd',
            metadata: {
              userId: 'user_123',
              items: JSON.stringify([{ variantId: 'var_1', quantity: 1 }]),
            },
          },
        },
      } as any;

      (validateWebhookSignature as jest.Mock).mockReturnValue(mockEvent);
      (generatePayloadHash as jest.Mock).mockReturnValue('hash_456');

      // No existing event
      (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.webhookEvent.create as jest.Mock).mockResolvedValue({
        id: 'webhook_id_456',
        processed: false,
      });

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': 'sig_valid',
          'content-type': 'application/json',
        },
      });

      const { POST } = await import('../route');
      const response = await POST(request);

      expect(response.status).toBe(200);

      // Should create new event record
      expect(prisma.webhookEvent.create).toHaveBeenCalledWith({
        data: {
          source: 'stripe',
          eventId,
          eventType: 'payment_intent.succeeded',
          payloadHash: 'hash_456',
          processed: false,
        },
      });
    });
  });

  describe('Retry Logic', () => {
    it('should increment retryCount on error', async () => {
      const eventId = 'evt_test_retry';
      const payload = JSON.stringify({
        id: eventId,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test',
            amount: 5000,
            currency: 'usd',
            metadata: {
              userId: 'user_123',
              items: JSON.stringify([{ variantId: 'var_1', quantity: 1 }]),
            },
          },
        },
      });

      const mockEvent: Stripe.Event = {
        id: eventId,
        type: 'payment_intent.succeeded',
        data: { object: {} },
      } as any;

      (validateWebhookSignature as jest.Mock).mockReturnValue(mockEvent);
      (generatePayloadHash as jest.Mock).mockReturnValue('hash_retry');

      // Existing event with no retries yet
      (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue({
        id: 'webhook_id_retry',
        processed: false,
        retryCount: 0,
        maxRetries: 3,
      });

      // Mock handler to throw error
      jest.mock('../../../../../lib/services/order.service', () => ({
        createOrderFromCart: jest
          .fn()
          .mockRejectedValue(new Error('Database error')),
      }));

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': 'sig_valid',
          'content-type': 'application/json',
        },
      });

      const { POST } = await import('../route');
      const response = await POST(request);

      // Should return 500 for retry
      expect(response.status).toBe(500);

      // Should update retryCount
      expect(prisma.webhookEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            retryCount: expect.anything(),
            lastError: expect.any(String),
          }),
        })
      );
    });

    it('should alert and return 200 when max retries reached', async () => {
      const eventId = 'evt_test_maxretry';
      const payload = JSON.stringify({
        id: eventId,
        type: 'payment_intent.succeeded',
        data: { object: {} },
      });

      const mockEvent: Stripe.Event = {
        id: eventId,
        type: 'payment_intent.succeeded',
        data: { object: {} },
      } as any;

      (validateWebhookSignature as jest.Mock).mockReturnValue(mockEvent);
      (generatePayloadHash as jest.Mock).mockReturnValue('hash_maxretry');

      // Existing event with max retries reached
      (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue({
        id: 'webhook_id_maxretry',
        processed: false,
        retryCount: 2,
        maxRetries: 3,
      });

      // Update returns retryCount = 3
      (prisma.webhookEvent.update as jest.Mock).mockResolvedValue({
        id: 'webhook_id_maxretry',
        retryCount: 3,
        maxRetries: 3,
      });

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': 'sig_valid',
          'content-type': 'application/json',
        },
      });

      const { POST } = await import('../route');
      const response = await POST(request);

      // Should return 200 to stop Stripe retries
      expect(response.status).toBe(200);
    });
  });

  describe('Webhook Event Types', () => {
    it('should handle checkout.session.completed', async () => {
      const eventId = 'evt_checkout_123';
      const payload = JSON.stringify({
        id: eventId,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test',
            payment_status: 'paid',
            payment_intent: 'pi_test',
            amount_total: 5000,
            currency: 'usd',
            metadata: {
              userId: 'user_123',
              items: JSON.stringify([{ variantId: 'var_1', quantity: 1 }]),
            },
          },
        },
      });

      const mockEvent: Stripe.Event = {
        id: eventId,
        type: 'checkout.session.completed',
        data: { object: {} },
      } as any;

      (validateWebhookSignature as jest.Mock).mockReturnValue(mockEvent);
      (generatePayloadHash as jest.Mock).mockReturnValue('hash_checkout');

      (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.webhookEvent.create as jest.Mock).mockResolvedValue({
        id: 'webhook_id_checkout',
        processed: false,
      });
      (prisma.webhookEvent.update as jest.Mock).mockResolvedValue({
        id: 'webhook_id_checkout',
        processed: true,
      });

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': 'sig_valid',
          'content-type': 'application/json',
        },
      });

      const { POST } = await import('../route');
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.received).toBe(true);
    });

    it('should handle payment_intent.payment_failed', async () => {
      const eventId = 'evt_failed_123';
      const payload = JSON.stringify({
        id: eventId,
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_failed',
            amount: 5000,
            currency: 'usd',
            metadata: {
              userId: 'user_123',
              cartId: 'cart_123',
            },
          },
        },
      });

      const mockEvent: Stripe.Event = {
        id: eventId,
        type: 'payment_intent.payment_failed',
        data: { object: {} },
      } as any;

      (validateWebhookSignature as jest.Mock).mockReturnValue(mockEvent);
      (generatePayloadHash as jest.Mock).mockReturnValue('hash_failed');

      (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.webhookEvent.create as jest.Mock).mockResolvedValue({
        id: 'webhook_id_failed',
        processed: false,
      });
      (prisma.webhookEvent.update as jest.Mock).mockResolvedValue({
        id: 'webhook_id_failed',
        processed: true,
      });

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': 'sig_valid',
          'content-type': 'application/json',
        },
      });

      const { POST } = await import('../route');
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });
});
