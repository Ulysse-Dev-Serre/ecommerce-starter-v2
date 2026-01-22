import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '../../../lib/logger';
import { withError } from '../../../lib/middleware/withError';
import {
  OptionalAuthContext,
  withOptionalAuth,
} from '../../../lib/middleware/withAuth';
import { getOrCreateCart } from '../../../lib/services/cart.service';

async function getCartHandler(
  request: NextRequest,
  authContext: OptionalAuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  let userId: string | undefined;
  let anonymousId: string | undefined;
  let newAnonymousId: string | undefined;

  if (authContext.isAuthenticated) {
    userId = authContext.userId;
  } else {
    const cookieStore = await cookies();
    anonymousId = cookieStore.get('cart_anonymous_id')?.value;

    // Créer un nouvel ID anonyme si nécessaire
    if (!anonymousId) {
      newAnonymousId = crypto.randomUUID();
      anonymousId = newAnonymousId;
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

  // Set cookie si nouvel ID anonyme créé
  if (newAnonymousId) {
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

import {
  withRateLimit,
  RateLimits,
} from '../../../lib/middleware/withRateLimit';

export const GET = withError(
  withOptionalAuth(withRateLimit(getCartHandler, RateLimits.PUBLIC))
);
