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
    name: z.string().min(1),
    street1: z.string().min(1),
    street2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().length(2),
    email: z.string().email(),
    phone: z.string().min(1),
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

    // Safety: Handle connected products before deactivating supplier
    // 0 Fallback Policy: If the origin disappears, the products must not remain ACTIVE
    await prisma.$transaction(async tx => {
      // 1. Find all ACTIVE products using this origin
      const affectedProducts = await tx.product.findMany({
        where: {
          shippingOriginId: id,
          status: 'ACTIVE',
        },
        select: { id: true, slug: true },
      });

      if (affectedProducts.length > 0) {
        // 2. Force DRAFT status
        await tx.product.updateMany({
          where: {
            id: { in: affectedProducts.map(p => p.id) },
          },
          data: {
            status: 'DRAFT',
          },
        });

        logger.warn(
          {
            supplierId: id,
            count: affectedProducts.length,
            products: affectedProducts.map(p => p.slug),
          },
          'Cascade Deactivation: Products forced to DRAFT due to Supplier deactivation'
        );
      }

      // 3. Deactivate Supplier
      await tx.supplier.update({
        where: { id },
        data: { isActive: false },
      });
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
