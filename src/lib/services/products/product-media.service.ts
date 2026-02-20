import { prisma } from '@/lib/core/db';
import { getStorageProvider } from '@/lib/integrations/storage/storage.service';
import { AppError, ErrorCode } from '@/lib/types/api/errors';

import { MediaType } from '@/generated/prisma';

export const productMediaService = {
  /**
   * Upload media for a product or variant
   */
  async uploadMedia(params: {
    file: File;
    productId?: string | null;
    variantId?: string | null;
    isPrimary?: boolean;
    alt?: string | null;
    title?: string | null;
  }) {
    const { file, productId, variantId, isPrimary, alt, title } = params;

    let mediaType: MediaType = MediaType.IMAGE;
    if (file.type.startsWith('video/')) mediaType = MediaType.VIDEO;
    else if (file.type === 'application/pdf') mediaType = MediaType.DOCUMENT;

    const year = new Date().getFullYear();
    const relativePath = productId
      ? `products/${year}/${productId}`
      : variantId
        ? `variants/${year}/${variantId}`
        : `general/${year}`;

    const storage = getStorageProvider();
    const uploadResult = await storage.upload(file, {
      path: relativePath,
      maxSize: 50 * 1024 * 1024,
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/webm',
        'application/pdf',
        'image/avif',
      ],
    });

    // Determine Sort Order
    const lastMedia = await prisma.productMedia.findFirst({
      where: {
        ...(productId && { productId }),
        ...(variantId && { variantId }),
      },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const sortOrder = (lastMedia?.sortOrder ?? -1) + 1;

    // Reset Primary if needed
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

    return media;
  },

  /**
   * Delete media
   */
  async deleteMedia(mediaId: string) {
    const media = await prisma.productMedia.findUnique({
      where: { id: mediaId },
    });
    if (!media) throw new AppError(ErrorCode.NOT_FOUND, 'Media not found', 404);

    // Optional: Delete from storage provider
    // const storage = getStorageProvider();
    // await storage.delete(media.url);

    await prisma.productMedia.delete({ where: { id: mediaId } });

    return media; // Return deleted media (useful for revalidation logic)
  },

  /**
   * Update media metadata
   */
  async updateMetadata(
    mediaId: string,
    payload: { alt?: string; title?: string }
  ) {
    const media = await prisma.productMedia.update({
      where: { id: mediaId },
      data: {
        alt: payload.alt,
        title: payload.title,
      },
    });
    return media;
  },

  /**
   * Reorder media items
   */
  async reorderMedia(items: { id: string; sortOrder: number }[]) {
    return prisma.$transaction(async tx => {
      // Update sort orders
      for (const item of items) {
        await tx.productMedia.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        });
      }

      // Update primary image logic (first item becomes primary)
      if (items.length > 0) {
        const sortedItems = [...items].sort(
          (a, b) => a.sortOrder - b.sortOrder
        );
        const firstItemId = sortedItems[0].id;

        // Set first item as primary
        await tx.productMedia.update({
          where: { id: firstItemId },
          data: { isPrimary: true },
        });

        // Unset primary for all others in this batch
        const otherItemIds = items
          .filter(i => i.id !== firstItemId)
          .map(i => i.id);

        if (otherItemIds.length > 0) {
          await tx.productMedia.updateMany({
            where: { id: { in: otherItemIds } },
            data: { isPrimary: false },
          });
        }
      }
    });
  },
};
