/**
 * Webhooks API tests
 */
const { setupTest, teardownTest } = require('../../utils/setup');
const { mockClerkWebhookPayload, mockClerkUpdatePayload, mockClerkDeletePayload } = require('../../utils/mock-data');
const userData = require('../../fixtures/user-data.json');

describe('Webhooks API', () => {
  let client;

  beforeAll(async () => {
    const setup = await setupTest();
    client = setup.client;
  });

  afterAll(async () => {
    await teardownTest();
  });

  describe('POST /api/webhooks/clerk', () => {
    test('should handle user.created webhook', async () => {
      const response = await client.post(
        '/api/webhooks/clerk',
        mockClerkWebhookPayload,
        { headers: userData.clerkWebhookHeaders }
      );

      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
    });

    test('should handle user.updated webhook', async () => {
      const response = await client.post(
        '/api/webhooks/clerk',
        mockClerkUpdatePayload,
        { headers: userData.clerkWebhookHeaders }
      );

      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
    });

    test('should handle user.deleted webhook', async () => {
      const response = await client.post(
        '/api/webhooks/clerk',
        mockClerkDeletePayload,
        { headers: userData.clerkWebhookHeaders }
      );

      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
    });

    test('should reject webhook without proper headers', async () => {
      const response = await client.post(
        '/api/webhooks/clerk',
        mockClerkWebhookPayload
      );

      expect(response.success).toBe(false);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
