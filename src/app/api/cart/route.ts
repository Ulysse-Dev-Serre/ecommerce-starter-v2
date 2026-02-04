import { NextRequest, NextResponse } from 'next/server';

import { withError } from '@/lib/middleware/withError';
import {
  OptionalAuthContext,
  withOptionalAuth,
} from '@/lib/middleware/withAuth';
import { getOrCreateCart } from '@/lib/services/cart';
import { resolveCartIdentity } from '@/lib/services/cart/identity';
import { env } from '@/lib/core/env';
import { CART_COOKIE_NAME } from '@/lib/config/site';

async function getCartHandler(
  request: NextRequest,
  authContext: OptionalAuthContext
): Promise<NextResponse> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();

  // Resolve identity
  const { userId, anonymousId, newAnonymousId } = await resolveCartIdentity(
    authContext,
    true
  );

  const cart = await getOrCreateCart(userId, anonymousId);

  const response = NextResponse.json({
    success: true,
    requestId,
    data: cart,
    timestamp: new Date().toISOString(),
  });

  if (newAnonymousId) {
    response.cookies.set(CART_COOKIE_NAME, newAnonymousId, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });
  }

  return response;
}

import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';

export const GET = withError(
  withOptionalAuth(withRateLimit(getCartHandler, RateLimits.PUBLIC))
);
