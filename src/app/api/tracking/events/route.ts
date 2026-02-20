import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import { ApiContext } from '@/lib/middleware/types';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { withValidation } from '@/lib/middleware/withValidation';
import { AnalyticsService } from '@/lib/services/analytics/analytics.service';
import {
  analyticsEventSchema,
  type AnalyticsEventInput,
} from '@/lib/validators/analytics';

async function handler(
  _request: NextRequest,
  { data }: ApiContext<undefined, AnalyticsEventInput>
) {
  const { userId: clerkId } = await auth();

  // Delegate to service
  const event = await AnalyticsService.trackEvent(data!, clerkId);

  return NextResponse.json({ success: true, id: event.id });
}

export const POST = withError(
  withRateLimit(
    withValidation(analyticsEventSchema, handler),
    RateLimits.PUBLIC
  )
);
