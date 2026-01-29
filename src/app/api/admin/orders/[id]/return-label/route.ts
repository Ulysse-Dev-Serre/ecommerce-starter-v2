import { NextRequest, NextResponse } from 'next/server';
import { createReturnLabel } from '@/lib/services/orders';
import { logger } from '@/lib/core/logger';
import { withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import type { AuthContext } from '@/lib/middleware/withAuth';

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  authContext: AuthContext
) {
  const { id } = await params;

  try {
    const { searchParams } = new URL(req.url);
    const isPreview = searchParams.get('preview') === 'true';

    const result = await createReturnLabel(id, isPreview);

    return NextResponse.json({
      success: true,
      message: 'Return label created and sent to customer',
      data: result,
    });
  } catch (error: any) {
    logger.error(
      {
        error: {
          message: error.message,
          stack: error.stack,
          ...error,
        },
        orderId: id,
      },
      'Failed to create return label'
    );
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create return label',
      },
      { status: 500 }
    );
  }
}

export const POST = withError(withAdmin(handler));
