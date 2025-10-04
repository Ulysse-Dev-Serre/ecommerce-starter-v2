import { NextRequest, NextResponse } from 'next/server';

import { Language } from '../../../generated/prisma';
import { logger } from '../../../lib/logger';
import { withError } from '../../../lib/middleware/withError';
import { getCategories } from '../../../lib/services/category.service';

async function getCategoriesHandler(
  request: NextRequest
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);

  const language = searchParams.get('language') as Language | null;

  logger.info(
    {
      requestId,
      action: 'get_categories',
      language,
    },
    'Fetching categories tree'
  );

  const categories = await getCategories(language ?? undefined);

  logger.info(
    {
      requestId,
      action: 'categories_fetched_successfully',
      count: categories.length,
    },
    `Retrieved ${categories.length} root categories`
  );

  return NextResponse.json(
    {
      success: true,
      requestId,
      data: categories,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'X-Request-ID': requestId,
      },
    }
  );
}

export const GET = withError(getCategoriesHandler);
