import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from '@/lib/core/logger';
import { ApiContext } from '@/lib/middleware/types';
import { withAdmin } from '@/lib/middleware/withAuth';
import type { AuthContext } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { listOrdersAdmin } from '@/lib/services/orders/order-management.service';

import { OrderStatus } from '@/generated/prisma';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(OrderStatus).optional(),
  search: z.string().optional(),
});

async function handler(request: NextRequest, { auth }: ApiContext) {
  const requestId = crypto.randomUUID();
  const authContext = auth as AuthContext;
  const url = new URL(request.url);
  const queryParams = Object.fromEntries(url.searchParams);

  // Validation des paramètres
  const validation = querySchema.safeParse(queryParams);
  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Invalid query parameters',
        details: validation.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { page, limit, status, search } = validation.data;

  logger.info(
    {
      requestId,
      page,
      limit,
      status,
      search,
      userId: authContext.userId,
    },
    'Orders listed by admin'
  );

  const result = await listOrdersAdmin({ status, search }, { page, limit });

  return NextResponse.json(
    {
      success: true,
      requestId,
      data: result.orders,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
      },
    }
  );
}

export const GET = withError(
  withAdmin(withRateLimit(handler, RateLimits.ADMIN))
);
