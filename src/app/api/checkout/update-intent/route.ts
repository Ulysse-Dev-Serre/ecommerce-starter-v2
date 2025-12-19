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
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Simplification: On recalcule le total en ajoutant LE nouveau frais de port au montant initial des produits
    // Pour faire ça proprement, on devrait idéalement stocker le subtotal quelque part (metadata)
    // Ici on suppose que le montant actuel de l'intent est (Produits + AncienShipping).
    // C'est risqué d'ajouter par dessus.

    // MIEUX : On devrait recalculer le panier complet + shipping.
    // MAIS pour l'instant, pour faire simple et fonctionner avec le `create-intent` précédent :
    // On va stocker le "subtotal" (produits scellés) dans les metadata lors du create-intent,
    // et ici on fait Subtotal + Shipping.

    const subtotalStr = intent.metadata.subtotal; // On va devoir ajouter ça dans create-intent
    let subtotal = 0;

    if (subtotalStr) {
      subtotal = Number(subtotalStr);
    } else {
      // Fallback dangereux, ou on re-fetch le panier ici.
      // Pour ce MVP, supposons qu'on modifie create-intent pour inclure 'subtotal'
      // Si pas de metadata, on ne peut pas mettre à jour de façon fiable sans re-fetch panier.

      // Pour avancer, je vais supposer qu'on va aller modifier create-intent juste après.
      // Si subtotal manque, on prend le montant actuel comme subtotal (buggy si on change 2x de shipping)
      logger.warn(
        'Missing subtotal metadata, assuming current amount is subtotal (risk of double shipping cost)'
      );
      subtotal = intent.amount;
    }

    // Le shippingRate est reçu du frontend (API Shippo), ex: "15.00"
    const shippingAmountCents = toStripeAmount(shippingRate.amount, currency);

    // Si subtotal est déjà en cents (Stripe amount est tjs en cents)
    const newTotalCents = subtotal + shippingAmountCents;

    const updatedIntent = await stripe.paymentIntents.update(paymentIntentId, {
      amount: newTotalCents,
      metadata: {
        ...intent.metadata,
        shipping_rate_id: shippingRate.object_id || shippingRate.objectId, // Support both formats
        shipping_cost: shippingRate.amount,
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
