import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/core/db';
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from './product-admin.service';
import { ProductStatus, Language } from '@/generated/prisma';

// Mock Prisma
vi.mock('@/lib/core/db', () => ({
  prisma: {
    product: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('ProductAdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create a product with translations and dimensions', async () => {
      const mockInput = {
        slug: 'new-product',
        status: ProductStatus.DRAFT,
        weight: 1.5,
        dimensions: { length: 10, width: 20, height: 30 },
        translations: [
          {
            language: Language.EN,
            name: 'New Product',
            description: 'Description',
          },
        ],
      };

      const mockCreatedProduct = {
        id: 'prod_new',
        ...mockInput,
      };

      vi.mocked(prisma.product.create).mockResolvedValue(
        mockCreatedProduct as any
      );

      const result = await createProduct(mockInput);

      expect(result).toEqual(mockCreatedProduct);
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'new-product',
            dimensions: { length: 10, width: 20, height: 30 },
            translations: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  language: Language.EN,
                  name: 'New Product',
                }),
              ]),
            },
          }),
        })
      );
    });
  });

  describe('updateProduct', () => {
    it('should update product fields and translations', async () => {
      const mockUpdate = {
        status: ProductStatus.ACTIVE,
        translations: [
          {
            language: Language.FR,
            name: 'Produit Modifié',
          },
        ],
      };

      const mockUpdatedProduct = {
        id: 'prod_1',
        status: ProductStatus.ACTIVE,
      };

      vi.mocked(prisma.product.update).mockResolvedValue(
        mockUpdatedProduct as any
      );

      const result = await updateProduct('prod_1', mockUpdate);

      expect(result).toEqual(mockUpdatedProduct);
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prod_1' },
          data: expect.objectContaining({
            status: ProductStatus.ACTIVE,
            translations: expect.objectContaining({
              upsert: expect.any(Array),
            }),
          }),
        })
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const mockDeletedProduct = { id: 'prod_1', slug: 'deleted' };
      vi.mocked(prisma.product.delete).mockResolvedValue(
        mockDeletedProduct as any
      );

      const result = await deleteProduct('prod_1');

      expect(result).toEqual(mockDeletedProduct);
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: 'prod_1' },
      });
    });
  });
});
