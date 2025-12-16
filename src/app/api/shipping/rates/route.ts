import { NextRequest, NextResponse } from 'next/server';
import { getShippingRates, Address, Parcel } from '@/lib/services/shippo';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma'; // Using correct path for prisma client
import { logger } from '@/lib/logger';

// Schema validation aligning with frontend
const shippingRequestSchema = z.object({
  addressTo: z.object({
    name: z.string(),
    street1: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(), // Added phone as optional
  }),
});

// Default warehouse address (TODO: Environment variables)
const WAREHOUSE_ADDRESS: Address = {
  name: 'AgTechNest Warehouse',
  street1: '123 Tech Blvd',
  city: 'Montreal',
  state: 'QC',
  zip: 'H2X 1Y6',
  country: 'CA', // Consistent with CAD default currency
};

// Default parcel configuration
const DEFAULT_PARCEL: Parcel = {
  length: '20',
  width: '15',
  height: '10',
  distanceUnit: 'cm',
  weight: '1',
  massUnit: 'kg',
};

import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { withError } from '@/lib/middleware/withError';

async function handler(req: NextRequest) {
  try {
    const body = await req.json();

    // Zod validation
    const result = shippingRequestSchema.safeParse(body);

    if (!result.success) {
      // Fix: Directly accessing errors on result.error in case of failure
      logger.warn(
        { error: result.error.errors },
        'Invalid address data for shipping rates'
      );
      return NextResponse.json(
        { error: 'Invalid address data', details: result.error.errors },
        { status: 400 }
      );
    }

    const { addressTo } = result.data;

    // Sanitize ZIP code (remove spaces) as some carriers/Shippo are sensitive to it
    if (addressTo.zip) {
      addressTo.zip = addressTo.zip.replace(/\s+/g, '');
    }

    logger.info({ addressTo }, 'Fetching shipping rates');

    // Call Shippo service
    const shipment = await getShippingRates(WAREHOUSE_ADDRESS, addressTo, [
      DEFAULT_PARCEL,
    ]);

    // DEBUG: Log shipment details to understand why rates might be 0
    if (!shipment.rates || shipment.rates.length === 0) {
      logger.warn(
        { shipmentResponse: shipment },
        'Shippo returned 0 rates. Debugging details.'
      );
    }

    logger.info(
      { ratesCount: shipment.rates ? shipment.rates.length : 0 },
      'Shipping rates fetched successfully'
    );

    return NextResponse.json({
      rates: shipment.rates,
    });
  } catch (error) {
    logger.error({ error }, 'API Error /shipping/rates'); // Note: withError will also catch this but we keep specific logging
    throw error; // Let withError handle the response
  }
}

export const POST = withError(withRateLimit(handler, RateLimits.PUBLIC));
