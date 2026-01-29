import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '../../../../../lib/core/db';
import { logger } from '../../../../../lib/core/logger';

import { withError } from '../../../../../lib/middleware/withError';
import {
  withRateLimit,
  RateLimits,
} from '../../../../../lib/middleware/withRateLimit';

async function handler(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  // Remove internal try-catch to let withError handle it?
  // Code has complex logic inside try, so I will keep try-catch and just wrap for rate limit + error safety
  try {
    // Get total webhook events
    const totalEvents = await prisma.webhookEvent.count({
      where: { source: 'stripe' },
    });

    // Get processed events
    const processedEvents = await prisma.webhookEvent.count({
      where: { source: 'stripe', processed: true },
    });

    // Get pending events
    const pendingEvents = await prisma.webhookEvent.count({
      where: { source: 'stripe', processed: false },
    });

    // Get failed events (with retries)
    const failedEvents = await prisma.webhookEvent.count({
      where: {
        source: 'stripe',
        retryCount: { gt: 0 },
      },
    });

    // Get events max retries reached
    const maxRetriesReached = await prisma.webhookEvent.count({
      where: {
        source: 'stripe',
        retryCount: { gte: 3 }, // Assuming maxRetries = 3
      },
    });

    // Get event type breakdown
    const eventTypeBreakdown = await prisma.webhookEvent.groupBy({
      by: ['eventType'],
      where: { source: 'stripe' },
      _count: true,
    });

    // Get recent failures
    const recentFailures = await prisma.webhookEvent.findMany({
      where: {
        source: 'stripe',
        retryCount: { gt: 0 },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        eventId: true,
        eventType: true,
        retryCount: true,
        lastError: true,
        createdAt: true,
      },
    });

    const successRate =
      totalEvents > 0
        ? ((processedEvents / totalEvents) * 100).toFixed(2)
        : 'N/A';

    const stats = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalEvents,
        processed: processedEvents,
        pending: pendingEvents,
        failedWithRetries: failedEvents,
        maxRetriesReached,
        successRate: `${successRate}%`,
      },
      eventTypeBreakdown: eventTypeBreakdown.map(item => ({
        type: item.eventType,
        count: item._count,
      })),
      recentFailures,
    };

    logger.info(
      {
        requestId,
        totalEvents,
        processedEvents,
        pendingEvents,
        failedEvents,
      },
      'Webhook status retrieved'
    );

    return NextResponse.json(stats);
  } catch (error) {
    // Keep original error logging/handling if needed, but withError catches bubbles too.
    logger.error(
      {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to retrieve webhook status'
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to retrieve status',
      },
      { status: 500 }
    );
  }
}

// Applying ADMIN rate limit because this seems to be an admin status route, or WEBHOOK?
// It reveals internal stats, so it should probably be ADMIN or very strict.
// Path is src/app/api/webhooks/stripe/status/route.ts
// It seems to be unprotected? The handler doesn't check for auth?
// If it's a public route exposing stats, that's a security risk potentially.
// I see no auth check in the original code.
// I will apply RateLimits.ADMIN but wait... if it is not authed, ADMIN rate limit doesn't protect access.
// Ideally it should have withAdmin. But maybe it's used by a monitoring tool?
// I will apply RateLimits.WEBHOOK (100/min) for now or similar, but maybe verify if it should be protected.
// Given it is in 'webhooks', maybe it is intended for external monitoring?
// But it uses prisma directly.
// I will use RateLimits.ADMIN (30/min) effectively treating it as sensitive.

export const GET = withError(withRateLimit(handler, RateLimits.ADMIN));
