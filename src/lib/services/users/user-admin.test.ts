import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/core/db';
import { getAllUsersAdmin, updateUserRole } from './user-admin.service';
import { UserRole } from '@/generated/prisma';

// Mock Prisma
vi.mock('@/lib/core/db', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('UserAdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllUsersAdmin', () => {
    const mockUsers = [
      {
        id: 'u1',
        email: 'test@example.com',
        role: UserRole.CLIENT,
        createdAt: new Date(),
        updatedAt: new Date(),
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
      },
    ];

    it('should return users with pagination', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);
      vi.mocked(prisma.user.count).mockResolvedValue(1);

      const result = await getAllUsersAdmin({ page: 1, limit: 10 });

      expect(result.users).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0,
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should filter by role', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

      await getAllUsersAdmin({ role: UserRole.ADMIN });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: UserRole.ADMIN }),
        })
      );
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      const updatedUser = {
        id: 'u1',
        role: UserRole.ADMIN,
        email: 'test@example.com',
      };
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

      const result = await updateUserRole('u1', UserRole.ADMIN);

      expect(result).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: { role: UserRole.ADMIN },
        })
      );
    });
  });
});
