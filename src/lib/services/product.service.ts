import { Prisma, ProductStatus, Language } from '../../generated/prisma';
import { prisma } from '../db/prisma';
import { logger } from '../logger';

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
}

export interface ProductVariantProjection {
  id: string;
  sku: string;
  pricing: {
    price: Prisma.Decimal;
    currency: string;
    priceType: string;
  }[];
  inventory: {
    stock: number;
    lowStockThreshold: number;
    trackInventory: boolean;
    allowBackorder: boolean;
  } | null;
  attributeValues: {
    attributeValue: {
      value: string;
      attribute: {
        key: string;
      };
      translations: {
        language: string;
        displayName: string;
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

  const orderBy: any = {};
  if (options.sortBy === 'name' && filters.language) {
    orderBy.translations = {
      _count: 'desc',
    };
  } else if (options.sortBy === 'price') {
    orderBy.variants = {
      _count: 'desc',
    };
  } else {
    orderBy[options.sortBy ?? 'createdAt'] = options.sortOrder ?? 'desc';
  }

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
              where: { isActive: true },
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
    products: products as ProductProjection[],
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
            where: { isActive: true },
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
  } else {
    logger.warn(
      {
        action: 'product_not_found',
        slug,
      },
      `Product not found: ${slug}`
    );
  }

  return product as unknown as ProductProjection | null;
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
