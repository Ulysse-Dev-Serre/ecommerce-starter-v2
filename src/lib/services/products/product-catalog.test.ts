import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/core/db';
import {
  getProductBySlug,
  isProductAvailable,
  getProducts,
} from './product-catalog.service';
import { ProductStatus, Language } from '@/generated/prisma';
import { AppError, ErrorCode } from '@/lib/types/api/errors';

// Mock Prisma
vi.mock('@/lib/core/db', () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('ProductCatalogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProductBySlug', () => {
    const mockProduct = {
      id: 'prod_123',
      slug: 'test-product',
      status: ProductStatus.ACTIVE,
      isFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      translations: [
        {
          language: Language.EN,
          name: 'Test Product',
          description: 'Desc',
          shortDescription: 'Short',
        },
      ],
      variants: [
        {
          id: 'var_123',
          sku: 'SKU-123',
          pricing: [
            {
              price: { toString: () => '100.00' },
              currency: 'CAD',
              priceType: 'base',
            },
          ],
          inventory: {
            stock: 10,
            lowStockThreshold: 2,
            trackInventory: true,
            allowBackorder: false,
          },
          attributeValues: [],
          media: [],
        },
      ],
      categories: [],
      media: [],
    };

    it('should return a product when found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(
        mockProduct as any
      );

      const result = await getProductBySlug('test-product', Language.EN);

      expect(result.id).toBe('prod_123');
      expect(result.variants[0].pricing[0].price).toBe('100.00');
      expect(prisma.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: 'test-product', deletedAt: null },
        })
      );
    });

    it('should throw AppError NOT_FOUND when product does not exist', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      await expect(getProductBySlug('none', Language.EN)).rejects.toThrow(
        new AppError(ErrorCode.NOT_FOUND, 'Product not found: none', 404)
      );
    });
  });

  describe('isProductAvailable', () => {
    const baseProduct: any = {
      status: ProductStatus.ACTIVE,
      variants: [
        {
          inventory: { stock: 10, trackInventory: true, allowBackorder: false },
        },
      ],
    };

    it('should return true if product is active and has stock', () => {
      expect(isProductAvailable(baseProduct)).toBe(true);
    });

    it('should return false if product is not active', () => {
      const inactive = { ...baseProduct, status: ProductStatus.DRAFT };
      expect(isProductAvailable(inactive)).toBe(false);
    });

    it('should return false if all variants are out of stock and no backorder', () => {
      const outOfStock = {
        ...baseProduct,
        variants: [
          {
            inventory: {
              stock: 0,
              trackInventory: true,
              allowBackorder: false,
            },
          },
        ],
      };
      expect(isProductAvailable(outOfStock)).toBe(false);
    });

    it('should return true if out of stock but backorder is allowed', () => {
      const backorder = {
        ...baseProduct,
        variants: [
          {
            inventory: { stock: 0, trackInventory: true, allowBackorder: true },
          },
        ],
      };
      expect(isProductAvailable(backorder)).toBe(true);
    });

    it('should return true if inventory tracking is disabled', () => {
      const noTrack = {
        ...baseProduct,
        variants: [
          {
            inventory: {
              stock: 0,
              trackInventory: false,
              allowBackorder: false,
            },
          },
        ],
      };
      expect(isProductAvailable(noTrack)).toBe(true);
    });
  });

  describe('getProducts', () => {
    const mockProducts = [
      {
        id: 'prod_1',
        slug: 'p1',
        status: ProductStatus.ACTIVE,
        variants: [
          {
            pricing: [{ price: { toString: () => '10.00' }, currency: 'CAD' }],
            inventory: { stock: 10 },
          },
        ],
        translations: [],
        categories: [],
        media: [],
      },
    ];

    it('should return a list of products and pagination info', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      const result = await getProducts(
        { status: ProductStatus.ACTIVE },
        { page: 1, limit: 10 }
      );

      expect(result.products).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0,
        })
      );
    });

    it('should apply filters correctly', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      await getProducts({ isFeatured: true, categorySlug: 'test' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isFeatured: true,
            categories: expect.anything(),
          }),
        })
      );
    });
  });
});
