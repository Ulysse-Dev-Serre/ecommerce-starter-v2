import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/core/logger';
import { ApiContext } from '@/lib/middleware/types';
import { AuthContext, withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { productMediaService } from '@/lib/services/products/product-media.service';

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
  { auth }: ApiContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const authContext = auth as AuthContext;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const productId = formData.get('productId') as string | null;
    const variantId = formData.get('variantId') as string | null;

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
        { status: 400, headers: { 'X-Request-ID': requestId } }
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
      },
      'Admin uploading media file'
    );

    const media = await productMediaService.uploadMedia({
      file,
      productId,
      variantId,
      isPrimary,
      alt,
      title,
    });

    logger.info(
      {
        requestId,
        action: 'media_uploaded_successfully',
        mediaId: media.id,
        url: media.url,
      },
      'Media file uploaded successfully'
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        data: media,
        message: 'Media uploaded successfully',
        timestamp: new Date().toISOString(),
      },
      { status: 201, headers: { 'X-Request-ID': requestId } }
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
