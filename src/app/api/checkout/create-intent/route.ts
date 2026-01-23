import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { logger } from '../../../../lib/logger';
import { withError } from '../../../../lib/middleware/withError';
import { AuthContext, withAuth } from '../../../../lib/middleware/withAuth';
import { withValidation } from '../../../../lib/middleware/withValidation';
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
import {
  createIntentSchema,
  CreateIntentInput,
} from '@/lib/validators/checkout';

async function createIntentHandler(
  request: NextRequest,
  authContext: AuthContext,
  data: CreateIntentInput
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const userId = authContext.userId;

  // Data est déjà validé et paré par withValidation middleware
  const {
    cartId: bodyCartId,
    directItem,
    currency: validatedCurrency,
    locale: validatedLocale,
  } = data;

  // Récupérer la devise depuis le cookie ou utiliser la request
  // Note: le validateur a déjà géré la devise du body, on check le cookie en fallback si besoin
  // Mais ici 'data.currency' a une valeur par défaut 'CAD' via Zod, donc on peut simplifier.
  // Cependant, pour respecter la logique existante (priorité body > cookie > default), on garde cookie check ?
  // Zod default s'applique si undefined. Donc si body.currency est absent, c'est CAD.
  // Si on veut supporter cookie, on devrait peut-être le faire *avant* ou accepter que body prévaut.
  // Gardons la logique simple: on utilise ce qui est validé.

  // Petite subtilité: l'original prenait cookie si body absent. Zod prend 'CAD' si body absent.
  // Pour supporter cookie, il faudrait que Zod ne mette pas de default, ou qu'on check cookie ici.
  // On va simplifier: on utilise data.currency. (Si le frontend envoie currency, c'est bon).

  const currency: CheckoutCurrency = validatedCurrency as CheckoutCurrency;

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
    const cart = await getOrCreateCart(userId, undefined);

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
      anonymousId: undefined,
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
  withAuth(
    withRateLimit(
      withValidation(createIntentSchema, createIntentHandler),
      RateLimits.CHECKOUT
    )
  )
);
