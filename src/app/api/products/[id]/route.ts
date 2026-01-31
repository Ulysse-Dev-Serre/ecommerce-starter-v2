import { NextRequest, NextResponse } from 'next/server';

import { ProductStatus, Language } from '@/generated/prisma';
import { logger } from '@/lib/core/logger';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { getProductBySlug, isProductAvailable } from '@/lib/services/products';

/**
 * GET /api/products/[id]
 * Récupère les détails publics d'un produit par slug
 *
 * Query params:
 * - language: EN | FR (optional)
 */
async function getProductHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id } = await params;
  const { searchParams } = new URL(request.url);

  const language = searchParams.get('language') as Language | null;

  logger.info(
    {
      requestId,
      action: 'get_product',
      id,
      language,
    },
    `Fetching product: ${id}`
  );

  // Try slug first (returns full ProductProjection)
  const product = await getProductBySlug(id, language ?? undefined);

  if (!product) {
    logger.warn(
      {
        requestId,
        action: 'product_not_found',
        id,
      },
      `Product not found: ${id}`
    );

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Product not found',
        timestamp: new Date().toISOString(),
      },
      {
        status: 404,
        headers: {
          'X-Request-ID': requestId,
        },
      }
    );
  }

  const isAvailable = isProductAvailable(product);
  const isDraft = product.status === ProductStatus.DRAFT;
  const hasStock = product.variants.some(
    v => v.inventory && v.inventory.stock > 0
  );

  logger.info(
    {
      requestId,
      action: 'product_fetched_successfully',
      id,
      productId: product.id,
      status: product.status,
      isAvailable,
      hasStock,
      variantsCount: product.variants.length,
    },
    `Product retrieved: ${id}`
  );

  const response = {
    success: true,
    requestId,
    data: product,
    meta: {
      isAvailable,
      isDraft,
      hasStock,
      variantsCount: product.variants.length,
      seoIndex: !isDraft, // Integrated logic
      stockStatus: !hasStock ? 'out_of_stock' : 'in_stock', // Explicit status
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, {
    headers: {
      'X-Request-ID': requestId,
    },
  });
}

export const GET = withError(
  withRateLimit(getProductHandler, RateLimits.PUBLIC)
);
