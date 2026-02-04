import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/core/db';
import {
  updateMediaMetadataAction,
  deleteMediaAction,
  reorderMediaAction,
  uploadMediaAction,
} from './products';
import { MediaType } from '@/generated/prisma';

// Mock Prisma
vi.mock('@/lib/core/db', () => ({
  prisma: {
    $transaction: vi.fn(),
    productMedia: {
      update: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    product: {
      update: vi.fn(),
    },
  },
}));

// Mock Storage Service
vi.mock('@/lib/integrations/storage/storage.service', () => ({
  getStorageProvider: vi.fn(() => ({
    upload: vi.fn().mockResolvedValue({
      url: 'http://example.com/image.jpg',
      filename: 'image.jpg',
      size: 1234,
      mimeType: 'image/jpeg',
    }),
  })),
}));

// Mock Clerk Auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({
    userId: 'admin_user',
    sessionClaims: {
      metadata: {
        role: 'ADMIN',
      },
    },
  })),
}));

// Mock extract revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Product Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateMediaMetadataAction', () => {
    const mockMediaId = 'media_123';
    const mockPayload = { alt: 'New Alt', title: 'New Title' };

    it('should update media metadata successfully', async () => {
      vi.mocked(prisma.productMedia.update).mockResolvedValue({
        id: mockMediaId,
        productId: 'prod_123',
        ...mockPayload,
      } as any);

      const result = await updateMediaMetadataAction(mockMediaId, mockPayload);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(prisma.productMedia.update).toHaveBeenCalledWith({
        where: { id: mockMediaId },
        data: {
          alt: mockPayload.alt,
          title: mockPayload.title,
        },
      });
    });

    it('should return error if update fails', async () => {
      vi.mocked(prisma.productMedia.update).mockRejectedValue(
        new Error('Database error')
      );

      const result = await updateMediaMetadataAction(mockMediaId, mockPayload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update media metadata');
    });
  });

  describe('deleteMediaAction', () => {
    const mockMediaId = 'media_123';

    it('should delete media successfully', async () => {
      vi.mocked(prisma.productMedia.findUnique).mockResolvedValue({
        id: mockMediaId,
        productId: 'prod_123',
      } as any);
      vi.mocked(prisma.productMedia.delete).mockResolvedValue({
        id: mockMediaId,
      } as any);

      const result = await deleteMediaAction(mockMediaId);

      expect(result.success).toBe(true);
      expect(prisma.productMedia.delete).toHaveBeenCalledWith({
        where: { id: mockMediaId },
      });
    });

    it('should return error if media not found', async () => {
      vi.mocked(prisma.productMedia.findUnique).mockResolvedValue(null);

      const result = await deleteMediaAction(mockMediaId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Media not found');
    });

    it('should return error if deletion fails', async () => {
      vi.mocked(prisma.productMedia.findUnique).mockResolvedValue({
        id: mockMediaId,
        productId: 'prod_123',
      } as any);
      vi.mocked(prisma.productMedia.delete).mockRejectedValue(
        new Error('Database error')
      );

      const result = await deleteMediaAction(mockMediaId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('reorderMediaAction', () => {
    it('should reorder media and update primary status', async () => {
      const mockTx = {
        productMedia: {
          update: vi.fn(),
          updateMany: vi.fn(),
        },
      };

      vi.mocked(prisma.$transaction).mockImplementation(
        async (callback: any) => {
          if (typeof callback === 'function') {
            return callback(mockTx);
          }
          return callback;
        }
      );

      const items = [
        { id: 'media_1', sortOrder: 0 },
        { id: 'media_2', sortOrder: 1 },
      ];

      const result = await reorderMediaAction(items, 'prod_123');

      expect(result.success).toBe(true);

      expect(mockTx.productMedia.update).toHaveBeenCalledWith({
        where: { id: 'media_1' },
        data: { sortOrder: 0 },
      });
      expect(mockTx.productMedia.update).toHaveBeenCalledWith({
        where: { id: 'media_1' },
        data: { isPrimary: true },
      });
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('DB Error'));
      const result = await reorderMediaAction([], 'prod_123');
      expect(result.success).toBe(false);
    });
  });

  describe('uploadMediaAction', () => {
    const mockProductId = 'prod_123';
    const mockFile = new File(['content'], 'test.png', { type: 'image/png' });

    it('should upload media successfully', async () => {
      vi.mocked(prisma.productMedia.create).mockResolvedValue({
        id: 'new_media_id',
        productId: mockProductId,
        url: 'http://example.com/image.jpg',
        type: MediaType.IMAGE,
        alt: 'test.png',
        title: null,
        sortOrder: 0,
        isPrimary: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('productId', mockProductId);

      const result = await uploadMediaAction(formData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // We can't easily spy on storage service within the function since it's imported,
      // unless we mock the module import (which we did).
      // But we can check if prisma create was called.
      expect(prisma.productMedia.create).toHaveBeenCalled();
    });

    it('should return error if no file provided', async () => {
      const formData = new FormData(); // Empty
      const result = await uploadMediaAction(formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe('No file provided');
    });
  });
});
