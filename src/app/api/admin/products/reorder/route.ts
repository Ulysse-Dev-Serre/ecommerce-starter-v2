import { NextRequest, NextResponse } from 'next/server';

import { logger } from '../../../../../lib/logger';
import { AuthContext, withAdmin } from '../../../../../lib/middleware/withAuth';
import { withError } from '../../../../../lib/middleware/withError';
import { withRateLimit, RateLimits } from '../../../../../lib/middleware/withRateLimit';
import { prisma } from '../../../../../lib/prisma';

/**
 * PUT /api/admin/products/reorder
 * Met à jour l'ordre de tri (sortOrder) de plusieurs produits en batch
 * 
 * Body:
 * {
 *   products: [
 *     { id: string, sortOrder: number },
 *     { id: string, sortOrder: number },
 *     ...
 *   ]
 * }
 */
async function reorderProductsHandler(
  request: NextRequest,
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  try {
    const body = await request.json();

    logger.info(
      {
        requestId,
        action: 'reorder_products_admin',
        userId: authContext.userId,
        productCount: body.products?.length || 0,
      },
      'Admin reordering products'
    );

    if (!body.products || !Array.isArray(body.products)) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Invalid request',
          message: 'products array is required',
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

    // Valider que chaque produit a un id et sortOrder
    for (const product of body.products) {
      if (!product.id || typeof product.sortOrder !== 'number') {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error: 'Invalid product data',
            message: 'Each product must have an id and sortOrder number',
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
    }

    // Mettre à jour tous les produits en transaction
    await prisma.$transaction(
      body.products.map((product: { id: string; sortOrder: number }) =>
        prisma.product.update({
          where: { id: product.id },
          data: { sortOrder: product.sortOrder },
        })
      )
    );

    logger.info(
      {
        requestId,
        action: 'products_reordered_successfully',
        productCount: body.products.length,
      },
      `${body.products.length} products reordered successfully`
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        message: 'Products reordered successfully',
        updatedCount: body.products.length,
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
        action: 'reorder_products_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to reorder products'
    );

    throw error;
  }
}

export const PUT = withError(
  withAdmin(withRateLimit(reorderProductsHandler, RateLimits.ADMIN))
);
