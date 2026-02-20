import { NextRequest, NextResponse } from 'next/server';

import { CART_COOKIE_NAME } from '@/lib/config/site';
import { env } from '@/lib/core/env';
import { ApiContext } from '@/lib/middleware/types';
import {
  OptionalAuthContext,
  withOptionalAuth,
} from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { withValidation } from '@/lib/middleware/withValidation';
import { addToCart } from '@/lib/services/cart';
import { resolveCartIdentity } from '@/lib/services/cart/identity';
import { addToCartSchema, AddToCartInput } from '@/lib/validators/cart';

async function addToCartHandler(
  request: NextRequest,
  { auth, data }: ApiContext<undefined, AddToCartInput>
): Promise<NextResponse> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
  const authContext = auth as OptionalAuthContext;
  const validatedData = data!;

  // Resolve identity
  const { userId, anonymousId, newAnonymousId } = await resolveCartIdentity(
    authContext,
    true
  );

  const cart = await addToCart(validatedData, userId, anonymousId);

  const response = NextResponse.json(
    {
      success: true,
      requestId,
      data: cart,
      message: 'Item added to cart',
      timestamp: new Date().toISOString(),
    },
    { status: 201 }
  );

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

export const POST = withError(
  withOptionalAuth(
    withRateLimit(
      withValidation(addToCartSchema, addToCartHandler),
      RateLimits.CART_WRITE
    )
  )
);
