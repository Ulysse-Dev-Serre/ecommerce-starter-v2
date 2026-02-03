import { NextRequest, NextResponse } from 'next/server';

import { withError } from '@/lib/middleware/withError';
import {
  OptionalAuthContext,
  withOptionalAuth,
} from '@/lib/middleware/withAuth';
import { withValidation } from '@/lib/middleware/withValidation';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { updatePaymentIntent } from '@/lib/services/payments';
import {
  updateIntentSchema,
  UpdateIntentInput,
} from '@/lib/validators/checkout';

async function updateIntentHandler(
  request: NextRequest,
  _authContext: OptionalAuthContext,
  data: UpdateIntentInput
): Promise<NextResponse> {
  const { paymentIntentId, shippingRate, currency, shippingDetails } = data;

  const updatedIntent = await updatePaymentIntent(paymentIntentId, {
    shippingAmount: shippingRate.amount.toString(),
    currency: currency as any,
    shippingDetails: shippingDetails
      ? {
          name: shippingDetails.name,
          phone: shippingDetails.phone,
          email: shippingDetails.email || undefined,
          street1: shippingDetails.street1,
          street2: shippingDetails.street2,
          city: shippingDetails.city,
          state: shippingDetails.state,
          zip: shippingDetails.zip,
          country: shippingDetails.country,
        }
      : undefined,
  });

  return NextResponse.json({
    success: true,
    amount: updatedIntent.amount,
  });
}

export const POST = withError(
  withOptionalAuth(
    withRateLimit(
      withValidation(updateIntentSchema, updateIntentHandler),
      RateLimits.CHECKOUT
    )
  )
);
