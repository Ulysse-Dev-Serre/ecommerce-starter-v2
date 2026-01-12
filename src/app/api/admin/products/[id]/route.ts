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

    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug;
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status;
    if (validatedData.isFeatured !== undefined)
      updateData.isFeatured = validatedData.isFeatured;
    if (validatedData.sortOrder !== undefined)
      updateData.sortOrder = validatedData.sortOrder;
    if (validatedData.originCountry !== undefined)
      updateData.originCountry = validatedData.originCountry;
    if (validatedData.hsCode !== undefined)
      updateData.hsCode = validatedData.hsCode;
    if (validatedData.shippingOriginId !== undefined)
      updateData.shippingOriginId = validatedData.shippingOriginId || null;
    if (validatedData.exportExplanation !== undefined)
      updateData.exportExplanation = validatedData.exportExplanation;
    if (validatedData.incoterm !== undefined)
      updateData.incoterm = validatedData.incoterm;

    // Handle translations update
    if (validatedData.translations && validatedData.translations.length > 0) {
      updateData.translations = validatedData.translations.map(t => ({
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
