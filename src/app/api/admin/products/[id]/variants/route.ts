import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { AuthContext, withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import {
  getProductVariants,
  createVariants,
  generateVariantCombinations,
  CreateVariantData,
  GenerateVariantsConfig,
} from '@/lib/services/variant.service';

/**
 * GET /api/admin/products/[id]/variants
 * Liste toutes les variantes d'un produit
 */
async function getVariantsHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;

  logger.info(
    {
      requestId,
      action: 'get_product_variants',
      userId: authContext.userId,
      productId: id,
    },
    `Récupération des variantes du produit: ${id}`
  );

  try {
    const variants = await getProductVariants(id);

    logger.info(
      {
        requestId,
        action: 'variants_fetched',
        productId: id,
        count: variants.length,
      },
      `${variants.length} variante(s) récupérée(s)`
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        data: variants,
        count: variants.length,
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
        action: 'get_variants_error',
        productId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Erreur lors de la récupération des variantes'
    );
    throw error;
  }
}

/**
 * POST /api/admin/products/[id]/variants
 * Crée des variantes manuellement OU génère automatiquement toutes les combinaisons
 * 
 * Mode manuel (tableau de variantes):
 * Body: {
 *   variants: [
 *     {
 *       sku: "SOIL-GREEN-SINGLE",
 *       attributeValueIds: ["color-green-id", "quantity-single-id"],
 *       pricing: { price: 49.99, currency: "CAD" },
 *       inventory: { stock: 100 }
 *     },
 *     ...
 *   ]
 * }
 * 
 * Mode auto-génération (config):
 * Body: {
 *   generate: true,
 *   config: {
 *     attribute1Id: "color-attr-id",
 *     attribute2Id: "quantity-attr-id",
 *     defaultPricing: { price: 49.99, currency: "CAD" },
 *     defaultInventory: { stock: 0 },
 *     skuPattern: "{product}-{attr1}-{attr2}"  // optionnel
 *   }
 * }
 */
async function createVariantsHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id: productId } = await context.params;

  try {
    const body = await request.json();

    logger.info(
      {
        requestId,
        action: 'create_variants',
        userId: authContext.userId,
        productId,
        mode: body.generate ? 'auto-generation' : 'manual',
      },
      `Création de variantes pour le produit: ${productId}`
    );

    let variantsToCreate: CreateVariantData[];

    if (body.generate) {
      // Mode auto-génération
      const config: GenerateVariantsConfig = body.config;

      if (!config || !config.attribute1Id || !config.attribute2Id) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error: 'Configuration invalide',
            message:
              'attribute1Id, attribute2Id et defaultPricing sont requis pour la génération automatique',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      // Générer toutes les combinaisons
      variantsToCreate = await generateVariantCombinations(productId, config);

      logger.info(
        {
          requestId,
          productId,
          generatedCount: variantsToCreate.length,
        },
        `${variantsToCreate.length} combinaisons générées`
      );
    } else {
      // Mode manuel
      variantsToCreate = body.variants;

      if (!Array.isArray(variantsToCreate) || variantsToCreate.length === 0) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error: 'Données invalides',
            message: 'Le champ "variants" doit être un tableau non vide',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
    }

    // Créer toutes les variantes
    const createdVariants = await createVariants(productId, variantsToCreate);

    logger.info(
      {
        requestId,
        action: 'variants_created',
        productId,
        count: createdVariants.length,
      },
      `${createdVariants.length} variante(s) créée(s) avec succès`
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        data: createdVariants,
        count: createdVariants.length,
        message: `${createdVariants.length} variante(s) créée(s)`,
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
        action: 'create_variants_error',
        productId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Erreur lors de la création des variantes'
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

export const GET = withError(
  withAdmin(withRateLimit(getVariantsHandler, RateLimits.ADMIN))
);

export const POST = withError(
  withAdmin(withRateLimit(createVariantsHandler, RateLimits.ADMIN))
);
