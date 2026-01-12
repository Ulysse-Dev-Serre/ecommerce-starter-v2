import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
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

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    // In real app, check for ADMIN role here

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, type, address, incoterm } = result.data;

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
  } catch (error) {
    logger.error(error, 'Error creating location');
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' },
      where: { isActive: true }, // Only active ones
    });

    return NextResponse.json({ data: suppliers });
  } catch (error) {
    logger.error(error, 'Error fetching locations');
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
