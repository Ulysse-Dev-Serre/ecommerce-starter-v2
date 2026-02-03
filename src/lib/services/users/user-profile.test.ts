import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllUsers } from './user-profile.service';
import { prisma } from '@/lib/core/db';
import { UserRole } from '@/generated/prisma';

// Mock Prisma
vi.mock('@/lib/core/db', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('UserProfileService', () => {
  describe('getAllUsers', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return paginated users with defaults', async () => {
      const mockUsers = [{ id: '1', email: 'test@example.com' }];
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);
      vi.mocked(prisma.user.count).mockResolvedValue(1);

      const result = await getAllUsers({});

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
      expect(result.users).toEqual(mockUsers);
    });

    it('should filter by role', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

      await getAllUsers({ role: UserRole.ADMIN });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: UserRole.ADMIN },
        })
      );
    });

    it('should filter by search term', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

      await getAllUsers({ search: 'John' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { firstName: { contains: 'John', mode: 'insensitive' } },
              { lastName: { contains: 'John', mode: 'insensitive' } },
              { email: { contains: 'John', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should filter by BOTH role and search term', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

      await getAllUsers({ search: 'AdminUser', role: UserRole.ADMIN });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            role: UserRole.ADMIN,
            OR: [
              { firstName: { contains: 'AdminUser', mode: 'insensitive' } },
              { lastName: { contains: 'AdminUser', mode: 'insensitive' } },
              { email: { contains: 'AdminUser', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should handle empty pages gracefully', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(100);

      const result = await getAllUsers({ page: 99, limit: 10 });

      expect(result.users).toEqual([]);
      expect(result.pagination.page).toBe(99);
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.totalPages).toBe(10);
    });
  });
});
