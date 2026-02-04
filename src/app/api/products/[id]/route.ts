import { NextRequest, NextResponse } from 'next/server';

import { ProductStatus, Language } from '@/generated/prisma';
import { logger } from '@/lib/core/logger';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { getProductBySlug, isProductAvailable } from '@/lib/services/products';
import { AppError, ErrorCode } from '@/lib/types/api/errors';

import { productSlugSchema } from '@/lib/validators/product';

/**
 * GET /api/products/[id]
 * Récupère les détails publics d'un produit par slug.
 */
async function getProductHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
  const { id: slug } = await params;
  const { searchParams } = new URL(request.url);

  // Step 1: Validation
  const { id: validatedSlug, language } = productSlugSchema.parse({
    id: slug,
    language: searchParams.get('language'),
  });

  logger.info(
    { requestId, action: 'get_product', slug: validatedSlug, language },
    `Fetching product: ${validatedSlug}`
  );

  // Step 2: Service call (now throws AppError if not found)
  const product = await getProductBySlug(validatedSlug, language as Language);

  const isAvailable = isProductAvailable(product);
  const isDraft = product.status === ProductStatus.DRAFT;
  const hasStock = product.variants.some(
    v => v.inventory && v.inventory.stock > 0
  );

  logger.info(
    {
      requestId,
      action: 'product_fetched_successfully',
      slug,
      productId: product.id,
      isAvailable,
      hasStock,
    },
    `Product retrieved: ${slug}`
  );

  return NextResponse.json({
    success: true,
    requestId,
    data: product,
    meta: {
      isAvailable,
      isDraft,
      hasStock,
      variantsCount: product.variants.length,
      seoIndex: !isDraft,
      stockStatus: !hasStock ? 'out_of_stock' : 'in_stock',
    },
    timestamp: new Date().toISOString(),
  });
}

export const GET = withError(
  withRateLimit(getProductHandler, RateLimits.PUBLIC)
);
