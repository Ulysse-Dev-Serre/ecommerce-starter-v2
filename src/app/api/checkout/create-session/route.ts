import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '../../../../lib/logger';
import { withError } from '../../../../lib/middleware/withError';
import {
  OptionalAuthContext,
  withOptionalAuth,
} from '../../../../lib/middleware/withAuth';
import {
  withRateLimit,
  RateLimits,
} from '../../../../lib/middleware/withRateLimit';
import { getOrCreateCart } from '../../../../lib/services/cart.service';
import { reserveStock } from '../../../../lib/services/inventory.service';
import { createCheckoutSession } from '../../../../lib/stripe/checkout';
import { validateCreateCheckoutSession } from '../../../../lib/utils/validation';

async function createSessionHandler(
  request: NextRequest,
  authContext: OptionalAuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  let userId: string | undefined;
  let anonymousId: string | undefined;

  if (authContext.isAuthenticated) {
    userId = authContext.userId;
  } else {
    const cookieStore = await cookies();
    anonymousId = cookieStore.get('cart_anonymous_id')?.value;
  }

  if (!userId && !anonymousId) {
    return NextResponse.json(
      { error: 'No cart found. Please add items to cart first.' },
      { status: 400 }
    );
  }

  const body = await request.json();

  let successUrl: string | undefined;
  let cancelUrl: string | undefined;

  try {
    const validated = validateCreateCheckoutSession(body);
    successUrl = validated.successUrl;
    cancelUrl = validated.cancelUrl;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Invalid request data',
      },
      { status: 400 }
    );
  }

  // Support 2 modes: items directs OU panier
  let cartItems: Array<{ variantId: string; quantity: number }>;
  let cartId: string | undefined;

  if (body.items && Array.isArray(body.items)) {
    // Mode 1: Items directs (checkout sans panier)
    cartItems = body.items;

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: 'No items provided for checkout.' },
        { status: 400 }
      );
    }
  } else {
    // Mode 2: Utiliser le panier existant
    const cart = await getOrCreateCart(userId, anonymousId);

    if (cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty. Add items before checkout.' },
        { status: 400 }
      );
    }

    cartId = cart.id; // Sauvegarder le cartId pour les métadonnées Stripe
    cartItems = cart.items.map(item => ({
      variantId: item.variant.id,
      quantity: item.quantity,
    }));
  }

  logger.info(
    {
      requestId,
      userId: userId ?? null,
      cartId: cartId ?? null,
      itemsCount: cartItems.length,
    },
    'Creating checkout session'
  );

  try {
    await reserveStock(cartItems);

    const baseUrl = request.headers.get('origin') || 'http://localhost:3000';

    // Créer une session Stripe avec les items
    const session = await createCheckoutSession({
      items: cartItems,
      userId,
      cartId, // Passer le cartId pour les métadonnées
      anonymousId,
      successUrl:
        successUrl ||
        `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: cancelUrl || `${baseUrl}/cart`,
    });

    logger.info(
      {
        requestId,
        sessionId: session.id,
      },
      'Checkout session created successfully'
    );

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    logger.error(
      {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to create checkout session'
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}

export const POST = withError(
  withOptionalAuth(withRateLimit(createSessionHandler, RateLimits.CHECKOUT))
);
