import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/core/logger';
import { AuthContext, withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { getStorageProvider } from '@/lib/integrations/storage/storage.service';
import { prisma } from '@/lib/core/db';

/**
 * DELETE /api/admin/media/[id]
 * Supprime un fichier média (base de données + stockage)
 */
async function deleteMediaHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id } = await context.params;

  try {
    logger.info(
      {
        requestId,
        action: 'delete_media',
        userId: authContext.userId,
        mediaId: id,
      },
      `Admin deleting media: ${id}`
    );

    // Récupérer le média
    const media = await prisma.productMedia.findUnique({
      where: { id },
    });

    if (!media) {
      logger.warn(
        {
          requestId,
          action: 'media_not_found',
          mediaId: id,
        },
        `Media not found: ${id}`
      );

      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Media not found',
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

    // Supprimer du stockage
    try {
      const storage = getStorageProvider();
      await storage.delete({ url: media.url });
    } catch (storageError) {
      logger.warn(
        {
          requestId,
          action: 'storage_delete_failed',
          mediaId: id,
          url: media.url,
          error:
            storageError instanceof Error
              ? storageError.message
              : 'Unknown error',
        },
        'Failed to delete file from storage, continuing with database deletion'
      );
      // Continue même si la suppression du fichier échoue (fichier peut-être déjà supprimé)
    }

    // Supprimer de la base de données
    await prisma.productMedia.delete({
      where: { id },
    });

    logger.info(
      {
        requestId,
        action: 'media_deleted_successfully',
        mediaId: id,
        url: media.url,
      },
      `Media deleted successfully: ${id}`
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        message: 'Media deleted successfully',
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
        action: 'delete_media_error',
        mediaId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to delete media'
    );

    throw error;
  }
}

export const DELETE = withError(
  withAdmin(withRateLimit(deleteMediaHandler, RateLimits.ADMIN))
);
