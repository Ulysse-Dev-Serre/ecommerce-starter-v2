import { Prisma, ProductStatus, Product } from '@/generated/prisma';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import {
  CreateProductData,
  UpdateProductData,
  ProductWithTranslations,
} from '@/lib/types/domain/product';

/**
 * Récupère tous les produits avec traductions (version simple pour admin)
 */
export async function getAllProducts(filters?: {
  status?: string;
  language?: string;
}): Promise<ProductWithTranslations[]> {
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
 * Récupère un produit par ID (version simple pour admin/delete)
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
 * Crée un nouveau produit
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
      incoterm: productData.incoterm,
      shippingOriginId: productData.shippingOriginId,
      weight:
        productData.weight != null
          ? new Prisma.Decimal(productData.weight)
          : undefined,
      dimensions: productData.dimensions
        ? (productData.dimensions as Prisma.InputJsonValue)
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
 * Met à jour un produit
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
        ? (dimensions as Prisma.InputJsonValue)
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
 * Supprime un produit (HARD DELETE - permanent)
 */
export async function deleteProduct(id: string): Promise<Product> {
  const deletedProduct = await prisma.product.delete({
    where: { id },
  });

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
 * Suppression définitive d'un produit (Utilisé pour les tests uniquement)
 */
export async function hardDeleteProduct(id: string): Promise<Product> {
  const deletedProduct = await prisma.product.delete({
    where: { id },
  });

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
 * Récupère un produit complet pour l'admin (avec toutes les relations pour l'édition)
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
