import { NextRequest, NextResponse } from 'next/server';

import { logger } from '../../../../../lib/logger';
import { AuthContext, withAdmin } from '../../../../../lib/middleware/withAuth';
import { withError } from '../../../../../lib/middleware/withError';
import {
  withRateLimit,
  RateLimits,
} from '../../../../../lib/middleware/withRateLimit';
import {
  UpdateProductSchema,
  formatZodErrors,
} from '../../../../../lib/schemas/product.schema';
import {
  getProductByIdSimple,
  updateProduct,
  deleteProduct,
  UpdateProductData,
} from '../../../../../lib/services/product.service';

/**
 * GET /api/admin/products/[id]
 * Récupère un produit par ID pour l'admin (inclut tous les statuts)
 */
async function getProductHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;

  logger.info(
    {
      requestId,
      action: 'get_product_admin',
      userId: authContext.userId,
      productId: id,
    },
    `Admin fetching product: ${id}`
  );

  try {
    const product = await getProductByIdSimple(id);

    if (!product) {
      logger.warn(
        {
          requestId,
          action: 'product_not_found',
          productId: id,
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

    logger.info(
      {
        requestId,
        action: 'product_fetched_admin',
        productId: product.id,
        slug: product.slug,
      },
      `Product retrieved for admin: ${product.slug}`
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        data: product,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'X-Request-ID': requestId,
        },
      }
    );
  } catch (error) {
    logger.error(
      {
        requestId,
        action: 'get_product_admin_error',
        productId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to fetch product for admin'
    );
    throw error;
  }
}

/**
 * PUT /api/admin/products/[id]
 * Met à jour un produit (admin uniquement)
 *
 * Body:
 * {
 *   slug?: string,
 *   status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
 *   isFeatured?: boolean,
 *   sortOrder?: number
 * }
 */
async function updateProductHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;

  try {
    const body = await request.json();

    // Validate input with Zod
    // Note: Manually extending validation for weight/dimensions as we just added them
    // Ideally we update the Zod schema in lib/schemas/product.schema.ts
    const validation = UpdateProductSchema.safeParse(body);
    if (!validation.success) {
      logger.warn(
        {
          requestId,
          action: 'update_product_validation_failed',
          userId: authContext.userId,
          productId: id,
          errors: formatZodErrors(validation.error),
        },
        'Product update validation failed'
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
    // START MANUAL EXTENSION
    const manualData = body as any;
    const finalData: any = { ...validatedData };
    if (manualData.weight !== undefined) finalData.weight = manualData.weight;
    if (manualData.dimensions !== undefined)
      finalData.dimensions = manualData.dimensions;
    // END MANUAL EXTENSION

    logger.info(
      {
        requestId,
        action: 'update_product_admin',
        userId: authContext.userId,
        productId: id,
      },
      `Admin updating product: ${id}`
    );

    const product = await getProductByIdSimple(id);
    if (!product) {
      logger.warn(
        {
          requestId,
          action: 'update_product_not_found',
          productId: id,
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

    const updateData: UpdateProductData = {};

    if (finalData.slug !== undefined) updateData.slug = finalData.slug;
    if (finalData.status !== undefined) updateData.status = finalData.status;
    if (finalData.isFeatured !== undefined)
      updateData.isFeatured = finalData.isFeatured;
    if (finalData.sortOrder !== undefined)
      updateData.sortOrder = finalData.sortOrder;
    if (finalData.originCountry !== undefined)
      updateData.originCountry = finalData.originCountry;
    if (finalData.hsCode !== undefined) updateData.hsCode = finalData.hsCode;
    if (finalData.shippingOriginId !== undefined)
      updateData.shippingOriginId = finalData.shippingOriginId || null;
    if (finalData.exportExplanation !== undefined)
      updateData.exportExplanation = finalData.exportExplanation;
    if (finalData.incoterm !== undefined)
      updateData.incoterm = finalData.incoterm;
    if (finalData.weight !== undefined) updateData.weight = finalData.weight;
    if (finalData.dimensions !== undefined)
      updateData.dimensions = finalData.dimensions;

    // Handle translations update
    if (finalData.translations && finalData.translations.length > 0) {
      updateData.translations = finalData.translations.map((t: any) => ({
        language: t.language,
        name: t.name,
        description: t.description || null,
        shortDescription: t.shortDescription || null,
        metaTitle: t.metaTitle || null,
        metaDescription: t.metaDescription || null,
      }));
    }

    const updatedProduct = await updateProduct(id, updateData);

    logger.info(
      {
        requestId,
        action: 'product_updated_successfully',
        productId: id,
        slug: updatedProduct.slug,
        updatedFields: Object.keys(updateData),
      },
      `Product updated: ${updatedProduct.slug}`
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        data: updatedProduct,
        message: 'Product updated successfully',
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'X-Request-ID': requestId,
        },
      }
    );
  } catch (error) {
    logger.error(
      {
        requestId,
        action: 'update_product_error',
        productId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to update product'
    );
    throw error;
  }
}

/**
 * DELETE /api/admin/products/[id]
 * Supprime un produit (soft delete, admin uniquement)
 */
async function deleteProductHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;

  logger.info(
    {
      requestId,
      action: 'delete_product_admin',
      userId: authContext.userId,
      productId: id,
    },
    `Admin deleting product: ${id}`
  );

  try {
    const product = await getProductByIdSimple(id);
    if (!product) {
      logger.warn(
        {
          requestId,
          action: 'delete_product_not_found',
          productId: id,
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

    const deletedProduct = await deleteProduct(id);

    logger.info(
      {
        requestId,
        action: 'product_deleted_successfully',
        productId: id,
        slug: deletedProduct.slug,
      },
      `Product deleted successfully: ${deletedProduct.slug}`
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        product: deletedProduct,
        message: 'Product deleted successfully',
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'X-Request-ID': requestId,
        },
      }
    );
  } catch (error) {
    logger.error(
      {
        requestId,
        action: 'delete_product_error',
        productId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to delete product'
    );
    throw error;
  }
}

export const GET = withError(
  withAdmin(withRateLimit(getProductHandler, RateLimits.ADMIN))
);

export const PUT = withError(
  withAdmin(withRateLimit(updateProductHandler, RateLimits.ADMIN))
);

export const DELETE = withError(
  withAdmin(withRateLimit(deleteProductHandler, RateLimits.ADMIN))
);
