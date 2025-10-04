import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';

import { logger } from '../../../../lib/logger';
import { withError } from '../../../../lib/middleware/withError';
import { mergeAnonymousCartToUser } from '../../../../lib/services/cart.service';
import { prisma } from '../../../../lib/db/prisma';

async function mergeCartHandler(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'User not found',
        message: 'User account not synchronized',
        timestamp: new Date().toISOString(),
      },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();
  const anonymousId = cookieStore.get('cart_anonymous_id')?.value;

  if (!anonymousId) {
    logger.info(
      {
        requestId,
        action: 'merge_cart_skipped',
        userId: user.id,
        reason: 'no_anonymous_id',
      },
      'No anonymous cart to merge'
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        message: 'No anonymous cart to merge',
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'X-Request-ID': requestId,
        },
      }
    );
  }

  logger.info(
    {
      requestId,
      action: 'merge_cart_request',
      userId: user.id,
      anonymousId,
    },
    'Merging anonymous cart to user cart'
  );

  const cart = await mergeAnonymousCartToUser(user.id, anonymousId);

  logger.info(
    {
      requestId,
      action: 'merge_cart_success',
      userId: user.id,
      cartId: cart.id,
      itemsCount: cart.items.length,
    },
    'Cart merged successfully'
  );

  const response = NextResponse.json(
    {
      success: true,
      requestId,
      data: cart,
      message: 'Cart merged successfully',
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'X-Request-ID': requestId,
      },
    }
  );

  response.cookies.delete('cart_anonymous_id');

  return response;
}

export const POST = withError(mergeCartHandler);
