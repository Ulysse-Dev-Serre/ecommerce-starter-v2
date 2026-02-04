import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { withError } from '@/lib/middleware/withError';
import { withValidation } from '@/lib/middleware/withValidation';
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
  _context: unknown,
  data: ShippingRequestInput
) {
  try {
    const cartId = req.cookies.get('cartId')?.value || data.cartId;

    // Delegate to Service (Mailbox Pattern)
    const rates = await ShippingService.getShippingRates(cartId, data);

    return NextResponse.json({ rates });
  } catch (error) {
    throw error;
  }
}

export const POST = withError(
  withRateLimit(
    withValidation(shippingRequestSchema, handler),
    RateLimits.PUBLIC
  )
);
