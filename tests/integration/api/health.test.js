/**
 * Health API tests
 */
const { setupTest, teardownTest } = require('../../setup/test.setup');

describe('Health API', () => {
  let client;

  beforeAll(async () => {
    const setup = await setupTest();
    client = setup.client;
  });

  afterAll(async () => {
    await teardownTest();
  });

  describe('GET /api/internal/health', () => {
    test('should return health status successfully', async () => {
      const response = await client.get('/api/internal/health');

      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
    });

    test('should have correct health data structure', async () => {
      const response = await client.get('/api/internal/health');
      const { data } = response.data;

      expect(data).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String),
        environment: expect.any(String),
        version: expect.any(String),
        database: {
          connected: expect.any(Boolean),
          userCount: expect.any(Number),
        },
      });
    });

    test('should report healthy database connection', async () => {
      const response = await client.get('/api/internal/health');
      const { data } = response.data;

      expect(data.status).toBe('healthy');
      expect(data.database.connected).toBe(true);
      expect(data.database.userCount).toBeGreaterThanOrEqual(0);
    });
  });
});
