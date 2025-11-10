import { NextRequest, NextResponse } from 'next/server';

import { logger } from '../../../../../lib/logger';
import { AuthContext, withAdmin } from '../../../../../lib/middleware/withAuth';
import { withError } from '../../../../../lib/middleware/withError';
import { withRateLimit, RateLimits } from '../../../../../lib/middleware/withRateLimit';
import { getStorageProvider } from '../../../../../lib/storage/storage.service';
import { prisma } from '../../../../../lib/db/prisma';
import { MediaType } from '../../../../../generated/prisma';

/**
 * POST /api/admin/media/upload
 * Upload des fichiers médias (images, vidéos)
 * 
 * FormData:
 * - file: File (required)
 * - productId: string (optional)
 * - variantId: string (optional)
 * - type: IMAGE | VIDEO | DOCUMENT (optional, auto-détecté)
 * - alt: string (optional)
 * - title: string (optional)
 * - isPrimary: boolean (optional)
 */
async function uploadMediaHandler(
  request: NextRequest,
  authContext: AuthContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const productId = formData.get('productId') as string | null;
    const variantId = formData.get('variantId') as string | null;
    const typeStr = formData.get('type') as string | null;
    const alt = formData.get('alt') as string | null;
    const title = formData.get('title') as string | null;
    const isPrimary = formData.get('isPrimary') === 'true';

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'No file provided',
          message: 'Please provide a file to upload',
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
        action: 'upload_media',
        userId: authContext.userId,
        filename: file.name,
        size: file.size,
        type: file.type,
        productId,
        variantId,
      },
      'Admin uploading media file'
    );

    // Déterminer le type de média
    let mediaType: MediaType = MediaType.IMAGE;
    if (typeStr && Object.values(MediaType).includes(typeStr as MediaType)) {
      mediaType = typeStr as MediaType;
    } else if (file.type.startsWith('video/')) {
      mediaType = MediaType.VIDEO;
    } else if (file.type.startsWith('image/')) {
      mediaType = MediaType.IMAGE;
    } else if (file.type === 'application/pdf') {
      mediaType = MediaType.DOCUMENT;
    }

    // Construire le chemin de stockage
    const year = new Date().getFullYear();
    const relativePath = productId
      ? `products/${year}/${productId}`
      : variantId
      ? `variants/${year}/${variantId}`
      : `general/${year}`;

    // Upload via le provider de stockage
    const storage = getStorageProvider();
    const uploadResult = await storage.upload(file, {
      path: relativePath,
      maxSize: 50 * 1024 * 1024, // 50MB max
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/webm',
        'application/pdf',
      ],
    });

    // Calculer le sortOrder (dernier + 1)
    const lastMedia = await prisma.productMedia.findFirst({
      where: {
        ...(productId && { productId }),
        ...(variantId && { variantId }),
      },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const sortOrder = (lastMedia?.sortOrder ?? -1) + 1;

    // Si isPrimary est true, désactiver les autres médias primaires
    if (isPrimary && (productId || variantId)) {
      await prisma.productMedia.updateMany({
        where: {
          ...(productId && { productId }),
          ...(variantId && { variantId }),
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    // Sauvegarder en base de données
    const media = await prisma.productMedia.create({
      data: {
        url: uploadResult.url,
        type: mediaType,
        alt: alt || file.name,
        title: title || null,
        sortOrder,
        isPrimary,
        ...(productId && { productId }),
        ...(variantId && { variantId }),
      },
    });

    logger.info(
      {
        requestId,
        action: 'media_uploaded_successfully',
        mediaId: media.id,
        url: uploadResult.url,
        productId,
        variantId,
      },
      'Media file uploaded successfully'
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        data: media,
        upload: {
          url: uploadResult.url,
          filename: uploadResult.filename,
          size: uploadResult.size,
          mimeType: uploadResult.mimeType,
        },
        message: 'Media uploaded successfully',
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
        action: 'upload_media_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to upload media'
    );

    throw error;
  }
}

export const POST = withError(
  withAdmin(withRateLimit(uploadMediaHandler, RateLimits.ADMIN))
);
