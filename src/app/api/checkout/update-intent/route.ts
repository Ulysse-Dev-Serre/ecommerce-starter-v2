import { NextRequest, NextResponse } from 'next/server';

import { logger } from '../../../../lib/logger';
import { withError } from '../../../../lib/middleware/withError';
import { AuthContext, withAuth } from '../../../../lib/middleware/withAuth';
import { withValidation } from '../../../../lib/middleware/withValidation';
import {
  withRateLimit,
  RateLimits,
} from '../../../../lib/middleware/withRateLimit';
import { stripe } from '../../../../lib/stripe/client';
import { toStripeAmount } from '../../../../lib/utils/currency';
import { SupportedCurrency } from '@/lib/types/currency';
import {
  updateIntentSchema,
  UpdateIntentInput,
} from '@/lib/validators/checkout';
import { env } from '@/lib/env';

async function updateIntentHandler(
  request: NextRequest,
  authContext: AuthContext,
  data: UpdateIntentInput
): Promise<NextResponse> {
  // Data is already validated by withValidation
  const { paymentIntentId, shippingRate, currency, shippingDetails } = data;

  try {
    // LOG 1: BODY REÇU DU FRONTEND (Raw)
    logger.info(
      {
        bodyReceived: JSON.stringify(data, null, 2),
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

    const resolvedCurrency = (currency ||
      intent.currency.toUpperCase()) as SupportedCurrency;

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
        resolvedCurrency
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
    const shippingAmountCents = toStripeAmount(
      shippingRate.amount,
      resolvedCurrency
    );

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

    // 3. Update the payment intent
    // We try to enable automatic_tax if configured. If it fails (e.g. registration missing in sandbox),
    // we fallback to updating without automatic_tax so we don't block the user.

    let updatedIntent;

    if (env.STRIPE_AUTOMATIC_TAX) {
      try {
        // Try with tax enabled
        updatedIntent = await stripe.paymentIntents.update(paymentIntentId, {
          ...updatePayload,
          automatic_tax: { enabled: true },
        });

        // Check if Stripe silently ignored our tax request
        if (!(updatedIntent as any).automatic_tax?.enabled) {
          logger.warn(
            {
              paymentIntentId,
              automaticTaxStatus: (updatedIntent as any).automatic_tax,
              envVar: env.STRIPE_AUTOMATIC_TAX,
            },
            '🚨 STRIPE SILENTLY IGNORED TAX REQUEST 🚨 - Tax integration not available on this account/mode?'
          );
        }
      } catch (taxError: any) {
        // If error is specifically about unknown parameter (sandbox issue) or tax config
        logger.warn(
          { error: taxError.message },
          'Stripe Tax activation failed (likely missing Sandbox config). Fallback to standard update.'
        );

        // Fallback: update without automatic_tax
        updatedIntent = await stripe.paymentIntents.update(
          paymentIntentId,
          updatePayload
        );
      }
    } else {
      // Standard update without tax
      updatedIntent = await stripe.paymentIntents.update(
        paymentIntentId,
        updatePayload
      );
    }

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
  withAuth(
    withRateLimit(
      withValidation(updateIntentSchema, updateIntentHandler),
      RateLimits.CHECKOUT
    )
  )
);
