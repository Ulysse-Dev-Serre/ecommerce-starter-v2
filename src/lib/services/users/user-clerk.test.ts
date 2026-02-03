import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserClerkService } from './user-clerk.service';
import { prisma } from '@/lib/core/db';
import { UserRole } from '@/generated/prisma';

// Mock Prisma
vi.mock('@/lib/core/db', () => ({
  prisma: {
    user: {
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('UserClerkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleUserCreated', () => {
    it('should create a user with minimal fields', async () => {
      const payload: any = {
        id: 'clerk_123',
        email_addresses: [{ email_address: 'test@example.com' }],
        first_name: 'John',
        last_name: 'Doe',
      };

      vi.mocked(prisma.user.create).mockResolvedValue({ id: 'db_1' } as any);

      await UserClerkService.handleUserCreated(payload);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          clerkId: 'clerk_123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          imageUrl: '',
          role: UserRole.CLIENT,
        },
      });
    });

    it('should respect role in metadata', async () => {
      const payload: any = {
        id: 'clerk_admin',
        email_addresses: [{ email_address: 'admin@example.com' }],
        public_metadata: { role: UserRole.ADMIN },
      };

      vi.mocked(prisma.user.create).mockResolvedValue({ id: 'db_2' } as any);

      await UserClerkService.handleUserCreated(payload);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: UserRole.ADMIN,
          }),
        })
      );
    });
  });

  describe('handleUserUpdated', () => {
    it('should update user fields', async () => {
      const payload: any = {
        id: 'clerk_123',
        first_name: 'Jane',
        public_metadata: { role: UserRole.ADMIN },
      };

      vi.mocked(prisma.user.update).mockResolvedValue({ id: 'db_1' } as any);

      await UserClerkService.handleUserUpdated(payload);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { clerkId: 'clerk_123' },
        data: expect.objectContaining({
          firstName: 'Jane',
          role: UserRole.ADMIN,
        }),
      });
    });
  });

  describe('handleUserDeleted', () => {
    it('should delete user by clerkId', async () => {
      vi.mocked(prisma.user.deleteMany).mockResolvedValue({ count: 1 });

      await UserClerkService.handleUserDeleted({ id: 'clerk_del' } as any);

      expect(prisma.user.deleteMany).toHaveBeenCalledWith({
        where: { clerkId: 'clerk_del' },
      });
    });
  });
});
