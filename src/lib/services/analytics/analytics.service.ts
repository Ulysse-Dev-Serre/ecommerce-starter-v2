import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { AnalyticsEventInput } from '@/lib/validators/analytics';

/**
 * Service to handle analytics events
 */
export class AnalyticsService {
  /**
   * Track a new analytics event
   */
  static async trackEvent(data: AnalyticsEventInput, clerkId?: string | null) {
    try {
      let dbUserId = null;

      // If clerkId is provided, find the corresponding DB user
      if (clerkId) {
        const user = await prisma.user.findUnique({
          where: { clerkId },
          select: { id: true },
        });
        dbUserId = user?.id ?? null;
      }

      // Create the event in DB
      const event = await prisma.analyticsEvent.create({
        data: {
          eventType: data.eventType,
          eventName: data.eventName,
          path: data.path,
          anonymousId: data.anonymousId,
          metadata: data.metadata as any,
          userId: dbUserId,
          utmSource: data.utmSource,
          utmMedium: data.utmMedium,
          utmCampaign: data.utmCampaign,
        },
      });

      logger.info(
        { eventId: event.id, eventType: event.eventType },
        'Analytics event tracked'
      );

      return event;
    } catch (error) {
      logger.error({ error, data, clerkId }, 'Failed to track analytics event');
      throw error;
    }
  }

  /**
   * Get analytics summary for a given period
   */
  static async getAnalyticsSummary(days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 1. Fetch Funnel Data (Analytics Events)
      const [sessions, productViews, cartAdds, checkouts] = await Promise.all([
        prisma.analyticsEvent.count({
          where: { eventType: 'page_view', createdAt: { gte: startDate } },
        }),
        prisma.analyticsEvent.count({
          where: { eventType: 'view_item', createdAt: { gte: startDate } },
        }),
        prisma.analyticsEvent.count({
          where: { eventType: 'add_to_cart', createdAt: { gte: startDate } },
        }),
        prisma.analyticsEvent.count({
          where: { eventType: 'begin_checkout', createdAt: { gte: startDate } },
        }),
      ]);

      // 2. Fetch Purchase Data (Orders)
      const purchases = await prisma.order.count({
        where: {
          createdAt: { gte: startDate },
          status: { not: 'CANCELLED' },
        },
      });

      // 3. Fetch Source Data (UTM Attribution)
      const sourceStats = await prisma.order.groupBy({
        by: ['utmSource'],
        _count: { _all: true },
        _sum: { totalAmount: true },
        where: { createdAt: { gte: startDate } },
      });

      const sourceVisitors = await prisma.analyticsEvent.groupBy({
        by: ['utmSource'],
        _count: { _all: true },
        where: { eventType: 'page_view', createdAt: { gte: startDate } },
      });

      return {
        funnel: {
          sessions,
          productViews,
          cartAdds,
          checkouts,
          purchases,
        },
        sourceVisitors,
        sourceStats,
      };
    } catch (error) {
      logger.error({ error, days }, 'Failed to fetch analytics summary');
      throw error;
    }
  }

  /**
   * Cleanup old analytics events
   */
  static async cleanupEvents(days: number = 14) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const deleted = await prisma.analyticsEvent.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.info(
        { deletedCount: deleted.count, cutoffDate },
        'Analytics events cleaned up'
      );

      return deleted.count;
    } catch (error) {
      logger.error({ error, days }, 'Failed to cleanup analytics events');
      throw error;
    }
  }
}
