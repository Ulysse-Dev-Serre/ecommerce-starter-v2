import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/core/logger';
import { AuthContext, withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { ApiContext } from '@/lib/middleware/types';
import { createSimpleVariants } from '@/lib/services/variants';
import type { SimpleVariantData } from '@/lib/types/domain/variant';
import { SUPPORTED_LOCALES } from '@/lib/config/site';

/**
 * POST /api/admin/products/[id]/variants/simple
 * Creates simple variants with multi-language names.
 *
 * Body:
 * {
 *   variants: [
 *     { names: { en: "Green", fr: "Vert" }, prices: { CAD: 49.99 }, stock: 100 },
 *     { names: { en: "White", fr: "Blanc" }, prices: { CAD: 49.99 }, stock: 50 }
 *   ]
 * }
 */
async function createSimpleVariantsHandler(
  request: NextRequest,
  { params, auth }: ApiContext<{ id: string }>
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id: productId } = await params;
  const authContext = auth as AuthContext;

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
      `Creating simple variants for product: ${productId}`
    );

    const variants: SimpleVariantData[] = body.variants;

    if (!Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Missing variants',
          message: 'At least one variant is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Dynamic validation based on supported locales
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.names) {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error: 'Invalid data',
            message: `Variant ${i + 1}: names object is required`,
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      for (const locale of SUPPORTED_LOCALES) {
        if (!v.names[locale]) {
          return NextResponse.json(
            {
              success: false,
              requestId,
              error: 'Invalid data',
              message: `Variant ${i + 1}: name for locale "${locale}" is required`,
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }
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
