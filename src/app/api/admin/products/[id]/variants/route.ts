import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/core/logger';
import { ApiContext } from '@/lib/middleware/types';
import { AuthContext, withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { withValidation } from '@/lib/middleware/withValidation';
import {
  getProductVariants,
  createVariants,
  generateVariantCombinations,
} from '@/lib/services/variants';
import type {
  CreateVariantData,
  GenerateVariantsConfig,
} from '@/lib/types/domain/variant';
import {
  CreateVariantsSchema,
  CreateVariantsInput,
} from '@/lib/validators/product';

/**
 * GET /api/admin/products/[id]/variants
 * Liste toutes les variantes d'un produit
 */
async function getVariantsHandler(
  request: NextRequest,
  { params, auth }: ApiContext<{ id: string }>
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id } = await params;
  const authContext = auth as AuthContext;

  logger.info(
    {
      requestId,
      action: 'get_product_variants',
      userId: authContext.userId,
      productId: id,
    },
    `Fetching product variants for: ${id}`
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
      `${variants.length} variant(s) retrieved`
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
      'Error while fetching variants'
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
 *     attributeId: "color-attr-id",
 *     defaultPricing: { price: 49.99, currency: "CAD" },
 *     defaultInventory: { stock: 0 },
 *     skuPattern: "{product}-{attr}"  // optionnel
 *   }
 * }
 */

async function createVariantsHandler(
  request: NextRequest,
  { params, auth, data }: ApiContext<{ id: string }, CreateVariantsInput>
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id: productId } = await params;
  const authContext = auth as AuthContext;
  const validatedData = data as CreateVariantsInput;

  try {
    logger.info(
      {
        requestId,
        action: 'create_variants',
        userId: authContext.userId,
        productId,
        mode:
          'generate' in validatedData && validatedData.generate
            ? 'auto-generation'
            : 'manual',
      },
      `Creating variants for product: ${productId}`
    );

    let variantsToCreate: CreateVariantData[];

    if ('generate' in validatedData && validatedData.generate) {
      // Mode auto-génération
      const config: GenerateVariantsConfig = validatedData.config;

      // Générer toutes les combinaisons
      variantsToCreate = await generateVariantCombinations(productId, config);

      logger.info(
        {
          requestId,
          productId,
          generatedCount: variantsToCreate.length,
        },
        `${variantsToCreate.length} combinations generated`
      );
    } else {
      // Mode manuel - validatedData.variants est déjà validé par Zod
      variantsToCreate = (
        'variants' in validatedData ? validatedData.variants : []
      ) as CreateVariantData[];
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
      `${createdVariants.length} variant(s) created successfully`
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
      'Error while creating variants'
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
  withAdmin(
    withRateLimit(
      withValidation(CreateVariantsSchema, createVariantsHandler),
      RateLimits.ADMIN
    )
  )
);
