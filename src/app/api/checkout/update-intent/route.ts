import { NextRequest, NextResponse } from 'next/server';

import { withError } from '@/lib/middleware/withError';
import {
  OptionalAuthContext,
  withOptionalAuth,
} from '@/lib/middleware/withAuth';
import { withValidation } from '@/lib/middleware/withValidation';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { ApiContext } from '@/lib/middleware/types';
import { updatePaymentIntent } from '@/lib/services/payments';
import { SupportedCurrency } from '@/lib/config/site';
import {
  updateIntentSchema,
  UpdateIntentInput,
} from '@/lib/validators/checkout';

async function updateIntentHandler(
  request: NextRequest,
  { data }: ApiContext<any, UpdateIntentInput>
): Promise<NextResponse> {
  const validatedData = data as UpdateIntentInput;
  const { paymentIntentId, shippingRate, currency, shippingDetails } =
    validatedData;

  const updatedIntent = await updatePaymentIntent(paymentIntentId, {
    shippingAmount: shippingRate.amount.toString(),
    currency: currency as SupportedCurrency,
    shippingDetails: shippingDetails
      ? {
          name: shippingDetails.name,
          phone: shippingDetails.phone,
          email: shippingDetails.email,
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
