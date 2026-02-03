import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { AnalyticsService } from '@/lib/services/analytics/analytics.service';
import { analyticsEventSchema } from '@/lib/validators/analytics';
import { logger } from '@/lib/core/logger';

async function handler(req: Request) {
  try {
    const json = await req.json();

    // Validate request body
    const result = analyticsEventSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.format() },
        { status: 400 }
      );
    }

    const { userId: clerkId } = await auth();

    // Delegate to service
    const event = await AnalyticsService.trackEvent(result.data, clerkId);

    return NextResponse.json({ success: true, id: event.id });
  } catch (error) {
    logger.error({ error }, '[ANALYTICS_EVENT_POST] Error');
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export const POST = withError(withRateLimit(handler, RateLimits.PUBLIC));
