import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/db';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/core/logger';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  type: z.enum(['LOCAL_STOCK', 'DROPSHIPPER', 'OTHER']),
  incoterm: z.enum(['DDP', 'DDU']).default('DDU'),
  address: z.object({
    street1: z.string().min(1),
    street2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().length(2),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
  }),
});

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
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, type, address, incoterm } = result.data;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        type: type as any,
        incoterm,
        address: address as any, // Stored as JSON
      },
    });

    logger.info(
      { supplierId: supplier.id, userId },
      'Updated logistics location'
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

    // Soft delete (set isActive = false) or hard delete?
    // Schema has deletedAt? No, only isActive.
    // We set isActive = false.

    await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Error deleting location');
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
