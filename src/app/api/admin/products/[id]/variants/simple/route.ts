import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { AuthContext, withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import {
  createSimpleVariants,
  SimpleVariantData,
} from '@/lib/services/variant.service';

/**
 * POST /api/admin/products/[id]/variants/simple
 * Crée des variantes simples avec noms EN/FR (pour l'UI admin simplifiée)
 *
 * Body:
 * {
 *   variants: [
 *     { nameEN: "Green", nameFR: "Vert", price: 49.99, stock: 100 },
 *     { nameEN: "White", nameFR: "Blanc", price: 49.99, stock: 50 }
 *   ]
 * }
 */
async function createSimpleVariantsHandler(
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
        action: 'create_simple_variants',
        userId: authContext.userId,
        productId,
        variantCount: body.variants?.length || 0,
      },
      `Création de variantes simples pour le produit: ${productId}`
    );

    const variants: SimpleVariantData[] = body.variants;

    if (!Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Variantes manquantes',
          message: 'Au moins 1 variante est requise',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validation des variantes
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.nameEN || !v.nameFR) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error: 'Données invalides',
            message: `Variante ${i + 1}: nameEN et nameFR sont requis`,
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
      const hasPrice =
        v.prices &&
        Object.values(v.prices).some(p => p != null && Number(p) >= 0);
      if (!hasPrice) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error: 'Données invalides',
            message: `Variante ${i + 1}: au moins un prix est requis`,
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
    }

    const createdVariants = await createSimpleVariants(productId, variants);

    logger.info(
      {
        requestId,
        action: 'simple_variants_created',
        productId,
        count: createdVariants.length,
      },
      `${createdVariants.length} variante(s) simple(s) créée(s)`
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
        action: 'create_simple_variants_error',
        productId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Erreur lors de la création des variantes simples'
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

export const POST = withError(
  withAdmin(withRateLimit(createSimpleVariantsHandler, RateLimits.ADMIN))
);
