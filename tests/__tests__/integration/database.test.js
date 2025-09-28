/**
 * Database integration tests
 */
const { PrismaClient } = require('../../../src/generated/prisma');
const { mockUser } = require('../../utils/mock-data');

describe('Database Integration', () => {
  let prisma;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await prisma.user.deleteMany({
        where: { clerkId: { startsWith: 'test_' } },
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('User operations', () => {
    test('should create a user successfully', async () => {
      const user = await prisma.user.create({
        data: mockUser,
      });

      expect(user).toMatchObject({
        clerkId: mockUser.clerkId,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
      });
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    test('should update a user successfully', async () => {
      // Create user first
      await prisma.user.create({ data: mockUser });

      // Update user
      const updatedUser = await prisma.user.update({
        where: { clerkId: mockUser.clerkId },
        data: { firstName: 'Updated Test' },
      });

      expect(updatedUser.firstName).toBe('Updated Test');
      expect(updatedUser.clerkId).toBe(mockUser.clerkId);
    });

    test('should delete a user successfully', async () => {
      // Create user first
      await prisma.user.create({ data: mockUser });

      // Delete user
      await prisma.user.delete({
        where: { clerkId: mockUser.clerkId },
      });

      // Verify deletion
      const user = await prisma.user.findUnique({
        where: { clerkId: mockUser.clerkId },
      });

      expect(user).toBeNull();
    });

    test('should handle unique constraint on clerkId', async () => {
      // Create user first
      await prisma.user.create({ data: mockUser });

      // Try to create duplicate
      await expect(prisma.user.create({ data: mockUser })).rejects.toThrow();
    });
  });
});
