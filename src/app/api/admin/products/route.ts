import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/core/logger';
import { AuthContext, withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { withValidation } from '@/lib/middleware/withValidation';
import { ApiContext } from '@/lib/middleware/types';
import {
  CreateProductSchema,
  CreateProductInput,
} from '@/lib/validators/product';
import { Language } from '@/generated/prisma';
import { createProduct } from '@/lib/services/products/product-admin.service';
import { CreateProductData } from '@/lib/types/domain/product';

async function createProductHandler(
  request: NextRequest,
  { auth, data }: ApiContext<any, CreateProductInput>
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const authContext = auth as AuthContext;
  const validatedData = data as CreateProductInput;

  try {
    // Data validated by middleware

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
      originCountry: validatedData.originCountry,
      hsCode: validatedData.hsCode,
      shippingOriginId: validatedData.shippingOriginId,
      exportExplanation: validatedData.exportExplanation,
      weight: validatedData.weight,
      dimensions: {
        length: validatedData.dimensions.length,
        width: validatedData.dimensions.width,
        height: validatedData.dimensions.height,
      },
      translations: validatedData.translations?.map(t => ({
        ...t,
        language: t.language.toUpperCase() as Language, // Convert 'en'/'fr' to Language enum 'EN'/'FR'
        description: t.description ?? undefined,
        shortDescription: t.shortDescription ?? undefined,
        metaTitle: t.metaTitle ?? undefined,
        metaDescription: t.metaDescription ?? undefined,
      })),
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
  withAdmin(
    withRateLimit(
      withValidation(CreateProductSchema, createProductHandler),
      RateLimits.ADMIN
    )
  )
);
