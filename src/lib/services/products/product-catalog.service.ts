import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { AppError, ErrorCode } from '@/lib/types/api/errors';
import {
  ProductListFilters,
  ProductListOptions,
  ProductProjection,
} from '@/lib/types/domain/product';

import { ProductStatus, Language, Prisma } from '@/generated/prisma';

/**
 * Retrieves a list of products with pagination, filters, and sorting.
 * Used for: home page, shop, search.
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

  const where: Prisma.ProductWhereInput = {
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

  // Sorting: fallback to createdAt for name/price (relational sorting is expensive)
  const orderBy: Prisma.ProductOrderByWithRelationInput = {};
  const sortBy = options.sortBy ?? 'createdAt';

  if (sortBy === 'name' || sortBy === 'price') {
    logger.warn(
      {
        action: 'unsupported_sort',
        sortBy,
        fallback: 'createdAt',
      },
      `Sorting by ${sortBy} not supported, falling back to createdAt`
    );
    orderBy.createdAt = (options.sortOrder ?? 'desc') as Prisma.SortOrder;
  } else if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
    orderBy[sortBy] = (options.sortOrder ?? 'desc') as Prisma.SortOrder;
  }

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
                  attributeValue: {
                    select: {
                      value: true,
                      attribute: {
                        select: {
                          key: true,
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
                      translations: {
                        where: filters.language
                          ? { language: filters.language }
                          : undefined,
                        select: {
                          language: true,
                          displayName: true,
                        },
                      },
                    },
                  },
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
          price: Number(p.price),
        })),
        attributeValues: variant.attributeValues || [],
      })),
    })) as ProductProjection[],
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Retrieves a product by its slug with all details.
 * Used for: product detail page.
 */
export async function getProductBySlug(
  slug: string,
  language?: Language
): Promise<ProductProjection> {
  const product = await prisma.product.findUnique({
    where: { slug, deletedAt: null },
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
                      translations: {
                        where: language ? { language } : undefined,
                        select: {
                          language: true,
                          name: true,
                        },
                      },
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
              variantId: true,
              attributeValueId: true,
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

  if (!product) {
    throw new AppError(ErrorCode.NOT_FOUND, `Product not found: ${slug}`, 404);
  }

  return {
    ...product,
    variants: product.variants.map(variant => ({
      ...variant,
      pricing: variant.pricing.map(p => ({
        ...p,
        price: Number(p.price),
      })),
    })),
  } as ProductProjection;
}

/**
 * Checks if a product is available for purchase.
 */
export function isProductAvailable(product: ProductProjection): boolean {
  if (product.status !== ProductStatus.ACTIVE) {
    return false;
  }

  const hasAvailableVariant = product.variants.some(variant => {
    if (!variant.inventory) {
      return true;
    }

    if (!variant.inventory.trackInventory) {
      return true;
    }

    return variant.inventory.stock > 0 || variant.inventory.allowBackorder;
  });

  return hasAvailableVariant;
}

/**
 * Counts total active products (health check).
 */
export async function getProductCount(): Promise<number> {
  const count = await prisma.product.count({
    where: {
      deletedAt: null,
      status: ProductStatus.ACTIVE,
    },
  });

  return count;
}

/**
 * Transforms ProductProjection into a ViewModel for client components.
 */
export function getProductViewModel(product: ProductProjection) {
  const images = product.media.map(m => ({
    url: m.url,
    alt: m.alt || null,
    isPrimary: m.isPrimary,
  }));

  const variants = product.variants.map(v => ({
    id: v.id,
    sku: v.sku,
    pricing: v.pricing.map(p => ({
      price: Number(p.price),
      currency: p.currency,
    })),
    stock: v.inventory?.stock || 0,
    attributes: (v.attributeValues || []).map(av => ({
      name:
        av.attributeValue?.attribute.translations[0]?.name ||
        av.attributeValue?.attribute.key ||
        '',
      value:
        av.attributeValue?.translations[0]?.displayName ||
        av.attributeValue?.value ||
        '',
    })),
  }));

  return {
    images,
    variants,
  };
}
