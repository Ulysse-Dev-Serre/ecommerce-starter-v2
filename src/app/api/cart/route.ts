import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '../../../lib/db/prisma';
import { logger } from '../../../lib/logger';
import { withError } from '../../../lib/middleware/withError';
import { getOrCreateCart } from '../../../lib/services/cart.service';

async function getCartHandler(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  // Check for test bypass
  const testApiKey = request.headers.get('x-test-api-key');
  let userId: string | undefined;
  let anonymousId: string | undefined;

  if (
    testApiKey &&
    process.env.TEST_API_KEY &&
    testApiKey === process.env.TEST_API_KEY &&
    process.env.NODE_ENV !== 'production'
  ) {
    // Test mode: use test user
    const clerkTestUserId =
      process.env.CLERK_TEST_USER_ID || 'user_35FXh55upbdX9L0zj1bjnrFCAde';
    const testUser = await prisma.user.findUnique({
      where: { clerkId: clerkTestUserId },
      select: { id: true },
    });
    userId = testUser?.id;
  } else {
    // Normal mode: use Clerk auth
    const { userId: clerkId } = await auth();
    const cookieStore = await cookies();
    anonymousId = cookieStore.get('cart_anonymous_id')?.value;

    if (clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });
      userId = user?.id;
    }
  }

  logger.info(
    {
      requestId,
      action: 'get_cart',
      userId: userId ?? null,
      anonymousId: anonymousId ?? null,
    },
    'Fetching cart'
  );

  const cart = await getOrCreateCart(userId, anonymousId);

  logger.info(
    {
      requestId,
      action: 'cart_fetched_successfully',
      cartId: cart.id,
      itemsCount: cart.items.length,
    },
    `Cart retrieved with ${cart.items.length} items`
  );

  const response = NextResponse.json(
    {
      success: true,
      requestId,
      data: cart,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'X-Request-ID': requestId,
      },
    }
  );

  if (!userId && !anonymousId) {
    const newAnonymousId = crypto.randomUUID();
    response.cookies.set('cart_anonymous_id', newAnonymousId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 jours
    });

    logger.info(
      {
        requestId,
        action: 'anonymous_id_created',
        anonymousId: newAnonymousId,
      },
      'Created anonymous cart ID'
    );
  }

  return response;
}

export const GET = withError(getCartHandler);
