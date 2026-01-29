import {
  Prisma,
  ProductStatus,
  Language,
  Product,
} from '../../generated/prisma';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';

export interface ProductListFilters {
  status?: ProductStatus;
  isFeatured?: boolean;
  categorySlug?: string;
  language?: Language;
  search?: string;
}

export interface ProductListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'price';
  sortOrder?: 'asc' | 'desc';
  includeAttributes?: boolean; // false = mode LIST (accueil/shop), true = mode DETAIL
}

export interface ProductVariantProjection {
  id: string;
  sku: string;
  pricing: {
    price: string;
    currency: string;
    priceType: string;
  }[];
  inventory: {
    stock: number;
    lowStockThreshold: number;
    trackInventory: boolean;
    allowBackorder: boolean;
  } | null;
  attributeValues: Array<{
    attributeValue?: {
      value: string;
      attribute: {
        key: string;
      };
      translations: {
        language: string;
        displayName: string;
      }[];
    };
    variantId?: string;
    attributeValueId?: string;
  }>;
  media: {
    url: string;
    alt: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }[];
}

export interface ProductProjection {
  id: string;
  slug: string;
  status: ProductStatus;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  translations: {
    language: string;
    name: string;
    description: string | null;
    shortDescription: string | null;
  }[];
  variants: ProductVariantProjection[];
  categories: {
    category: {
      slug: string;
      translations: {
        language: string;
        name: string;
      }[];
    };
  }[];
  media: {
    url: string;
    alt: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }[];
}

/**
 * Get products with pagination, filtering, and sorting
 */
