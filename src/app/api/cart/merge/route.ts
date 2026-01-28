import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/core/logger';
import { AuthContext, withAuth } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { env } from '@/lib/core/env';
import { mergeAnonymousCartToUser } from '@/lib/services/cart.service';
import { CART_COOKIE_NAME } from '@/lib/config/site';

async function mergeCartHandler(
  _request: NextRequest,
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  const cookieStore = await cookies();
  const anonymousId = cookieStore.get(CART_COOKIE_NAME)?.value;

  if (!anonymousId) {
    logger.info(
      {
        requestId,
        action: 'merge_cart_skipped',
        userId: authContext.userId,
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
      userId: authContext.userId,
      anonymousId,
    },
    'Merging anonymous cart to user cart'
  );

  const cart = await mergeAnonymousCartToUser(authContext.userId, anonymousId);

  logger.info(
    {
      requestId,
      action: 'merge_cart_success',
      userId: authContext.userId,
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

  response.cookies.set(CART_COOKIE_NAME, '', {
    path: '/',
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}

import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';

export const POST = withError(
  withAuth(withRateLimit(mergeCartHandler, RateLimits.PUBLIC))
);
