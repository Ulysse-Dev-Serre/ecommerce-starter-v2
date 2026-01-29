import { NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { auth } from '@clerk/nextjs/server';

import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';

async function handler(req: Request) {
  try {
    const body = await req.json();
    const {
      eventType,
      eventName,
      path,
      anonymousId,
      metadata,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    const { userId: clerkId } = await auth();
    let dbUserId = null;

    if (clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });
      dbUserId = user?.id;
    }

    const event = await prisma.analyticsEvent.create({
      data: {
        eventType,
        eventName,
        path,
        anonymousId,
        metadata,
        userId: dbUserId,
        utmSource,
        utmMedium,
        utmCampaign,
      },
    });

    return NextResponse.json({ success: true, id: event.id });
  } catch (error) {
    console.error('[ANALYTICS_EVENT_POST]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export const POST = withError(withRateLimit(handler, RateLimits.PUBLIC));
