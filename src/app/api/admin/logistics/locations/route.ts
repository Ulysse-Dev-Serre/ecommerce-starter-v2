import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withValidation } from '@/lib/middleware/withValidation';
import {
  createLocationSchema,
  CreateLocationInput,
} from '@/lib/validators/admin';

async function createLocationHandler(
  req: NextRequest,
  authContext: any,
  data: CreateLocationInput
) {
  const { userId } = authContext;
  const { name, type, address, incoterm } = data;

  const supplier = await prisma.supplier.create({
    data: {
      name,
      type: type as any,
      incoterm,
      address: address as any, // Stored as JSON
      isActive: true,
    },
  });

  logger.info(
    { supplierId: supplier.id, userId },
    'Created new logistics location'
  );

  return NextResponse.json(supplier);
}

export const POST = withError(
  withAdmin(withValidation(createLocationSchema, createLocationHandler))
);

async function getLocationsHandler(req: NextRequest) {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: 'desc' },
    where: { isActive: true }, // Only active ones
  });

  return NextResponse.json({ data: suppliers });
}

export const GET = withError(withAdmin(getLocationsHandler));
