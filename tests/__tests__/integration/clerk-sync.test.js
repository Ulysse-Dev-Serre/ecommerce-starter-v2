/**
 * Clerk synchronization integration tests
 */
const { PrismaClient } = require('../../../src/generated/prisma');
const { setupTest, teardownTest } = require('../../utils/setup');
const { mockClerkWebhookPayload, mockClerkUpdatePayload, mockClerkDeletePayload } = require('../../utils/mock-data');
const userData = require('../../fixtures/user-data.json');

describe('Clerk Synchronization Integration', () => {
  let client;
  let prisma;

  beforeAll(async () => {
    const setup = await setupTest();
    client = setup.client;
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await teardownTest();
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await prisma.user.deleteMany({
        where: { clerkId: { startsWith: 'test_' } }
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('End-to-end webhook flow', () => {
    test('should create user via webhook and verify in database', async () => {
      // Send webhook
      const response = await client.post(
        '/api/webhooks/clerk',
        mockClerkWebhookPayload,
        { headers: userData.clerkWebhookHeaders }
      );

      expect(response.success).toBe(true);

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { clerkId: mockClerkWebhookPayload.data.id }
      });

      expect(user).toBeDefined();
      expect(user.email).toBe(mockClerkWebhookPayload.data.email_addresses[0].email_address);
      expect(user.firstName).toBe(mockClerkWebhookPayload.data.first_name);
    });

    test('should update user via webhook and verify changes', async () => {
      // Create user first
      await client.post(
        '/api/webhooks/clerk',
        mockClerkWebhookPayload,
        { headers: userData.clerkWebhookHeaders }
      );

      // Update user via webhook
      const updateResponse = await client.post(
        '/api/webhooks/clerk',
        mockClerkUpdatePayload,
        { headers: userData.clerkWebhookHeaders }
      );

      expect(updateResponse.success).toBe(true);

      // Verify changes in database
      const updatedUser = await prisma.user.findUnique({
        where: { clerkId: mockClerkUpdatePayload.data.id }
      });

      expect(updatedUser.email).toBe(mockClerkUpdatePayload.data.email_addresses[0].email_address);
      expect(updatedUser.firstName).toBe(mockClerkUpdatePayload.data.first_name);
    });

    test('should delete user via webhook and verify removal', async () => {
      // Create user first
      await client.post(
        '/api/webhooks/clerk',
        mockClerkWebhookPayload,
        { headers: userData.clerkWebhookHeaders }
      );

      // Delete user via webhook
      const deleteResponse = await client.post(
        '/api/webhooks/clerk',
        mockClerkDeletePayload,
        { headers: userData.clerkWebhookHeaders }
      );

      expect(deleteResponse.success).toBe(true);

      // Verify user was deleted from database
      const deletedUser = await prisma.user.findUnique({
        where: { clerkId: mockClerkDeletePayload.data.id }
      });

      expect(deletedUser).toBeNull();
    });
  });
});
