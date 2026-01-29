import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import type { AuthContext } from '@/lib/middleware/withAuth';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
    .optional(),
  search: z.string().optional(),
});

type QueryParams = z.infer<typeof querySchema>;

async function handler(request: Request, authContext: AuthContext) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);

    // Validation des paramètres
    const validation = querySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { page, limit, status, search } = validation.data;
    const skip = (page - 1) * limit;

    // Construire les filtres
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Récupérer les commandes
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  slug: true,
                  translations: true,
                },
              },
              variant: {
                select: {
                  sku: true,
                },
              },
            },
          },
          payments: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    logger.info(
      {
        page,
        limit,
        total,
        status,
        search,
        userId: authContext.userId,
      },
      'Orders listed by admin'
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          orders,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    logger.error(
      {
        error: errorMessage,
        userId: authContext.userId,
      },
      'Error listing orders'
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list orders',
      },
      { status: 500 }
    );
  }
}

export const GET = withError(
  withAdmin(withRateLimit(handler, RateLimits.ADMIN))
);
