import { NextRequest, NextResponse } from 'next/server';

import { ApiContext } from '@/lib/middleware/types';

import { MediaType, Prisma } from '../../../../generated/prisma';
import { prisma } from '../../../../lib/core/db';
import { logger } from '../../../../lib/core/logger';
import { AuthContext, withAdmin } from '../../../../lib/middleware/withAuth';
import { withError } from '../../../../lib/middleware/withError';
import {
  withRateLimit,
  RateLimits,
} from '../../../../lib/middleware/withRateLimit';

/**
 * GET /api/admin/media
 * Liste les fichiers médias avec filtres optionnels
 *
 * Query params:
 * - productId: string (optional)
 * - variantId: string (optional)
 * - type: IMAGE | VIDEO | DOCUMENT (optional)
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
async function getMediaHandler(
  request: NextRequest,
  { auth }: ApiContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const authContext = auth as AuthContext;

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const variantId = searchParams.get('variantId');
    const typeStr = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    logger.info(
      {
        requestId,
        action: 'get_media',
        userId: authContext.userId,
        productId,
        variantId,
        type: typeStr,
        limit,
        offset,
      },
      'Admin fetching media files'
    );

    // Construire les filtres
    const where: Prisma.ProductMediaWhereInput = {};

    if (productId) {
      where.productId = productId;
    }

    if (variantId) {
      where.variantId = variantId;
    }

    if (typeStr && Object.values(MediaType).includes(typeStr as MediaType)) {
      where.type = typeStr as MediaType;
    }

    // Récupérer les médias
    const [media, total] = await Promise.all([
      prisma.productMedia.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              translations: {
                select: {
                  language: true,
                  name: true,
                },
              },
            },
          },
          variant: {
            select: {
              id: true,
              sku: true,
            },
          },
        },
      }),
      prisma.productMedia.count({ where }),
    ]);

    logger.info(
      {
        requestId,
        action: 'media_fetched_successfully',
        count: media.length,
        total,
      },
      `Retrieved ${media.length} media files`
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        data: media,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
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
        action: 'get_media_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to fetch media files'
    );

    throw error;
  }
}

export const GET = withError(
  withAdmin(withRateLimit(getMediaHandler, RateLimits.ADMIN))
);
