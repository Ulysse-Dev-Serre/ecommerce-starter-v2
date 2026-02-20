import { NextRequest, NextResponse } from 'next/server';

import { ApiContext } from '@/lib/middleware/types';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { withValidation } from '@/lib/middleware/withValidation';
import { ShippingService } from '@/lib/services/shipping/shipping.service';
import {
  shippingRequestSchema,
  ShippingRequestInput,
} from '@/lib/validators/shipping';

/**
 * API Handler for fetching shipping rates.
 * Orchestrates calls to ShippingRepository and ShippingService.
 */
async function handler(
  req: NextRequest,
  { data }: ApiContext<undefined, ShippingRequestInput>
) {
  const cartId = req.cookies.get('cartId')?.value || data?.cartId;
  const rates = await ShippingService.getShippingRates(cartId, data!);

  return NextResponse.json({ rates });
}

export const POST = withError(
  withRateLimit(
    withValidation(shippingRequestSchema, handler),
    RateLimits.PUBLIC
  )
);
