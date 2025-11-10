import { NextRequest, NextResponse } from 'next/server';

import { logger } from '../../../../../lib/logger';
import { AuthContext, withAdmin } from '../../../../../lib/middleware/withAuth';
import { withError } from '../../../../../lib/middleware/withError';
import {
  withRateLimit,
  RateLimits,
} from '../../../../../lib/middleware/withRateLimit';
import { prisma } from '../../../../../lib/db/prisma';

/**
 * PUT /api/admin/media/reorder
 * Met à jour l'ordre de tri (sortOrder) de plusieurs médias en batch
 *
 * Body:
 * {
 *   media: [
 *     { id: string, sortOrder: number },
 *     { id: string, sortOrder: number },
 *     ...
 *   ]
 * }
 */
async function reorderMediaHandler(
  request: NextRequest,
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  try {
    const body = await request.json();

    logger.info(
      {
        requestId,
        action: 'reorder_media_admin',
        userId: authContext.userId,
        mediaCount: body.media?.length || 0,
      },
      'Admin reordering media'
    );

    if (!body.media || !Array.isArray(body.media)) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Invalid request',
          message: 'media array is required',
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

    // Valider que chaque média a un id et sortOrder
    for (const mediaItem of body.media) {
      if (!mediaItem.id || typeof mediaItem.sortOrder !== 'number') {
        return NextResponse.json(
          {
            success: false,
            requestId,
            error: 'Invalid media data',
            message: 'Each media must have an id and sortOrder number',
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

    // Mettre à jour tous les médias en transaction
    await prisma.$transaction(
      body.media.map((mediaItem: { id: string; sortOrder: number }) =>
        prisma.productMedia.update({
          where: { id: mediaItem.id },
          data: { sortOrder: mediaItem.sortOrder },
        })
      )
    );

    logger.info(
      {
        requestId,
        action: 'media_reordered_successfully',
        mediaCount: body.media.length,
      },
      `${body.media.length} media files reordered successfully`
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        message: 'Media reordered successfully',
        updatedCount: body.media.length,
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
        action: 'reorder_media_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to reorder media'
    );

    throw error;
  }
}

export const PUT = withError(
  withAdmin(withRateLimit(reorderMediaHandler, RateLimits.ADMIN))
);
