import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from '@/lib/core/logger';
import { ApiContext } from '@/lib/middleware/types';
import { withAdmin, AuthContext } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import {
  logisticsLocationService,
  UpdateLocationData,
} from '@/lib/services/logistics/logistics-location.service';

const schema = z.object({
  name: z.string().min(1),
  type: z.enum(['LOCAL_STOCK', 'DROPSHIPPER', 'OTHER']),
  incoterm: z.enum(['DDP', 'DDU']),
  address: z.object({
    name: z.string().min(1),
    street1: z.string().min(1),
    street2: z.string().optional(),
    city: z.string().min(1),
    state: z
      .string()
      .min(2)
      .refine(val => val !== 'Select', {
        message: 'Please select a valid province/state',
      }),
    zip: z.string().min(1),
    country: z.string().length(2),
    email: z.string().email(),
    phone: z.string().min(1),
  }),
});

async function updateLocationHandler(
  req: NextRequest,
  { params, auth }: ApiContext<{ id: string }>
) {
  const requestId = crypto.randomUUID();
  const { id } = await params;
  const { userId } = auth as AuthContext;

  try {
    const body = await req.json();

    // Log incoming data for debugging
    logger.info(
      { requestId, supplierId: id, userId, data: body },
      'Processing logistics location update'
    );

    const result = schema.safeParse(body);

    if (!result.success) {
      logger.warn(
        { requestId, supplierId: id, errors: result.error.format() },
        'Logistics location validation failed'
      );
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Invalid data',
          details: result.error.format(),
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const supplier = await logisticsLocationService.updateLocation(
      id,
      result.data as UpdateLocationData
    );

    logger.info(
      { requestId, supplierId: supplier.id, savedData: supplier.address },
      'Updated logistics location saved to database'
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        data: supplier,
        timestamp: new Date().toISOString(),
      },
      { headers: { 'X-Request-ID': requestId } }
    );
  } catch (error) {
    logger.error(
      {
        requestId,
        supplierId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to update logistics location'
    );
    throw error;
  }
}

export const PUT = withError(withAdmin(updateLocationHandler));

async function deleteLocationHandler(
  req: NextRequest,
  { params, auth }: ApiContext<{ id: string }>
) {
  const requestId = crypto.randomUUID();
  const { id } = await params;
  const { userId } = auth as AuthContext;

  try {
    logger.info(
      { requestId, supplierId: id, userId },
      'Admin deleting logistics location'
    );

    await logisticsLocationService.deleteLocation(id);

    logger.info(
      { requestId, supplierId: id },
      'Logistics location deleted successfully'
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        message: 'Location deleted successfully',
        timestamp: new Date().toISOString(),
      },
      { headers: { 'X-Request-ID': requestId } }
    );
  } catch (error) {
    logger.error(
      {
        requestId,
        supplierId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to delete logistics location'
    );
    throw error;
  }
}

export const DELETE = withError(withAdmin(deleteLocationHandler));
