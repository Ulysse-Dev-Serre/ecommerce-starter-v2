import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/core/logger';
import { AuthContext, withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { ApiContext } from '@/lib/middleware/types';
import { getStorageProvider } from '@/lib/integrations/storage/storage.service';
import { prisma } from '@/lib/core/db';

/**
 * DELETE /api/admin/media/[id]
 * Supprime un fichier média (base de données + stockage)
 */
async function deleteMediaHandler(
  request: NextRequest,
  { params, auth }: ApiContext<{ id: string }>
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id } = await params;
  const authContext = auth as AuthContext;

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

/**
 * PATCH /api/admin/media/[id]
 * Met à jour les métadonnées d'un média (alt, title)
 */
async function patchMediaHandler(
  request: NextRequest,
  { params, auth }: ApiContext<{ id: string }>
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { id } = await params;
  const authContext = auth as AuthContext;

  try {
    const body = await request.json();
    const { alt, title } = body;

    logger.info(
      {
        requestId,
        action: 'update_media_metadata',
        userId: authContext.userId,
        mediaId: id,
        updates: { alt, title },
      },
      `Admin updating media metadata: ${id}`
    );

    // Vérifier si le média existe
    const media = await prisma.productMedia.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Media not found',
        },
        { status: 404 }
      );
    }

    // Mettre à jour
    const updatedMedia = await prisma.productMedia.update({
      where: { id },
      data: {
        alt: alt !== undefined ? alt : undefined,
        title: title !== undefined ? title : undefined,
      },
    });

    return NextResponse.json(updatedMedia, { status: 200 });
  } catch (error) {
    logger.error(
      {
        requestId,
        action: 'update_media_metadata_error',
        mediaId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to update media metadata'
    );
    throw error;
  }
}

export const DELETE = withError(
  withAdmin(withRateLimit(deleteMediaHandler, RateLimits.ADMIN))
);

export const PATCH = withError(
  withAdmin(withRateLimit(patchMediaHandler, RateLimits.ADMIN))
);
