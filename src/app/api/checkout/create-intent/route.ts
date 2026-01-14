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

async function createIntentHandler(
  request: NextRequest,
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const userId = authContext.userId;

  const body = await request.json();
  const { cartId: bodyCartId } = body;

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

  const cartItems = cart.items.map(item => ({
    variantId: item.variant.id,
    quantity: item.quantity,
  }));

  try {
    // 2. Réserver le stock (si activé)
    await reserveStock(cartItems);

    // 3. Créer le PaymentIntent
    const paymentIntent = await createPaymentIntent({
      items: cartItems,
      currency,
      userId,
      cartId: cart.id,
      anonymousId: undefined, // TODO: gérer anonymousId si besoin
    });

    // LOG 2: INTENT CRÉÉ
    logger.info(
      {
        requestId,
        paymentIntentId: paymentIntent.id,
        createdIntentFull: JSON.stringify(paymentIntent, null, 2),
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
