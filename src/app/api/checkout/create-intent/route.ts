import { NextRequest, NextResponse } from 'next/server';

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
import { AppError, ErrorCode } from '@/lib/types/api/errors';

async function createIntentHandler(
  request: NextRequest,
  authContext: OptionalAuthContext,
  data: CreateIntentInput
): Promise<NextResponse> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
  const { userId, anonymousId } = await resolveCartIdentity(authContext);

  const { cartId: bodyCartId, directItem, locale: validatedLocale } = data;

  const currency: CheckoutCurrency = SITE_CURRENCY;
  const locale = validatedLocale || i18n.defaultLocale;

  let cartItems: { variantId: string; quantity: number }[] = [];
  let cartIdForIntent: string | undefined = undefined;

  // Mode 1: Achat Direct (Direct Item)
  if (directItem) {
    cartItems = [
      {
        variantId: directItem.variantId,
        quantity: directItem.quantity,
      },
    ];
    cartIdForIntent = 'direct_purchase';
  } else {
    // Mode 2: Panier (Standard)
    const cart = await getOrCreateCart(userId, anonymousId);

    if (bodyCartId && cart.id !== bodyCartId) {
      // Logic for cart ID mismatch could be added here if needed
    }

    if (cart.items.length === 0) {
      throw new AppError(ErrorCode.INVALID_INPUT, 'Cart is empty.', 400);
    }

    cartItems = cart.items.map(item => ({
      variantId: item.variant.id,
      quantity: item.quantity,
    }));
    cartIdForIntent = cart.id;
  }

  // 1. Réserver le stock
  await reserveStock(cartItems);

  // 2. Créer le PaymentIntent
  const paymentIntent = await createPaymentIntent({
    items: cartItems,
    currency,
    userId,
    cartId: cartIdForIntent,
    anonymousId,
    metadata: {
      locale,
      requestId,
      ...(directItem
        ? {
            isDirectPurchase: 'true',
            directVariantId: directItem.variantId,
            directQuantity: directItem.quantity.toString(),
          }
        : {}),
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.clientSecret,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    requestId,
  });
}

export const POST = withError(
  withOptionalAuth(
    withRateLimit(
      withValidation(createIntentSchema, createIntentHandler),
      RateLimits.CHECKOUT
    )
  )
);
