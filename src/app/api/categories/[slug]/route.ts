import { NextRequest, NextResponse } from 'next/server';

import { Language } from '../../../../generated/prisma';
import { logger } from '../../../../lib/logger';
import { withError } from '../../../../lib/middleware/withError';
import { getCategoryBySlug } from '../../../../lib/services/category.service';

async function getCategoryBySlugHandler(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { slug } = await params;
  const { searchParams } = new URL(request.url);

  const language = searchParams.get('language') as Language | null;

  logger.info(
    {
      requestId,
      action: 'get_category_by_slug',
      slug,
      language,
    },
    `Fetching category: ${slug}`
  );

  const category = await getCategoryBySlug(slug, language ?? undefined);

  if (!category) {
    logger.warn(
      {
        requestId,
        action: 'category_not_found',
        slug,
      },
      `Category not found: ${slug}`
    );

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: 'Category not found',
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

  logger.info(
    {
      requestId,
      action: 'category_fetched_successfully',
      slug,
      categoryId: category.id,
      isActive: category.isActive,
      childrenCount: category.children?.length ?? 0,
      pathLength: category.path?.length ?? 0,
    },
    `Category retrieved: ${slug}`
  );

  const response: any = {
    success: true,
    requestId,
    data: category,
    meta: {
      isActive: category.isActive,
      hasChildren: (category.children?.length ?? 0) > 0,
      childrenCount: category.children?.length ?? 0,
      productsCount: category.productsCount ?? 0,
      pathLength: category.path?.length ?? 0,
    },
    timestamp: new Date().toISOString(),
  };

  if (!category.isActive) {
    response.meta.seoIndex = false;
  }

  return NextResponse.json(response, {
    headers: {
      'X-Request-ID': requestId,
    },
  });
}

export const GET = withError(getCategoryBySlugHandler);
