import { NextRequest, NextResponse } from 'next/server';

import { ProductStatus, Language } from '@/generated/prisma';
import { logger } from '@/lib/core/logger';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { getProducts } from '@/lib/services/products';

// Define explicit filter interface for robustness
interface ProductFilters {
  status?: ProductStatus;
  isFeatured?: boolean;
  search?: string;
  language?: Language;
}

/**
 * GET /api/products
 * Liste publique des produits avec filtres et pagination
 */
async function getProductsHandler(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);

  // Robust parsing: fallback to default if parsing fails (NaN)
  const queryPage = parseInt(searchParams.get('page') ?? '1', 10);
  const page = !isNaN(queryPage) && queryPage > 0 ? queryPage : 1;

  const queryLimit = parseInt(searchParams.get('limit') ?? '20', 10);
  const limit =
    !isNaN(queryLimit) && queryLimit > 0 ? Math.min(queryLimit, 100) : 20;

  const statusParam = searchParams.get('status');
  const status = Object.values(ProductStatus).includes(
    statusParam as ProductStatus
  )
    ? (statusParam as ProductStatus)
    : undefined;

  const isFeatured =
    searchParams.get('featured') === 'true'
      ? true
      : searchParams.get('featured') === 'false'
        ? false
        : null;

  const search = searchParams.get('search') || undefined;
  const language = Object.values(Language).includes(
    searchParams.get('language') as Language
  )
    ? (searchParams.get('language') as Language)
    : undefined;

  const validSortKeys = ['createdAt', 'updatedAt', 'name', 'price'] as const;
  const sortByParam = searchParams.get('sortBy');
  const sortBy = validSortKeys.includes(sortByParam as any)
    ? (sortByParam as (typeof validSortKeys)[number])
    : 'createdAt';

  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

  logger.info(
    {
      requestId,
      action: 'get_products',
      page,
      limit,
      status,
      isFeatured,
      search,
      language,
      sortBy,
    },
    'Fetching products with filters'
  );

  const filters: ProductFilters = {};

  // Status Logic
  if (status) {
    filters.status = status;
  } else {
    filters.status = ProductStatus.ACTIVE;
  }

  // Featured Logic
  if (isFeatured !== null) {
    filters.isFeatured = isFeatured;
  }

  // Search Logic (Require Language)
  if (search && language) {
    filters.search = search;
    filters.language = language;
  }

  // Language Fallback
  if (language && !filters.language) {
    filters.language = language;
  }

  const result = await getProducts(filters, {
    page,
    limit,
    sortBy,
    sortOrder,
  });

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
