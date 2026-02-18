import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/core/logger';
import { z } from 'zod';

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

import {
  logisticsLocationService,
  UpdateLocationData,
} from '@/lib/services/logistics/logistics-location.service';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Log incoming data for debugging
    logger.info(
      { supplierId: id, data: body },
      'Processing logistics location update'
    );

    const result = schema.safeParse(body);

    if (!result.success) {
      logger.warn(
        { supplierId: id, errors: result.error.format() },
        'Logistics location validation failed'
      );
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.format() },
        { status: 400 }
      );
    }

    const supplier = await logisticsLocationService.updateLocation(
      id,
      result.data as UpdateLocationData
    );

    logger.info(
      { supplierId: supplier.id, savedData: supplier.address },
      'Updated logistics location saved to database'
    );

    return NextResponse.json(supplier);
  } catch (error) {
    logger.error({ error }, 'Error updating location');
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await logisticsLocationService.deleteLocation(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Error deleting location');
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
