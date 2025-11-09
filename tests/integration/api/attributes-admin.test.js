/**
 * Attributes Admin API Tests
 * Tests des endpoints admin avec authentification Clerk
 */

const { setupTest, teardownTest } = require('../../setup/test.setup');
const { getTestAuthHeaders } = require('../../setup/auth.factory');
const { createAttributeData } = require('../../fixtures/products.fixture');

describe('Attributes Admin API', () => {
  let client;
  let testHeaders;

  beforeAll(async () => {
    const setup = await setupTest();
    client = setup.client;
    testHeaders = getTestAuthHeaders();
  });

  afterAll(async () => {
    await teardownTest();
  });

  describe('POST /api/admin/attributes', () => {
    test('should create a new attribute with admin auth', async () => {
      console.log('🔑 TEST_API_KEY:', process.env.TEST_API_KEY ? 'DEFINED' : 'UNDEFINED');
      console.log('📤 Headers being sent:', testHeaders);
      
      const attributeData = createAttributeData({
        key: `color_${Date.now()}`,
        translations: [
          { language: 'EN', name: 'Color' },
          { language: 'FR', name: 'Couleur' }
        ]
      });

      const response = await client.post('/api/admin/attributes', attributeData, {
        headers: testHeaders
      });

      console.log('📥 POST response:', response.status, response.data);

      expect(response.success).toBe(true);
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.key).toBe(attributeData.key);
      expect(response.data.translations).toHaveLength(2);
    });
  });

  describe('GET /api/admin/attributes', () => {
    test('should fetch all attributes with admin auth', async () => {
      const response = await client.get('/api/admin/attributes', {
        headers: testHeaders
      });

      console.log('GET response:', response.status);

      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });
});
