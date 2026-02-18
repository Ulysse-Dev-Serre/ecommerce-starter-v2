import { Prisma, ProductStatus, Product } from '@/generated/prisma';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { cleanupOrphanedAttributes } from '../attributes/attribute-cleanup.service';
import {
  CreateProductData,
  UpdateProductData,
  ProductWithTranslations,
  AdminProductListResult,
} from '@/lib/types/domain/product';

/**
 * Retrieves all products with translations (simplified version for admin).
 */
export async function getAllProducts(filters?: {
  status?: string;
  language?: string;
}): Promise<AdminProductListResult[]> {
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
  };

  if (filters?.status && filters.status !== 'all') {
    where.status = filters.status as ProductStatus;
  }

  return prisma.product.findMany({
    where,
    include: {
      translations: true,
      variants: {
        where: { deletedAt: null },
        include: {
          pricing: true,
          inventory: true,
        },
      },
      media: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });
}

/**
 * Retrieves a product by ID (simplified version for admin/delete).
 */
export async function getProductByIdSimple(
  id: string
): Promise<ProductWithTranslations | null> {
  return prisma.product.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      translations: true,
    },
  });
}

/**
 * Creates a new product.
 */
export async function createProduct(
  productData: CreateProductData
): Promise<ProductWithTranslations> {
  const product = await prisma.product.create({
    data: {
      slug: productData.slug,
      status: productData.status ?? ProductStatus.DRAFT,
      isFeatured: productData.isFeatured ?? false,
      sortOrder: productData.sortOrder ?? 0,
      originCountry: productData.originCountry,
      hsCode: productData.hsCode,
      exportExplanation: productData.exportExplanation,
      shippingOriginId: productData.shippingOriginId,
      weight:
        productData.weight != null
          ? new Prisma.Decimal(productData.weight)
          : undefined,
      dimensions: productData.dimensions
        ? (productData.dimensions as unknown as Prisma.InputJsonValue)
        : undefined,
      translations: productData.translations
        ? {
            create: productData.translations,
          }
        : undefined,
    },
    include: {
      translations: true,
    },
  });

  logger.info(
    {
      action: 'product_created',
      productId: product.id,
      slug: product.slug,
    },
    'Product created successfully'
  );

  return product;
}

/**
 * Updates an existing product.
 */
export async function updateProduct(
  id: string,
  productData: UpdateProductData
): Promise<ProductWithTranslations> {
  const { translations, weight, dimensions, ...productFields } = productData;

  const dataToUpdate: Prisma.ProductUpdateInput = {
    ...productFields,
    updatedAt: new Date(),
  };

  if (weight !== undefined) {
    dataToUpdate.weight = weight != null ? new Prisma.Decimal(weight) : null;
  }

  if (dimensions !== undefined) {
    dataToUpdate.dimensions =
      dimensions != null
        ? (dimensions as unknown as Prisma.InputJsonValue)
        : Prisma.DbNull;
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      ...dataToUpdate,
      ...(translations && {
        translations: {
          upsert: translations.map(t => ({
            where: {
              productId_language: {
                productId: id,
                language: t.language,
              },
            },
            update: {
              name: t.name,
              description: t.description,
              shortDescription: t.shortDescription,
              metaTitle: t.metaTitle,
              metaDescription: t.metaDescription,
            },
            create: {
              language: t.language,
              name: t.name,
              description: t.description,
              shortDescription: t.shortDescription,
              metaTitle: t.metaTitle,
              metaDescription: t.metaDescription,
            },
          })),
        },
      }),
    },
    include: {
      translations: true,
    },
  });

  logger.info(
    {
      action: 'product_updated',
      productId: id,
      slug: updatedProduct.slug,
    },
    'Product updated successfully'
  );

  return updatedProduct;
}

/**
 * Deletes a product (HARD DELETE - permanent).
 */
export async function deleteProduct(id: string): Promise<Product> {
  const deletedProduct = await prisma.product.delete({
    where: { id },
  });

  // Cleanup orphaned attributes
  await cleanupOrphanedAttributes();

  logger.info(
    {
      action: 'product_deleted',
      productId: id,
    },
    'Product deleted successfully'
  );

  return deletedProduct;
}

/**
 * Permanently deletes a product (Used for testing only).
 */
export async function hardDeleteProduct(id: string): Promise<Product> {
  const deletedProduct = await prisma.product.delete({
    where: { id },
  });

  // Cleanup orphaned attributes
  await cleanupOrphanedAttributes();

  logger.info(
    {
      action: 'product_hard_deleted',
      productId: id,
    },
    'Product hard deleted successfully'
  );

  return deletedProduct;
}

/**
 * Retrieves a complete product for the admin (with all relations for editing).
 */
export async function getProductForAdmin(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      translations: true,
      variants: {
        where: { deletedAt: null },
        include: {
          pricing: true,
          inventory: true,
          attributeValues: {
            include: {
              attributeValue: {
                include: {
                  translations: true,
                },
              },
            },
          },
        },
      },
      media: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}
