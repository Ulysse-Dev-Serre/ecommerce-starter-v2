import { NextRequest, NextResponse } from 'next/server';

import { CART_COOKIE_NAME } from '@/lib/config/site';
import { ApiContext } from '@/lib/middleware/types';
import { AuthContext, withAuth } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { mergeAnonymousCartToUser } from '@/lib/services/cart';

async function mergeCartHandler(
  request: NextRequest,
  { auth }: ApiContext
): Promise<NextResponse> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
  const authContext = auth as AuthContext;
  const anonymousId = request.cookies.get(CART_COOKIE_NAME)?.value;

  if (!anonymousId) {
    return NextResponse.json({
      success: true,
      requestId,
      message: 'No anonymous cart to merge',
      timestamp: new Date().toISOString(),
    });
  }

  const cart = await mergeAnonymousCartToUser(authContext.userId, anonymousId);

  const response = NextResponse.json({
    success: true,
    requestId,
    data: cart,
    message: 'Cart merged successfully',
    timestamp: new Date().toISOString(),
  });

  // Clear the anonymous cart cookie
  response.cookies.delete(CART_COOKIE_NAME);

  return response;
}

export const POST = withError(
  withAuth(withRateLimit(mergeCartHandler, RateLimits.PUBLIC))
);
