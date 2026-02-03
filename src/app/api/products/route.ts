import { NextRequest, NextResponse } from 'next/server';

import { ProductStatus, Language } from '@/generated/prisma';
import { logger } from '@/lib/core/logger';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { getProducts } from '@/lib/services/products';
import { productSearchSchema } from '@/lib/validators/product';

/**
 * GET /api/products
 * Liste publique des produits avec filtres et pagination
 */
async function getProductsHandler(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
  const { searchParams } = new URL(request.url);

  // Step 1: Validation
  const filters = productSearchSchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    status: searchParams.get('status'),
    featured: searchParams.get('featured'),
    search: searchParams.get('search'),
    language: searchParams.get('language'),
    categorySlug: searchParams.get('categorySlug'),
    sortBy: searchParams.get('sortBy'),
    sortOrder: searchParams.get('sortOrder'),
  });

  logger.info(
    {
      requestId,
      action: 'get_products',
      filters,
    },
    'Fetching products with filters'
  );

  // Step 2: Service Call
  // Note: Schema validation handles types (numbers, enums), so we can pass directly
  const result = await getProducts(
    {
      status: filters.status,
      isFeatured: filters.featured,
      search: filters.search,
      language: filters.language
        ? (filters.language.toUpperCase() as Language)
        : undefined,
      categorySlug: filters.categorySlug,
    },
    {
      page: filters.page,
      limit: filters.limit,
      sortBy: filters.sortBy as any, // Schema guarantees valid values
      sortOrder: filters.sortOrder as any,
    }
  );

  logger.info(
    {
      requestId,
      action: 'products_fetched_successfully',
      count: result.products.length,
      total: result.pagination.total,
      page: result.pagination.page,
    },
    `Retrieved ${result.products.length} products`
  );

  return NextResponse.json(
    {
      success: true,
      requestId,
      data: result.products,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'X-Request-ID': requestId,
      },
    }
  );
}

export const GET = withError(
  withRateLimit(getProductsHandler, RateLimits.PUBLIC)
);
