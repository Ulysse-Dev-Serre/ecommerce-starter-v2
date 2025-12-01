import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '../../../../../lib/db/prisma';
import { logger } from '../../../../../lib/logger';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

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
