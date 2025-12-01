/**
 * Orders Status Management Tests
 * Tests changement de statut des commandes avec validation du workflow
 * 
 * Issue #45 - Gestion des Commandes (admin)
 */

const { setupTest, teardownTest } = require('../../setup/test.setup');
const { 
  getTestAuthHeaders, 
  getClientAuthHeaders,
  getOrCreateTestClientUser 
} = require('../../setup/auth.factory');

describe('Orders Status Management - PATCH /api/admin/orders/[id]/status', () => {
  let client;
  let adminHeaders;
  let clientHeaders;

  beforeAll(async () => {
    const setup = await setupTest();
    client = setup.client;
    
    adminHeaders = getTestAuthHeaders();
    await getOrCreateTestClientUser();
    clientHeaders = getClientAuthHeaders();
  });

  afterAll(async () => {
    await teardownTest();
  });

  describe('Authentification & Autorisation', () => {
    const fakeOrderId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    test('should return 401 without auth headers', async () => {
      const response = await client.patch(
        `/api/admin/orders/${fakeOrderId}/status`,
        { status: 'SHIPPED' }
      );

      expect(response.status).toBe(401);
      expect(response.data.error).toBe('Unauthorized');
    });

    test('should return 403 for non-admin user', async () => {
      const response = await client.patch(
        `/api/admin/orders/${fakeOrderId}/status`,
        { status: 'SHIPPED' },
        { headers: clientHeaders }
      );

      expect(response.status).toBe(403);
      expect(response.data.error).toBe('Forbidden');
    });

    test('should return 404 for non-existent order (admin)', async () => {
      const response = await client.patch(
        `/api/admin/orders/${fakeOrderId}/status`,
        { status: 'SHIPPED' },
        { headers: adminHeaders }
      );

      expect(response.status).toBe(404);
      expect(response.data.error).toBe('Order not found');
    });
  });

  describe('Validation du payload', () => {
    const fakeOrderId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    test('should reject missing status field', async () => {
      const response = await client.patch(
        `/api/admin/orders/${fakeOrderId}/status`,
        { comment: 'Only comment' },
        { headers: adminHeaders }
      );

      expect(response.status).toBe(400);
      expect(response.data.error).toBe('Invalid request');
    });

    test('should reject invalid status value', async () => {
      const response = await client.patch(
        `/api/admin/orders/${fakeOrderId}/status`,
        { status: 'INVALID_STATUS' },
        { headers: adminHeaders }
      );

      expect(response.status).toBe(400);
      expect(response.data.error).toBe('Invalid request');
    });
  });
});
