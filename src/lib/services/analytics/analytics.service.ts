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
}
