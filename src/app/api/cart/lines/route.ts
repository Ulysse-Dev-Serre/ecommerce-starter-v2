import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '../../../../lib/db/prisma';
import { logger } from '../../../../lib/logger';
import { withError } from '../../../../lib/middleware/withError';
import { addToCart } from '../../../../lib/services/cart.service';

async function addToCartHandler(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const body = await request.json();

  const { variantId, quantity } = body;

  if (!variantId || typeof variantId !== 'string') {
    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Invalid request',
        message: 'variantId is required',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

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
  let anonymousId = cookieStore.get('cart_anonymous_id')?.value;

  let userId: string | undefined;
  if (clerkId) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    userId = user?.id;
  }

  if (!userId && !anonymousId) {
    anonymousId = crypto.randomUUID();
  }

  logger.info(
    {
      requestId,
      action: 'add_to_cart',
      variantId,
      quantity,
      userId: userId ?? null,
      anonymousId: anonymousId ?? null,
    },
    'Adding item to cart'
  );

  try {
    const cart = await addToCart({ variantId, quantity }, userId, anonymousId);

    logger.info(
      {
        requestId,
        action: 'item_added_successfully',
        cartId: cart.id,
        itemsCount: cart.items.length,
      },
      'Item added to cart successfully'
    );

    const response = NextResponse.json(
      {
        success: true,
        requestId,
        data: cart,
        message: 'Item added to cart',
        timestamp: new Date().toISOString(),
      },
      {
        status: 201,
        headers: {
          'X-Request-ID': requestId,
        },
      }
    );

    if (!userId && anonymousId) {
      response.cookies.set('cart_anonymous_id', anonymousId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    logger.error(
      {
        requestId,
        action: 'add_to_cart_failed',
        error: errorMessage,
        variantId,
        quantity,
      },
      'Failed to add item to cart'
    );

    if (
      errorMessage.includes('not found') ||
      errorMessage.includes('not available')
    ) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Product not found',
          message: errorMessage,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
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

export const POST = withError(addToCartHandler);
