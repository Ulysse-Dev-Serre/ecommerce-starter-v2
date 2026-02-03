import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/core/logger';
import { withError } from '@/lib/middleware/withError';
import {
  OptionalAuthContext,
  withOptionalAuth,
} from '@/lib/middleware/withAuth';
import { updateCartLine, removeCartLine } from '@/lib/services/cart';

import { withValidation } from '@/lib/middleware/withValidation';
import {
  updateCartLineSchema,
  UpdateCartLineInput,
} from '@/lib/validators/cart';
import { resolveCartIdentity } from '@/lib/services/cart/identity';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';

async function updateCartLineHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  authContext: OptionalAuthContext,
  data: UpdateCartLineInput
): Promise<NextResponse> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
  const { id: cartItemId } = await context.params;

  const { userId, anonymousId } = await resolveCartIdentity(authContext);

  const cart = await updateCartLine(cartItemId, data, userId, anonymousId);

  return NextResponse.json({
    success: true,
    requestId,
    data: cart,
    message: 'Cart line updated',
    timestamp: new Date().toISOString(),
  });
}

async function removeCartLineHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  authContext: OptionalAuthContext
): Promise<NextResponse> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
  const { id: cartItemId } = await context.params;

  const { userId, anonymousId } = await resolveCartIdentity(authContext);

  const cart = await removeCartLine(cartItemId, userId, anonymousId);

  return NextResponse.json({
    success: true,
    requestId,
    data: cart,
    message: 'Cart line removed',
    timestamp: new Date().toISOString(),
  });
}

export const PUT = withError(
  withOptionalAuth(
    withRateLimit(
      withValidation(updateCartLineSchema, updateCartLineHandler),
      RateLimits.CART_WRITE
    )
  )
);

export const DELETE = withError(
  withOptionalAuth(withRateLimit(removeCartLineHandler, RateLimits.CART_WRITE))
);
