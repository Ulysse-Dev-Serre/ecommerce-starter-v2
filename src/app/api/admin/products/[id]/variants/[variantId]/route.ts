import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/core/logger';
import { ApiContext } from '@/lib/middleware/types';
import { AuthContext, withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import {
  getVariantById,
  updateVariant,
  deleteVariant,
} from '@/lib/services/variants';
import type { UpdateVariantData } from '@/lib/types/domain/variant';

/**
 * GET /api/admin/products/[id]/variants/[variantId]
 * Récupère une variante spécifique
 */
async function getVariantHandler(
  request: NextRequest,
  { params, auth }: ApiContext<{ id: string; variantId: string }>
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id: productId, variantId } = await params;
  const authContext = auth as AuthContext;

  logger.info(
    {
      requestId,
      action: 'get_variant',
      userId: authContext.userId,
      productId,
      variantId,
    },
    `Fetching variant: ${variantId}`
  );

  try {
    const variant = await getVariantById(variantId);

    if (!variant) {
      logger.warn(
        {
          requestId,
          action: 'variant_not_found',
          variantId,
        },
        `Variant not found: ${variantId}`
      );

      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Variante non trouvée',
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

    // Vérifier que la variante appartient bien au produit demandé
    if (variant.product?.id !== productId) {
      logger.warn(
        {
          requestId,
          action: 'variant_product_mismatch',
          variantId,
          variantProductId: variant.product?.id,
          requestedProductId: productId,
        },
        'Variant does not belong to this product'
      );

      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Variante invalide',
          message: "Cette variante n'appartient pas au produit spécifié",
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

    logger.info(
      {
        requestId,
        action: 'variant_fetched',
        variantId,
        sku: variant.sku,
      },
      `Variant retrieved: ${variant.sku}`
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        data: variant,
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
        action: 'get_variant_error',
        variantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Error while fetching variant'
    );
    throw error;
  }
}

/**
 * PUT /api/admin/products/[id]/variants/[variantId]
 * Met à jour une variante
 *
 * Body:
 * {
 *   sku?: string,
 *   barcode?: string,
 *   weight?: number,
 *   dimensions?: { length: number, width: number, height: number },
 *   pricing?: {
 *     price: number,
 *     currency?: string,
 *     priceType?: string,
 *     isActive?: boolean
 *   },
 *   inventory?: {
 *     stock: number,
 *     trackInventory?: boolean,
 *     allowBackorder?: boolean,
 *     lowStockThreshold?: number
 *   }
 * }
 */
async function updateVariantHandler(
  request: NextRequest,
  { params, auth }: ApiContext<{ id: string; variantId: string }>
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id: productId, variantId } = await params;
  const authContext = auth as AuthContext;

  try {
    const body = await request.json();

    logger.info(
      {
        requestId,
        action: 'update_variant',
        userId: authContext.userId,
        productId,
        variantId,
      },
      `Updating variant: ${variantId}`
    );

    // Vérifier que la variante existe et appartient au produit
    const variant = await getVariantById(variantId);
    if (!variant) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Variante non trouvée',
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

    if (variant.product?.id !== productId) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Variante invalide',
          message: "Cette variante n'appartient pas au produit spécifié",
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

    const updateData: UpdateVariantData = {};

    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.barcode !== undefined) updateData.barcode = body.barcode;
    if (body.weight !== undefined) updateData.weight = body.weight;
    if (body.dimensions !== undefined) updateData.dimensions = body.dimensions;
    if (body.pricing !== undefined) updateData.pricing = body.pricing;
    if (body.inventory !== undefined) updateData.inventory = body.inventory;

    // Support pour les mises à jour génériques de prix
    if (body.prices !== undefined) updateData.prices = body.prices;

    const updatedVariant = await updateVariant(variantId, updateData);

    logger.info(
      {
        requestId,
        action: 'variant_updated',
        variantId,
        sku: updatedVariant?.sku,
        updatedFields: Object.keys(updateData),
      },
      `Variant updated: ${updatedVariant?.sku}`
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        data: updatedVariant,
        message: 'Variante mise à jour avec succès',
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
        action: 'update_variant_error',
        variantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Error while updating variant'
    );

    // Gérer les erreurs de contrainte unique (SKU duplicate)
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed on the fields: (`sku`)')
    ) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'SKU dupliqué',
          message:
            'Une variante avec ce SKU existe déjà. Les SKU doivent être uniques.',
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

/**
 * DELETE /api/admin/products/[id]/variants/[variantId]
 * Supprime définitivement une variante (HARD DELETE)
 */
async function deleteVariantHandler(
  request: NextRequest,
  { params, auth }: ApiContext<{ id: string; variantId: string }>
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id: productId, variantId } = await params;
  const authContext = auth as AuthContext;

  logger.info(
    {
      requestId,
      action: 'delete_variant',
      userId: authContext.userId,
      productId,
      variantId,
    },
    `Deleting variant: ${variantId}`
  );

  try {
    // Vérifier que la variante existe et appartient au produit
    const variant = await getVariantById(variantId);
    if (!variant) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Variante non trouvée',
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

    if (variant.product?.id !== productId) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Variante invalide',
          message: "Cette variante n'appartient pas au produit spécifié",
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

    const deletedVariant = await deleteVariant(variantId);

    logger.info(
      {
        requestId,
        action: 'variant_deleted',
        variantId,
        sku: deletedVariant.sku,
      },
      `Variant permanently deleted: ${deletedVariant.sku}`
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        data: deletedVariant,
        message: 'Variante supprimée définitivement',
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
        action: 'delete_variant_error',
        variantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Error while deleting variant'
    );
    throw error;
  }
}

export const GET = withError(
  withAdmin(withRateLimit(getVariantHandler, RateLimits.ADMIN))
);

export const PUT = withError(
  withAdmin(withRateLimit(updateVariantHandler, RateLimits.ADMIN))
);

export const DELETE = withError(
  withAdmin(withRateLimit(deleteVariantHandler, RateLimits.ADMIN))
);
