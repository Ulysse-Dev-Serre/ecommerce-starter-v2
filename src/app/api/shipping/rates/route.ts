import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { withError } from '@/lib/middleware/withError';
import { withValidation } from '@/lib/middleware/withValidation';
import {
  shippingRequestSchema,
  ShippingRequestInput,
} from '@/lib/validators/shipping';
import { AppError, ErrorCode } from '@/lib/types/api/errors';
import { ShippingService } from '@/lib/services/shipping/shipping.service';
import { ShippingRepository } from '@/lib/services/shipping/shipping.repository';

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
    const { addressTo, cartId: bodyCartId, items: bodyItems } = data;

    // Standardize zip code
    if (addressTo.zip) {
      addressTo.zip = addressTo.zip.replace(/\s+/g, '');
    }

    // Resolve cartId from cookie or body
    let cartId = req.cookies.get('cartId')?.value;
    if (!cartId && bodyCartId) {
      cartId = bodyCartId;
    }

    // 1. Resolve shipping items (Enriched from Prisma via Repository)
    const shippingItems = await ShippingRepository.resolveItems(
      cartId,
      bodyItems
    );

    if (shippingItems.length === 0) {
      throw new AppError(
        ErrorCode.SHIPPING_DATA_MISSING,
        'No shipping items found.',
        400
      );
    }

    // 2. Fetch raw rates via 3D packing and Shippo
    const { rates: rawRates } = await ShippingService.calculateRates(
      addressTo,
      shippingItems
    );

    // 3. Filter, convert currency and label the rates
    const filteredRates = ShippingService.filterAndLabelRates(rawRates);

    return NextResponse.json({ rates: filteredRates });
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
