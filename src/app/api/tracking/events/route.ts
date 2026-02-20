import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { AnalyticsService } from '@/lib/services/analytics/analytics.service';
import {
  analyticsEventSchema,
  type AnalyticsEventInput,
} from '@/lib/validators/analytics';
import { logger } from '@/lib/core/logger';
import { withValidation } from '@/lib/middleware/withValidation';
import { ApiContext } from '@/lib/middleware/types';

async function handler(
  request: NextRequest,
  { data }: ApiContext<any, AnalyticsEventInput>
) {
  const validatedData = data as AnalyticsEventInput;
  const { userId: clerkId } = await auth();

  // Delegate to service
  const event = await AnalyticsService.trackEvent(validatedData, clerkId);

  return NextResponse.json({ success: true, id: event.id });
}

export const POST = withError(
  withRateLimit(
    withValidation(analyticsEventSchema, handler),
    RateLimits.PUBLIC
  )
);
