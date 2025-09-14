/**
 * Users API tests
 */
const { setupTest, teardownTest } = require('../../utils/setup');

describe('Users API', () => {
  let client;

  beforeAll(async () => {
    const setup = await setupTest();
    client = setup.client;
  });

  afterAll(async () => {
    await teardownTest();
  });

  describe('GET /api/users', () => {
    test('should return users list successfully', async () => {
      const response = await client.get('/api/users');

      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('count');
      expect(response.data).toHaveProperty('timestamp');
      expect(typeof response.data.count).toBe('number');
    });

    test('should have correct response structure', async () => {
      const response = await client.get('/api/users');

      expect(response.data).toMatchObject({
        success: true,
        count: expect.any(Number),
        timestamp: expect.any(String)
      });
    });
  });
});
