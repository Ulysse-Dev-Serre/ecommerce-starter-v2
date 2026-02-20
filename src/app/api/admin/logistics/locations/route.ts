import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/core/logger';
import { withAdmin, AuthContext } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withValidation } from '@/lib/middleware/withValidation';
import {
  createLocationSchema,
  CreateLocationInput,
} from '@/lib/validators/admin';

import {
  logisticsLocationService,
  CreateLocationData,
} from '@/lib/services/logistics/logistics-location.service';

import { ApiContext } from '@/lib/middleware/types';

async function createLocationHandler(
  req: NextRequest,
  { auth, data }: ApiContext<any, CreateLocationInput>
) {
  const authContext = auth as AuthContext;
  const { userId } = authContext;

  const supplier = await logisticsLocationService.createLocation(
    data as CreateLocationData
  );

  logger.info(
    { supplierId: supplier.id, userId },
    'Created new logistics location'
  );

  return NextResponse.json(supplier);
}

export const POST = withError(
  withAdmin(withValidation(createLocationSchema, createLocationHandler))
);

async function getLocationsHandler(_req: NextRequest, _context: ApiContext) {
  const suppliers = await logisticsLocationService.getLocations();
  return NextResponse.json({ data: suppliers });
}

export const GET = withError(withAdmin(getLocationsHandler));
