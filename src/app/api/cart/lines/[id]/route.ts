import { NextRequest, NextResponse } from 'next/server';

import { ApiContext } from '@/lib/middleware/types';
import {
  OptionalAuthContext,
  withOptionalAuth,
} from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { withValidation } from '@/lib/middleware/withValidation';
import { updateCartLine, removeCartLine } from '@/lib/services/cart';
import { resolveCartIdentity } from '@/lib/services/cart/identity';
import {
  updateCartLineSchema,
  UpdateCartLineInput,
} from '@/lib/validators/cart';

async function updateCartLineHandler(
  request: NextRequest,
  { params, auth, data }: ApiContext<{ id: string }, UpdateCartLineInput>
): Promise<NextResponse> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
  const { id: cartItemId } = await params;
  const authContext = auth as OptionalAuthContext;
  const validatedData = data as UpdateCartLineInput;

  const { userId, anonymousId } = await resolveCartIdentity(authContext);

  const cart = await updateCartLine(
    cartItemId,
    validatedData,
    userId,
    anonymousId
  );

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
  { params, auth }: ApiContext<{ id: string }>
): Promise<NextResponse> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
  const { id: cartItemId } = await params;
  const authContext = auth as OptionalAuthContext;

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
