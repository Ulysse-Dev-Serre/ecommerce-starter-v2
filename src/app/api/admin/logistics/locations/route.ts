import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/core/logger';
import { ApiContext } from '@/lib/middleware/types';
import { withAdmin, AuthContext } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withValidation } from '@/lib/middleware/withValidation';
import {
  logisticsLocationService,
  CreateLocationData,
} from '@/lib/services/logistics/logistics-location.service';
import {
  createLocationSchema,
  CreateLocationInput,
} from '@/lib/validators/admin';

async function createLocationHandler(
  request: NextRequest,
  { auth, data }: ApiContext<undefined, CreateLocationInput>
) {
  const requestId = crypto.randomUUID();
  const { userId } = auth as AuthContext;

  logger.info(
    {
      requestId,
      action: 'admin_create_location',
      userId,
      locationName: data!.name,
    },
    'Admin creating logistics location'
  );

  const supplier = await logisticsLocationService.createLocation(
    data as CreateLocationData
  );

  logger.info(
    {
      requestId,
      action: 'location_created_successfully',
      supplierId: supplier.id,
      userId,
    },
    'Created new logistics location successfully'
  );

  return NextResponse.json(
    {
      success: true,
      requestId,
      data: supplier,
      message: 'Location created successfully',
      timestamp: new Date().toISOString(),
    },
    {
      status: 201,
      headers: {
        'X-Request-ID': requestId,
      },
    }
  );
}

export const POST = withError(
  withAdmin(withValidation(createLocationSchema, createLocationHandler))
);

async function getLocationsHandler(
  _req: NextRequest,
  _context: ApiContext<undefined, undefined>
) {
  const suppliers = await logisticsLocationService.getLocations();
  return NextResponse.json({ data: suppliers });
}

export const GET = withError(withAdmin(getLocationsHandler));