export async function getProducts(
  filters: ProductListFilters = {},
  options: ProductListOptions = {}
): Promise<{
  products: ProductProjection[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: any = {
    deletedAt: null,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.isFeatured !== undefined) {
    where.isFeatured = filters.isFeatured;
  }

  if (filters.categorySlug) {
    where.categories = {
      some: {
        category: {
          slug: filters.categorySlug,
        },
      },
    };
  }

  if (filters.search && filters.language) {
    where.translations = {
      some: {
        language: filters.language,
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      },
    };
  }

  // Tri: fallback sur createdAt pour name/price (tris relationnels coûteux)
  const orderBy: any = {};
  const sortBy = options.sortBy ?? 'createdAt';

  if (sortBy === 'name' || sortBy === 'price') {
    logger.warn(
      {
        action: 'unsupported_sort',
        sortBy,
        fallback: 'createdAt',
      },
      `Tri par ${sortBy} non supporté, fallback sur createdAt`
    );
    orderBy.createdAt = options.sortOrder ?? 'desc';
  } else {
    orderBy[sortBy] = options.sortOrder ?? 'desc';
  }

  // Mode LIST (par défaut) vs mode DETAIL
  const includeAttributes = options.includeAttributes ?? false;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        slug: true,
        status: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
        translations: {
          where: filters.language ? { language: filters.language } : undefined,
          select: {
            language: true,
            name: true,
            description: true,
            shortDescription: true,
          },
        },
        variants: {
          where: { deletedAt: null },
          select: {
            id: true,
            sku: true,
            pricing: {
              where: { isActive: true, priceType: 'base' },
              select: {
                price: true,
                currency: true,
                priceType: true,
              },
            },
            inventory: {
              select: {
                stock: true,
                lowStockThreshold: true,
                trackInventory: true,
                allowBackorder: true,
              },
            },
            ...(includeAttributes && {
              attributeValues: {
                select: {
                  variantId: true,
                  attributeValueId: true,
                },
              },
            }),
            media: {
              where: { isPrimary: true },
              take: 1,
              select: {
                url: true,
                alt: true,
                isPrimary: true,
                sortOrder: true,
              },
            },
          },
        },
        categories: {
          select: {
            category: {
              select: {
                slug: true,
                translations: {
                  where: filters.language
                    ? { language: filters.language }
                    : undefined,
                  select: {
                    language: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        media: {
          select: {
            url: true,
            alt: true,
            isPrimary: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  logger.info(
    {
      action: 'products_fetched',
      filters,
      page,
      limit,
      total,
      count: products.length,
    },
    `Fetched ${products.length} products`
  );

  return {
    products: products.map(product => ({
      ...product,
      variants: product.variants.map(variant => ({
        ...variant,
        pricing: variant.pricing.map(p => ({
          ...p,
          price: (p.price as any).toString(),
        })),
      })),
    })) as unknown as ProductProjection[],
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Get product by slug with full details
 */
export async function getProductBySlug(
  slug: string,
  language?: Language
): Promise<ProductProjection | null> {
  const where: any = {
    slug,
    deletedAt: null,
  };

  const product = await prisma.product.findFirst({
    where,
    select: {
      id: true,
      slug: true,
      status: true,
      isFeatured: true,
      createdAt: true,
      updatedAt: true,
      translations: {
        where: language ? { language } : undefined,
        select: {
          language: true,
          name: true,
          description: true,
          shortDescription: true,
        },
      },
      variants: {
        where: { deletedAt: null },
        select: {
          id: true,
          sku: true,
          pricing: {
            where: { isActive: true, priceType: 'base' },
            select: {
              price: true,
              currency: true,
              priceType: true,
            },
          },
          inventory: {
            select: {
              stock: true,
              lowStockThreshold: true,
              trackInventory: true,
              allowBackorder: true,
            },
          },
          attributeValues: {
            select: {
              attributeValue: {
                select: {
                  value: true,
                  attribute: {
                    select: {
                      key: true,
                    },
                  },
                  translations: {
                    where: language ? { language } : undefined,
                    select: {
                      language: true,
                      displayName: true,
                    },
                  },
                },
              },
            },
          },
          media: {
            select: {
              url: true,
              alt: true,
              isPrimary: true,
              sortOrder: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
      },
      categories: {
        select: {
          category: {
            select: {
              slug: true,
              translations: {
                where: language ? { language } : undefined,
                select: {
                  language: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      media: {
        where: {
          productId: { not: null },
        },
        select: {
          url: true,
          alt: true,
          isPrimary: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
  });

  if (product) {
    logger.info(
      {
        action: 'product_fetched_by_slug',
        slug,
        productId: product.id,
        language,
      },
      `Product fetched: ${slug}`
    );

    return {
      ...product,
      variants: product.variants.map(variant => ({
        ...variant,
        pricing: variant.pricing.map(p => ({
          ...p,
          price: (p.price as any).toString(),
        })),
      })),
    } as unknown as ProductProjection;
  } else {
    logger.warn(
      {
        action: 'product_not_found',
        slug,
      },
      `Product not found: ${slug}`
    );
    return null;
  }
}

/**
 * Check if product is available for purchase
 */
export function isProductAvailable(product: ProductProjection): boolean {
  if (product.status !== ProductStatus.ACTIVE) {
    return false;
  }

  const hasStock = product.variants.some(variant => {
    if (!variant.inventory) return false;
    if (!variant.inventory.trackInventory) return true;
    if (variant.inventory.stock > 0) return true;
    return variant.inventory.allowBackorder;
  });

  return hasStock;
}

/**
 * Get product count for health checks
 */
export async function getProductCount(): Promise<number> {
  return prisma.product.count({
    where: {
      deletedAt: null,
    },
  });
}

export interface CreateProductData {
  slug: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  sortOrder?: number;
  originCountry?: string;
  hsCode?: string;
  exportExplanation?: string;
  incoterm?: string;
  shippingOriginId?: string;
  weight?: number;
  dimensions?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
  };
  translations?: {
    language: Language;
    name: string;
    description?: string;
    shortDescription?: string;
    metaTitle?: string;
    metaDescription?: string;
  }[];
}

export interface UpdateProductData {
  slug?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  sortOrder?: number;
  originCountry?: string | null;
  hsCode?: string | null;
  shippingOriginId?: string | null;
  exportExplanation?: string | null;
  incoterm?: string | null;
  weight?: number | null;
  dimensions?: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
  } | null;
  translations?: {
    language: Language;
    name: string;
    description?: string | null;
    shortDescription?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
  }[];
}

type ProductWithTranslations = Product & {
  translations: {
    id: string;
    language: Language;
    name: string;
    description: string | null;
    shortDescription: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
  }[];
};

/**
 * Get all products with translations (simple version for admin)
 */
export async function getAllProducts(): Promise<ProductWithTranslations[]> {
  return prisma.product.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      translations: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get product by ID (simple version for admin/delete)
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
 * Create new product
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
        ? (productData.dimensions as any)
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
 * Update product
 */
export async function updateProduct(
  id: string,
  productData: UpdateProductData
): Promise<ProductWithTranslations> {
  const { translations, weight, dimensions, ...productFields } = productData;

  const dataToUpdate: any = {
    ...productFields,
    updatedAt: new Date(),
  };

  if (weight !== undefined) {
    dataToUpdate.weight = weight != null ? new Prisma.Decimal(weight) : null;
  }

  if (dimensions !== undefined) {
    dataToUpdate.dimensions = dimensions != null ? (dimensions as any) : null;
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
 * Delete product (HARD DELETE - permanent)
 */
export async function deleteProduct(id: string): Promise<Product> {
  const deletedProduct = await prisma.product.delete({
    where: { id },
  });

  logger.info(
    {
      action: 'product_hard_deleted',
      productId: id,
      slug: deletedProduct.slug,
    },
    'Product permanently deleted'
  );

  return deletedProduct;
}

/**
 * Hard delete product (for testing purposes)
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
 * Transform ProductProjection into a view model for the product client component
 */
export function getProductViewModel(product: ProductProjection) {
  const images = product.media.map(m => ({
    url: m.url,
    alt: m.alt,
    isPrimary: m.isPrimary,
  }));

  const variants = product.variants.map(v => ({
    id: v.id,
    sku: v.sku,
    pricing: v.pricing.map(p => ({
      price: p.price,
      currency: p.currency,
    })),
    stock: v.inventory?.stock || 0,
    attributes: v.attributeValues.map(av => ({
      name:
        av.attributeValue?.translations[0]?.displayName ||
        av.attributeValue?.attribute.key ||
        '',
      value: av.attributeValue?.value || '',
    })),
  }));

  return {
    images,
    variants,
  };
}
