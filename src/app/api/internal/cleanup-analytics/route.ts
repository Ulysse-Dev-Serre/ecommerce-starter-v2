import { NextRequest, NextResponse } from 'next/server';
import { withError } from '@/lib/middleware/withError';
import { AnalyticsService } from '@/lib/services/analytics/analytics.service';
import { ApiContext } from '@/lib/middleware/types';

/**
 * GET /api/internal/cleanup-analytics
 * Automated cron job to cleanup old analytics events.
 * It deletes events older than 14 days.
 */
async function cleanupHandler(
  request: NextRequest,
  _context: ApiContext
): Promise<NextResponse> {
  // Verification for Vercel Cron security
  const authHeader = request.headers.get('authorization');

  // If CRON_SECRET is defined in Vercel, we enforce it
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const deletedCount = await AnalyticsService.cleanupEvents(14);

  return NextResponse.json({
    successSize: true,
    deletedCount,
    message: `Cleaned up ${deletedCount} analytics events older than 14 days.`,
  });
}

export const GET = withError(cleanupHandler);
