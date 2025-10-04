import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';

import { logger } from '../../../../../lib/logger';
import { withError } from '../../../../../lib/middleware/withError';
import {
  updateCartLine,
  removeCartLine,
} from '../../../../../lib/services/cart.service';
import { prisma } from '../../../../../lib/db/prisma';

async function updateCartLineHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id: cartItemId } = await params;
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

  const { userId: clerkId } = await auth();
  const cookieStore = await cookies();
  const anonymousId = cookieStore.get('cart_anonymous_id')?.value;

  let userId: string | undefined;
  if (clerkId) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    userId = user?.id;
  }

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
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id: cartItemId } = await params;

  const { userId: clerkId } = await auth();
  const cookieStore = await cookies();
  const anonymousId = cookieStore.get('cart_anonymous_id')?.value;

  let userId: string | undefined;
  if (clerkId) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    userId = user?.id;
  }

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

export const PUT = withError(updateCartLineHandler);
export const DELETE = withError(removeCartLineHandler);
