/**
 * Admin Access Control Tests
 * Tests that non-admin users receive 403 Forbidden on admin API routes
 * 
 * Issue #43 - Dashboard admin minimal
 * Checklist item: "Ajouter tests d'accès (403 si user simple)"
 */

const { setupTest, teardownTest } = require('../../setup/test.setup');
const { 
  getTestAuthHeaders, 
  getClientAuthHeaders,
  getOrCreateTestClientUser 
} = require('../../setup/auth.factory');

describe('Admin Access Control - 403 Tests', () => {
  let client;
  let adminHeaders;
  let clientHeaders;

  beforeAll(async () => {
    const setup = await setupTest();
    client = setup.client;
    
    // Headers pour admin (devrait passer)
    adminHeaders = getTestAuthHeaders();
    
    // Créer un utilisateur CLIENT pour les tests 403
    await getOrCreateTestClientUser();
    clientHeaders = getClientAuthHeaders();
  });

  afterAll(async () => {
    await teardownTest();
  });

  describe('GET /api/admin/attributes', () => {
    test('should return 200 for admin user', async () => {
      const response = await client.get('/api/admin/attributes', {
        headers: adminHeaders
      });

      expect(response.status).toBe(200);
      expect(response.success).toBe(true);
    });

    test('should return 403 for non-admin user', async () => {
      const response = await client.get('/api/admin/attributes', {
        headers: clientHeaders
      });

      expect(response.status).toBe(403);
      expect(response.success).toBe(false);
      expect(response.data.error).toBe('Forbidden');
      expect(response.data.message).toBe('Admin access required');
    });
  });

  describe('POST /api/admin/attributes', () => {
    test('should return 403 for non-admin user', async () => {
      const response = await client.post('/api/admin/attributes', {
        key: 'test_forbidden',
        translations: [{ language: 'EN', name: 'Test' }]
      }, {
        headers: clientHeaders
      });

      expect(response.status).toBe(403);
      expect(response.success).toBe(false);
      expect(response.data.error).toBe('Forbidden');
    });
  });



  describe('POST /api/admin/products', () => {
    test('should return 403 for non-admin user', async () => {
      const response = await client.post('/api/admin/products', {
        sku: 'TEST-FORBIDDEN',
        price: 10,
        translations: [{ language: 'EN', name: 'Test', slug: 'test-forbidden' }]
      }, {
        headers: clientHeaders
      });

      expect(response.status).toBe(403);
      expect(response.success).toBe(false);
      expect(response.data.error).toBe('Forbidden');
    });
  });

  describe('GET /api/admin/media', () => {
    test('should return 403 for non-admin user', async () => {
      const response = await client.get('/api/admin/media', {
        headers: clientHeaders
      });

      expect(response.status).toBe(403);
      expect(response.success).toBe(false);
    });
  });

  describe('GET /api/users (admin only)', () => {
    test('should return 200 for admin user', async () => {
      const response = await client.get('/api/users', {
        headers: adminHeaders
      });

      expect(response.status).toBe(200);
      expect(response.success).toBe(true);
    });

    test('should return 403 for non-admin user', async () => {
      const response = await client.get('/api/users', {
        headers: clientHeaders
      });

      expect(response.status).toBe(403);
      expect(response.success).toBe(false);
    });
  });

  describe('Unauthenticated requests', () => {
    test('should return 401 without any auth headers', async () => {
      const response = await client.get('/api/admin/attributes');

      expect(response.status).toBe(401);
      expect(response.success).toBe(false);
      expect(response.data.error).toBe('Unauthorized');
    });
  });
});
