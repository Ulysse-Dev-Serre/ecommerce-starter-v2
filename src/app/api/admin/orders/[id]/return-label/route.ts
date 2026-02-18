import { NextRequest, NextResponse } from 'next/server';
import { createReturnLabel } from '@/lib/services/orders/order-fulfillment.service';
import { logger } from '@/lib/core/logger';
import { withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import type { AuthContext } from '@/lib/middleware/withAuth';

async function handler(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
  _authContext: AuthContext
) {
  const { id } = await context.params;

  try {
    const { searchParams } = new URL(req.url);
    const isPreview = searchParams.get('preview') === 'true';

    const result = await createReturnLabel(id, isPreview);

    return NextResponse.json({
      success: true,
      message: 'Return label created and sent to customer',
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;

    logger.error(
      {
        error: {
          message,
          stack,
          ...(typeof error === 'object' ? error : {}),
        },
        orderId: id,
      },
      'Failed to create return label'
    );

    const status = message === 'Order not found' ? 404 : 500;

    return NextResponse.json(
      {
        success: false,
        message: message || 'Failed to create return label',
      },
      { status }
    );
  }
}

export const POST = withError(
  withAdmin(withRateLimit(handler, RateLimits.ADMIN))
);
