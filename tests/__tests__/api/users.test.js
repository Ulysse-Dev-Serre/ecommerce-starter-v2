/**
 * Users API tests - Version avec POST promote ajouté
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

  // VOS TESTS EXISTANTS (inchangés)
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
        timestamp: expect.any(String),
      });
    });
  });

  // NOUVEAUX TESTS pour POST promote
  describe('POST /api/users/[id]/promote', () => {
    let testUserId;

    beforeEach(async () => {
      // Récupérer un utilisateur de test
      const usersResponse = await client.get('/api/users');
      if (usersResponse.data.users.length > 0) {
        testUserId = usersResponse.data.users[0].id;
      }
    });

    test('should switch user role successfully', async () => {
      const response = await client.post(`/api/users/${testUserId}/promote`);

      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('previousRole');
      expect(response.data).toHaveProperty('newRole');
      expect(response.data.previousRole).not.toBe(response.data.newRole);
    });

    test('should toggle back to original role', async () => {
      // Premier switch
      const firstResponse = await client.post(
        `/api/users/${testUserId}/promote`
      );
      const firstNewRole = firstResponse.data.newRole;
      const firstPreviousRole = firstResponse.data.previousRole;

      // Deuxième switch (retour)
      const secondResponse = await client.post(
        `/api/users/${testUserId}/promote`
      );

      expect(secondResponse.data.previousRole).toBe(firstNewRole);
      expect(secondResponse.data.newRole).toBe(firstPreviousRole);
    });

    test('should return 404 for invalid user ID', async () => {
      const response = await client.post('/api/users/invalid-id-123/promote');

      expect(response.success).toBe(false);
      expect(response.status).toBe(404);
      expect(response.data).toHaveProperty('error');
    });
  });
});
