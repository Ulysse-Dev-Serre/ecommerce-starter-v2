import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '../../../../../lib/logger';
import { withError } from '../../../../../lib/middleware/withError';
import {
  OptionalAuthContext,
  withOptionalAuth,
} from '../../../../../lib/middleware/withAuth';
import {
  updateCartLine,
  removeCartLine,
} from '../../../../../lib/services/cart.service';

async function updateCartLineHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  authContext: OptionalAuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id: cartItemId } = await context.params;
  const body = await request.json();

  const { quantity } = body;

  if (!quantity || typeof quantity !== 'number' || quantity < 1) {
    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Invalid request',
        message: 'quantity must be a positive number',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  const userId = authContext.isAuthenticated ? authContext.userId : undefined;
  const cookieStore = await cookies();
  const anonymousId = cookieStore.get('cart_anonymous_id')?.value;

  logger.info(
    {
      requestId,
      action: 'update_cart_line',
      cartItemId,
      quantity,
      userId: userId ?? null,
      anonymousId: anonymousId ?? null,
    },
    'Updating cart line quantity'
  );

  try {
    const cart = await updateCartLine(
      cartItemId,
      { quantity },
      userId,
      anonymousId
    );

    logger.info(
      {
        requestId,
        action: 'cart_line_updated_successfully',
        cartItemId,
        cartId: cart.id,
      },
      'Cart line updated successfully'
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        data: cart,
        message: 'Cart line updated',
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'X-Request-ID': requestId,
        },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    logger.error(
      {
        requestId,
        action: 'update_cart_line_failed',
        error: errorMessage,
        cartItemId,
      },
      'Failed to update cart line'
    );

    if (
      errorMessage.includes('not found') ||
      errorMessage.includes('Unauthorized')
    ) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: errorMessage.includes('Unauthorized')
            ? 'Unauthorized'
            : 'Not found',
          message: errorMessage,
          timestamp: new Date().toISOString(),
        },
        { status: errorMessage.includes('Unauthorized') ? 403 : 404 }
      );
    }

    if (errorMessage.includes('stock')) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Insufficient stock',
          message: errorMessage,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    throw error;
  }
}

async function removeCartLineHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  authContext: OptionalAuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id: cartItemId } = await context.params;

  const userId = authContext.isAuthenticated ? authContext.userId : undefined;
  const cookieStore = await cookies();
  const anonymousId = cookieStore.get('cart_anonymous_id')?.value;

  logger.info(
    {
      requestId,
      action: 'remove_cart_line',
      cartItemId,
      userId: userId ?? null,
      anonymousId: anonymousId ?? null,
    },
    'Removing cart line'
  );

  try {
    const cart = await removeCartLine(cartItemId, userId, anonymousId);

    logger.info(
      {
        requestId,
        action: 'cart_line_removed_successfully',
        cartItemId,
        cartId: cart.id,
      },
      'Cart line removed successfully'
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        data: cart,
        message: 'Cart line removed',
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'X-Request-ID': requestId,
        },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    logger.error(
      {
        requestId,
        action: 'remove_cart_line_failed',
        error: errorMessage,
        cartItemId,
      },
      'Failed to remove cart line'
    );

    if (
      errorMessage.includes('not found') ||
      errorMessage.includes('Unauthorized')
    ) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: errorMessage.includes('Unauthorized')
            ? 'Unauthorized'
            : 'Not found',
          message: errorMessage,
          timestamp: new Date().toISOString(),
        },
        { status: errorMessage.includes('Unauthorized') ? 403 : 404 }
      );
    }

    throw error;
  }
}

import {
  withRateLimit,
  RateLimits,
} from '../../../../../lib/middleware/withRateLimit';

export const PUT = withError(
  withOptionalAuth(withRateLimit(updateCartLineHandler, RateLimits.CART_WRITE))
);
export const DELETE = withError(
  withOptionalAuth(withRateLimit(removeCartLineHandler, RateLimits.CART_WRITE))
);
