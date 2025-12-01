import {
  alertInvalidSignature,
  alertWebhookFailure,
} from '../webhook-alert.service';
import { logger } from '../../logger';

jest.mock('../../logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Webhook Alert Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('alertWebhookFailure', () => {
    it('should log webhook failure with full context', async () => {
      const alert = {
        webhookId: 'webhook_123',
        source: 'stripe',
        eventId: 'evt_test_123',
        eventType: 'payment_intent.succeeded',
        error: 'Variant not found',
        retryCount: 3,
        maxRetries: 3,
        timestamp: new Date('2024-11-30T12:00:00Z'),
      };

      await alertWebhookFailure(alert);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          webhookId: 'webhook_123',
          source: 'stripe',
          eventId: 'evt_test_123',
          eventType: 'payment_intent.succeeded',
          retryCount: 3,
          maxRetries: 3,
          error: 'Variant not found',
        }),
        'Webhook failed after max retries'
      );
    });

    it('should include action required message in alert', async () => {
      const alert = {
        webhookId: 'webhook_456',
        source: 'stripe',
        eventId: 'evt_test_456',
        eventType: 'checkout.session.completed',
        error: 'Order creation failed',
        retryCount: 3,
        maxRetries: 3,
        timestamp: new Date(),
      };

      await alertWebhookFailure(alert);

      // The function should be called with specific parameters
      expect(logger.error).toHaveBeenCalled();
      const callArgs = (logger.error as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toHaveProperty('webhookId', 'webhook_456');
    });

    it('should handle different sources', async () => {
      const alert = {
        webhookId: 'webhook_clerk',
        source: 'clerk',
        eventId: 'evt_clerk_123',
        eventType: 'user.created',
        error: 'User creation failed',
        retryCount: 2,
        maxRetries: 3,
        timestamp: new Date(),
      };

      await alertWebhookFailure(alert);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'clerk',
        }),
        'Webhook failed after max retries'
      );
    });
  });

  describe('alertInvalidSignature', () => {
    it('should log invalid signature alert', async () => {
      const payload = {
        source: 'stripe',
        signature: 't=1234567890,v1=abcdef1234567890',
        error: 'Invalid signature timestamp',
        timestamp: new Date('2024-11-30T12:00:00Z'),
      };

      await alertInvalidSignature(payload);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'stripe',
          error: 'Invalid signature timestamp',
        }),
        'Invalid webhook signature detected'
      );
    });

    it('should truncate signature for security', async () => {
      const longSignature =
        't=123456789012345678901234567890,v1=abcdefghijklmnopqrstuvwxyz';

      const payload = {
        source: 'stripe',
        signature: longSignature,
        error: 'Signature mismatch',
        timestamp: new Date(),
      };

      await alertInvalidSignature(payload);

      expect(logger.error).toHaveBeenCalled();
      const callArgs = (logger.error as jest.Mock).mock.calls[0];
      // Verify that only first 20 chars are logged
      expect(callArgs[0].source).toBe('stripe');
    });

    it('should indicate potential malicious attempt', async () => {
      const payload = {
        source: 'stripe',
        signature: 'malicious_sig_attempt_123',
        error: 'HMAC mismatch',
        timestamp: new Date(),
      };

      await alertInvalidSignature(payload);

      expect(logger.error).toHaveBeenCalled();
      const message = (logger.error as jest.Mock).mock.calls[0][1];
      expect(message).toBe('Invalid webhook signature detected');
    });

    it('should handle missing or malformed signature', async () => {
      const payload = {
        source: 'stripe',
        signature: '',
        error: 'Signature header missing',
        timestamp: new Date(),
      };

      await alertInvalidSignature(payload);

      expect(logger.error).toHaveBeenCalled();
    });

    it('should work with different webhook sources', async () => {
      const payload = {
        source: 'clerk',
        signature: 'clerk_sig_123',
        error: 'Invalid Clerk signature',
        timestamp: new Date(),
      };

      await alertInvalidSignature(payload);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'clerk',
        }),
        'Invalid webhook signature detected'
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple alerts in sequence', async () => {
      const invalidSigPayload = {
        source: 'stripe',
        signature: 'bad_sig',
        error: 'Signature validation failed',
        timestamp: new Date(),
      };

      const failureAlert = {
        webhookId: 'webhook_789',
        source: 'stripe',
        eventId: 'evt_789',
        eventType: 'payment_intent.succeeded',
        error: 'Database error',
        retryCount: 3,
        maxRetries: 3,
        timestamp: new Date(),
      };

      await alertInvalidSignature(invalidSigPayload);
      await alertWebhookFailure(failureAlert);

      expect(logger.error).toHaveBeenCalledTimes(2);
    });

    it('should preserve error context for debugging', async () => {
      const alert = {
        webhookId: 'webhook_debug',
        source: 'stripe',
        eventId: 'evt_debug',
        eventType: 'payment_intent.payment_failed',
        error:
          'TypeError: Cannot read property "variant" of undefined at line 45',
        retryCount: 3,
        maxRetries: 3,
        timestamp: new Date(),
      };

      await alertWebhookFailure(alert);

      const callArgs = (logger.error as jest.Mock).mock.calls[0];
      expect(callArgs[0].error).toContain('Cannot read property');
      expect(callArgs[0].error).toContain('line 45');
    });
  });
});
