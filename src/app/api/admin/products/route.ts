import { NextRequest, NextResponse } from 'next/server';

import { logger } from '../../../../lib/logger';
import { AuthContext, withAdmin } from '../../../../lib/middleware/withAuth';
import { withError } from '../../../../lib/middleware/withError';
import {
  withRateLimit,
  RateLimits,
} from '../../../../lib/middleware/withRateLimit';
import {
  CreateProductSchema,
  formatZodErrors,
} from '../../../../lib/schemas/product.schema';
import {
  createProduct,
  CreateProductData,
} from '../../../../lib/services/product.service';

/**
 * POST /api/admin/products
 * Crée un nouveau produit (admin uniquement)
 *
 * Body:
 * {
 *   slug: string,
 *   status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
 *   isFeatured?: boolean,
 *   sortOrder?: number,
 *   translations?: [
 *     { language: 'EN', name: string, description?: string, ... },
 *     { language: 'FR', name: string, description?: string, ... }
 *   ]
 * }
 */
async function createProductHandler(
  request: NextRequest,
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  try {
    const body = await request.json();

    // Validate input with Zod
    const validation = CreateProductSchema.safeParse(body);
    if (!validation.success) {
      logger.warn(
        {
          requestId,
          action: 'create_product_validation_failed',
          userId: authContext.userId,
          errors: formatZodErrors(validation.error),
        },
        'Product validation failed'
      );

      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Validation failed',
          details: formatZodErrors(validation.error),
          timestamp: new Date().toISOString(),
        },
        {
          status: 400,
          headers: { 'X-Request-ID': requestId },
        }
      );
    }

    const validatedData = validation.data;

    logger.info(
      {
        requestId,
        action: 'create_product_admin',
        userId: authContext.userId,
        slug: validatedData.slug,
      },
      'Admin creating product'
    );

    const productData: CreateProductData = {
      slug: validatedData.slug,
      status: validatedData.status,
      isFeatured: validatedData.isFeatured,
      sortOrder: validatedData.sortOrder,
      translations: validatedData.translations,
    };

    const product = await createProduct(productData);

    logger.info(
      {
        requestId,
        action: 'product_created_successfully',
        productId: product.id,
        slug: product.slug,
      },
      `Product created: ${product.slug}`
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        product,
        message: 'Product created successfully',
        timestamp: new Date().toISOString(),
      },
      {
        status: 201,
        headers: {
          'X-Request-ID': requestId,
        },
      }
    );
  } catch (error) {
    logger.error(
      {
        requestId,
        action: 'create_product_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to create product'
    );

    // Handle Prisma unique constraint errors
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed on the fields: (`slug`)')
    ) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Duplicate slug',
          message:
            'A product with this slug already exists. Please choose a different slug.',
          timestamp: new Date().toISOString(),
        },
        {
          status: 400,
          headers: {
            'X-Request-ID': requestId,
          },
        }
      );
    }

    throw error;
  }
}

export const POST = withError(
  withAdmin(withRateLimit(createProductHandler, RateLimits.ADMIN))
);
