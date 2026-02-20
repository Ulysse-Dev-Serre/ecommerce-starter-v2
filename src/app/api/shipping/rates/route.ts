import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { withError } from '@/lib/middleware/withError';
import { withValidation } from '@/lib/middleware/withValidation';
import { ApiContext } from '@/lib/middleware/types';
import {
  shippingRequestSchema,
  ShippingRequestInput,
} from '@/lib/validators/shipping';
import { ShippingService } from '@/lib/services/shipping/shipping.service';

/**
 * API Handler for fetching shipping rates.
 * Orchestrates calls to ShippingRepository and ShippingService.
 */
async function handler(
  req: NextRequest,
  { data }: ApiContext<any, ShippingRequestInput>
) {
  const validatedData = data as ShippingRequestInput;
  const cartId = req.cookies.get('cartId')?.value || validatedData.cartId;
  const rates = await ShippingService.getShippingRates(cartId, validatedData);

  return NextResponse.json({ rates });
}

export const POST = withError(
  withRateLimit(
    withValidation(shippingRequestSchema, handler),
    RateLimits.PUBLIC
  )
);
