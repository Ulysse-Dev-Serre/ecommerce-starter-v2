import { NextRequest, NextResponse } from 'next/server';

import { logger } from '../../../../lib/logger';
import { withError } from '../../../../lib/middleware/withError';
import { AuthContext, withAuth } from '../../../../lib/middleware/withAuth';
import {
  withRateLimit,
  RateLimits,
} from '../../../../lib/middleware/withRateLimit';
import { stripe } from '../../../../lib/stripe/client';
import { toStripeAmount } from '../../../../lib/utils/currency';

async function updateIntentHandler(
  request: NextRequest,
  authContext: AuthContext
): Promise<NextResponse> {
  const body = await request.json();
  const { paymentIntentId, shippingRate, currency } = body;

  if (!paymentIntentId || !shippingRate) {
    return NextResponse.json(
      { error: 'Missing paymentIntentId or shippingRate' },
      { status: 400 }
    );
  }

  try {
    // 1. Récupérer l'intent courant pour avoir le montant actuel (produits)
    // 1. Récupérer l'intent courant
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    logger.info(
      { metadata: intent.metadata, amount: intent.amount },
      'DEBUG: Update Intent Metadata Check'
    );

    const subtotalStr = intent.metadata.subtotal;
    let subtotal = 0;
    let shouldSaveSubtotal = false;

    if (subtotalStr) {
      subtotal = Number(subtotalStr);
    } else {
      // Fallback: Si c'est la première fois qu'on ajoute du shipping, le montant actuel EST le subtotal
      // Si on a déjà du shipping (metadata.shipping_cost), on le soustrait
      const previousShipping = intent.metadata.shipping_cost
        ? Number(intent.metadata.shipping_cost)
        : 0;

      // Attention: previousShipping est en dollars (string "15.00"), intent.amount est en cents (number 1500)
      // Il faut convertir previousShipping en cents pour le soustraire correctes
      const previousShippingCents = toStripeAmount(
        previousShipping.toString(),
        currency
      );

      subtotal = intent.amount - previousShippingCents;
      shouldSaveSubtotal = true; // On va le sauvegarder pour la prochaine fois

      logger.warn(
        {
          calculatedSubtotal: subtotal,
          currentAmount: intent.amount,
          previousShippingCents,
        },
        'Missing subtotal metadata, calculated from current amount'
      );
    }

    // Le shippingRate est reçu du frontend (API Shippo), ex: "15.00"
    const shippingAmountCents = toStripeAmount(shippingRate.amount, currency);

    // Nouveau total
    const newTotalCents = subtotal + shippingAmountCents;

    const updatedIntent = await stripe.paymentIntents.update(paymentIntentId, {
      amount: newTotalCents,
      metadata: {
        ...intent.metadata,
        shipping_rate_id: shippingRate.object_id || shippingRate.objectId,
        shipping_cost: shippingRate.amount,
        subtotal: subtotal.toString(), // Ensure subtotal is saved/persisted
      },
    });

    logger.info(
      { paymentIntentId, newTotal: newTotalCents },
      'PaymentIntent updated with shipping cost'
    );

    return NextResponse.json({
      success: true,
      amount: updatedIntent.amount,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to update payment intent');
    return NextResponse.json({ error: 'Failed update' }, { status: 500 });
  }
}

export const POST = withError(
  withAuth(withRateLimit(updateIntentHandler, RateLimits.CHECKOUT))
);
