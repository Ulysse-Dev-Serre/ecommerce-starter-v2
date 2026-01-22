import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { logger } from '../../../../lib/logger';
import { withError } from '../../../../lib/middleware/withError';
import { AuthContext, withAuth } from '../../../../lib/middleware/withAuth';
import {
  withRateLimit,
  RateLimits,
} from '../../../../lib/middleware/withRateLimit';
import { getOrCreateCart } from '../../../../lib/services/cart.service';
import { reserveStock } from '../../../../lib/services/inventory.service';
import {
  createPaymentIntent,
  type CheckoutCurrency,
} from '../../../../lib/stripe/checkout';
import { i18n } from '@/lib/i18n/config';

async function createIntentHandler(
  request: NextRequest,
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const userId = authContext.userId;

  const body = await request.json();
  const { cartId: bodyCartId, directItem } = body;

  // Récupérer la devise depuis le cookie ou utiliser la request
  const cookieStore = await cookies();
  const currencyCookie = cookieStore.get('currency')?.value;
  const currency: CheckoutCurrency =
    (body.currency as CheckoutCurrency) ||
    (currencyCookie as CheckoutCurrency) ||
    'CAD';

  if (currency !== 'CAD' && currency !== 'USD') {
    return NextResponse.json(
      { error: 'Invalid currency. Must be CAD or USD.' },
      { status: 400 }
    );
  }

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
    // 1. Récupérer le panier pour valider les items
    // Si bodyCartId est fourni, on essaie de le récupérer, sinon on cherche par userId/anonymous
    const cart = await getOrCreateCart(userId, undefined);

    // LOG 1: BODY REÇU
    logger.info(
      {
        bodyReceived: JSON.stringify(body, null, 2),
      },
      'DEBUG: CREATE-INTENT INPUT'
    );

    // Petite validation de sécurité : si cartId est fourni, s'assurer que c'est bien celui de l'user
    if (bodyCartId && cart.id !== bodyCartId) {
      // Potentiellement mismatch entre le client local et le serveur
      // On continue avec le 'cart' récupéré par getOrCreateCart qui est la source de vérité
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
  const locale = body.locale || i18n.defaultLocale;

  try {
    // 2. Réserver le stock (si activé)
    await reserveStock(cartItems);

    // 3. Créer le PaymentIntent
    const paymentIntent = await createPaymentIntent({
      items: cartItems,
      currency,
      userId,
      cartId: cartIdForIntent,
      anonymousId: undefined, // TODO: gérer anonymousId si besoin
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
        paymentIntentId: paymentIntent.id,
        createdIntentFull: JSON.stringify(paymentIntent, null, 2),
        isDirect: !!directItem,
      },
      'PaymentIntent created successfully'
    );

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
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
  withAuth(withRateLimit(createIntentHandler, RateLimits.CHECKOUT))
);
