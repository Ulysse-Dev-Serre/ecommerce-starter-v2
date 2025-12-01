/**
 * Webhooks Stripe Tests
 * Tests de l'endpoint webhook Stripe
 *
 * Issue #49 - Webhooks Stripe sécurisés
 */

const { setupTest, teardownTest } = require('../../setup/test.setup');

describe('Webhooks Stripe', () => {
  let client;

  beforeAll(async () => {
    const setup = await setupTest();
    client = setup.client;
  });

  afterAll(async () => {
    await teardownTest();
  });

  describe('POST /api/webhooks/stripe', () => {
    test('should reject webhook without signature header', async () => {
      const response = await client.post('/api/webhooks/stripe', {
        type: 'payment_intent.succeeded'
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toBeDefined();
    });

    test('should reject webhook with invalid signature', async () => {
      const response = await client.post('/api/webhooks/stripe', 
        JSON.stringify({ type: 'payment_intent.succeeded' }),
        {
          headers: {
            'stripe-signature': 'invalid_signature_123'
          }
        }
      );

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/webhooks/stripe/status', () => {
    test('should return webhook statistics', async () => {
      const response = await client.get('/api/webhooks/stripe/status');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('summary');
      expect(response.data.summary).toHaveProperty('total');
      expect(response.data.summary).toHaveProperty('processed');
      expect(response.data.summary).toHaveProperty('successRate');
    });

    test('should return event type breakdown', async () => {
      const response = await client.get('/api/webhooks/stripe/status');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('eventTypeBreakdown');
      expect(Array.isArray(response.data.eventTypeBreakdown)).toBe(true);
    });

    test('should return recent failures list', async () => {
      const response = await client.get('/api/webhooks/stripe/status');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('recentFailures');
      expect(Array.isArray(response.data.recentFailures)).toBe(true);
    });
  });
});
