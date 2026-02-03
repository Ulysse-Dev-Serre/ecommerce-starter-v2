import { z } from 'zod';

/**
 * Validator for analytics events
 */
export const analyticsEventSchema = z.object({
  eventType: z.string().min(1, "Type d'événement requis"),
  eventName: z.string().optional(),
  path: z.string().optional(),
  anonymousId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
