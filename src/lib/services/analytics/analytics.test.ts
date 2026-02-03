import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService } from './analytics.service';
import { prisma } from '@/lib/core/db';

// Mock Prisma
vi.mock('@/lib/core/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    analyticsEvent: {
      create: vi.fn(),
    },
  },
}));

// Mock Logger
vi.mock('@/lib/core/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackEvent', () => {
    const mockData = {
      eventType: 'page_view',
      eventName: 'Home',
      path: '/',
      anonymousId: 'anon-123',
    };

    it('should track an event without deep user lookup if clerkId is not provided', async () => {
      const mockEvent = { id: 'evt-123', ...mockData, userId: null };
      vi.mocked(prisma.analyticsEvent.create).mockResolvedValue(
        mockEvent as any
      );

      const result = await AnalyticsService.trackEvent(mockData);

      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'page_view',
          userId: null,
          anonymousId: 'anon-123',
        }),
      });
      expect(result).toEqual(mockEvent);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should look up DB user if clerkId is provided', async () => {
      const clerkId = 'user_clerk_123';
      const dbUserId = 'db_user_123';
      const mockEvent = { id: 'evt-123', ...mockData, userId: dbUserId };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: dbUserId,
      } as any);
      vi.mocked(prisma.analyticsEvent.create).mockResolvedValue(
        mockEvent as any
      );

      const result = await AnalyticsService.trackEvent(mockData, clerkId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId },
        select: { id: true },
      });
      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: dbUserId,
        }),
      });
      expect(result).toEqual(mockEvent);
    });

    it('should handle user not found gracefully and set userId to null', async () => {
      const clerkId = 'unknown_clerk_id';
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.analyticsEvent.create).mockResolvedValue({
        id: 'evt-123',
      } as any);

      await AnalyticsService.trackEvent(mockData, clerkId);

      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
        }),
      });
    });

    it('should throw and log error if creation fails', async () => {
      const error = new Error('DB Error');
      vi.mocked(prisma.analyticsEvent.create).mockRejectedValue(error);

      await expect(AnalyticsService.trackEvent(mockData)).rejects.toThrow(
        'DB Error'
      );
    });
  });
});
