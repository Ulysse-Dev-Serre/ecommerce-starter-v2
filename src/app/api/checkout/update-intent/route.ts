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
  const { paymentIntentId, shippingRate, currency, shippingDetails } = body;

  if (!paymentIntentId || !shippingRate) {
    return NextResponse.json(
      { error: 'Missing paymentIntentId or shippingRate' },
      { status: 400 }
    );
  }

  try {
    // LOG 1: BODY REÇU DU FRONTEND (Raw)
    logger.info(
      {
        bodyReceived: JSON.stringify(body, null, 2),
        shippingDetailsEmail: shippingDetails?.email, // Focus spécifique
      },
      'DEBUG: UPDATE-INTENT INPUT'
    );

    // 1. Récupérer l'intent courant
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    logger.info(
      { metadata: intent.metadata, amount: intent.amount },
      'DEBUG: Update Intent Metadata Check'
    );

    const subtotalStr = intent.metadata.subtotal;
    let subtotal = 0;

    if (subtotalStr) {
      subtotal = Number(subtotalStr);
    } else {
      // Fallback logic
      const previousShipping = intent.metadata.shipping_cost
        ? Number(intent.metadata.shipping_cost)
        : 0;

      const previousShippingCents = toStripeAmount(
        previousShipping.toString(),
        currency
      );

      subtotal = intent.amount - previousShippingCents;

      logger.warn(
        {
          calculatedSubtotal: subtotal,
          currentAmount: intent.amount,
          previousShippingCents,
        },
        'Missing subtotal metadata, calculated from current amount'
      );
    }

    // Le shippingRate est reçu du frontend (API Shippo)
    const shippingAmountCents = toStripeAmount(shippingRate.amount, currency);

    // Nouveau total
    const newTotalCents = subtotal + shippingAmountCents;

    // Prepare update payload
    const updatePayload: any = {
      amount: newTotalCents,
      metadata: {
        ...intent.metadata,
        shipping_rate_id: shippingRate.object_id || shippingRate.objectId,
        shipping_cost: shippingRate.amount,
        subtotal: subtotal.toString(),
      },
    };

    // Add shipping address if provided
    if (shippingDetails) {
      updatePayload.shipping = {
        name: shippingDetails.name,
        phone: shippingDetails.phone,
        address: {
          line1: shippingDetails.street1,
          line2: shippingDetails.street2,
          city: shippingDetails.city,
          state: shippingDetails.state,
          postal_code: shippingDetails.zip,
          country: shippingDetails.country,
        },
      };

      // FIX: Ensure receipt_email is set on the PaymentIntent so webhooks can use it
      if (shippingDetails.email) {
        updatePayload.receipt_email = shippingDetails.email;
      }
    }

    // LOG 2: PAYLOAD ENVOYÉ À STRIPE
    logger.info(
      {
        stripeUpdatePayload: JSON.stringify(updatePayload, null, 2),
      },
      'DEBUG: STRIPE UPDATE PAYLOAD'
    );

    const updatedIntent = await stripe.paymentIntents.update(
      paymentIntentId,
      updatePayload
    );

    // LOG 3: RÉPONSE DE STRIPE
    logger.info(
      {
        paymentIntentId,
        newTotal: newTotalCents,
        updatedIntentReceiptEmail: updatedIntent.receipt_email, // Vérification immédiate
        updatedIntentFull: JSON.stringify(updatedIntent, null, 2),
      },
      'DEBUG: PaymentIntent updated result'
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
