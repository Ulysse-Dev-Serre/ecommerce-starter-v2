/**
 * End-to-end endpoints tests
 * Full integration tests covering multiple endpoints
 */
const { setupTest, teardownTest } = require('../../utils/setup');

describe('E2E Endpoints', () => {
  let client;

  beforeAll(async () => {
    const setup = await setupTest();
    client = setup.client;
  });

  afterAll(async () => {
    await teardownTest();
  });

  describe('Full API flow', () => {
    test('should handle complete API workflow', async () => {
      console.log('🧪 Testing complete API workflow...\n');

      // Test 1: Health check
      console.log('1. Testing health endpoint');
      const healthResponse = await client.get('/api/internal/health');
      expect(healthResponse.success).toBe(true);
      expect(healthResponse.data.success).toBe(true);
      expect(healthResponse.data.data.status).toBe('healthy');
      console.log('✅ Health check passed');

      // Test 2: Users endpoint
      console.log('2. Testing users endpoint');
      const usersResponse = await client.get('/api/users');
      expect(usersResponse.success).toBe(true);
      expect(usersResponse.data.success).toBe(true);
      expect(typeof usersResponse.data.count).toBe('number');
      console.log('✅ Users endpoint passed');

      console.log('\n🎉 All E2E tests passed!');
    });

    test('should handle error scenarios gracefully', async () => {
      // Test non-existent endpoint
      const response = await client.get('/api/nonexistent');
      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
    });
  });
});
