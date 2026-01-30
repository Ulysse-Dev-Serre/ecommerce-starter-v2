import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { logger } from '@/lib/core/logger';
import { withError } from '@/lib/middleware/withError';
import {
  OptionalAuthContext,
  withOptionalAuth,
} from '@/lib/middleware/withAuth';
import { withValidation } from '@/lib/middleware/withValidation';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { getOrCreateCart } from '@/lib/services/cart';
import { reserveStock } from '@/lib/services/inventory';
import { createPaymentIntent } from '@/lib/services/payments';
import { CheckoutCurrency } from '@/lib/types/domain/checkout';
import { SITE_CURRENCY } from '@/lib/config/site';
import { i18n } from '@/lib/i18n/config';
import {
  createIntentSchema,
  type CreateIntentInput,
} from '@/lib/validators/checkout';
import { resolveCartIdentity } from '@/lib/services/cart/identity';

async function createIntentHandler(
  request: NextRequest,
  authContext: OptionalAuthContext,
  data: CreateIntentInput
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { userId, anonymousId } = await resolveCartIdentity(authContext);

  // Data est déjà validé et paré par withValidation middleware
  const {
    cartId: bodyCartId,
    directItem,
    // currency: validatedCurrency, // <- We ignore this for security
    locale: validatedLocale,
  } = data;

  // SECURITY ENFORCEMENT:
  // We strictly use the server-side configured SITE_CURRENCY.
  // We ignore whatever the client sent in 'currency' to prevent rate arbitrage attacks.
  const currency: CheckoutCurrency = SITE_CURRENCY;

  let cartItems: { variantId: string; quantity: number }[] = [];
  let cartIdForIntent: string | undefined = undefined;

  // Mode 1: Achat Direct (Direct Item)
  if (directItem) {
    logger.info({ directItem }, 'Processing direct purchase intent');
    cartItems = [
      {
        variantId: directItem.variantId,
        quantity: directItem.quantity,
      },
    ];
    // Pas de cartId dans ce cas
    cartIdForIntent = 'direct_purchase';
  } else {
    // Mode 2: Panier (Standard)
    const cart = await getOrCreateCart(userId, anonymousId);

    // LOG 1: BODY REÇU
    logger.info(
      {
        bodyReceived: JSON.stringify(data, null, 2),
      },
      'DEBUG: CREATE-INTENT INPUT'
    );

    if (bodyCartId && cart.id !== bodyCartId) {
      logger.warn(
        { reqCartId: bodyCartId, userCartId: cart.id },
        'Cart ID mismatch, using user cart'
      );
    }

    if (cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }

    cartItems = cart.items.map(item => ({
      variantId: item.variant.id,
      quantity: item.quantity,
    }));
    cartIdForIntent = cart.id;
  }

  // 3. Créer le PaymentIntent
  const locale = validatedLocale || i18n.defaultLocale;

  try {
    // 2. Réserver le stock (si activé)
    await reserveStock(cartItems);

    // 3. Créer le PaymentIntent
    const paymentIntent = await createPaymentIntent({
      items: cartItems,
      currency,
      userId,
      cartId: cartIdForIntent,
      anonymousId,
      metadata: {
        locale,
        ...(directItem
          ? {
              isDirectPurchase: 'true',
              directVariantId: directItem.variantId,
              directQuantity: directItem.quantity.toString(),
            }
          : {}),
      },
    });

    // LOG 2: INTENT CRÉÉ
    logger.info(
      {
        requestId,
        paymentIntentId: paymentIntent.paymentIntentId,
        createdIntentFull: JSON.stringify(paymentIntent, null, 2),
        isDirect: !!directItem,
      },
      'PaymentIntent created successfully'
    );

    return NextResponse.json({
      clientSecret: paymentIntent.clientSecret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    logger.error(
      {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to create payment intent'
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create payment intent',
      },
      { status: 500 }
    );
  }
}

export const POST = withError(
  withOptionalAuth(
    withRateLimit(
      withValidation(createIntentSchema, createIntentHandler),
      RateLimits.CHECKOUT
    )
  )
);
