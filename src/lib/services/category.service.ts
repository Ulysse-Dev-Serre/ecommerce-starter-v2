import { Language } from '../../generated/prisma';
import { prisma } from '../db/prisma';
import { logger } from '../logger';

export interface CategoryTranslationProjection {
  language: string;
  name: string;
  description: string | null;
}

export interface CategoryProjection {
  id: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  translations: CategoryTranslationProjection[];
  children?: CategoryProjection[];
  productsCount?: number;
  path?: CategoryProjection[];
}

/**
 * Get all categories with hierarchical structure
 */
export async function getCategories(
  language?: Language
): Promise<CategoryProjection[]> {
  const where: any = {
    deletedAt: null,
  };

  const categories = await prisma.category.findMany({
    where,
    orderBy: {
      sortOrder: 'asc',
    },
    select: {
      id: true,
      slug: true,
      parentId: true,
      sortOrder: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      translations: {
        where: language ? { language } : undefined,
        select: {
          language: true,
          name: true,
          description: true,
        },
      },
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  const categoriesWithCount = categories.map(cat => ({
    ...cat,
    productsCount: cat._count.products,
    _count: undefined,
  }));

  const tree = buildCategoryTree(
    categoriesWithCount as unknown as CategoryProjection[]
  );

  logger.info(
    {
      action: 'categories_fetched',
      count: categories.length,
      rootCount: tree.length,
      language,
    },
    `Fetched ${categories.length} categories`
  );

  return tree;
}

/**
 * Get category by slug with details
 */
export async function getCategoryBySlug(
  slug: string,
  language?: Language
): Promise<CategoryProjection | null> {
  const category = await prisma.category.findFirst({
    where: {
      slug,
      deletedAt: null,
    },
    select: {
      id: true,
      slug: true,
      parentId: true,
      sortOrder: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      translations: {
        where: language ? { language } : undefined,
        select: {
          language: true,
          name: true,
          description: true,
        },
      },
      children: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          sortOrder: 'asc',
        },
        select: {
          id: true,
          slug: true,
          parentId: true,
          sortOrder: true,
          isActive: true,
          translations: {
            where: language ? { language } : undefined,
            select: {
              language: true,
              name: true,
              description: true,
            },
          },
          _count: {
            select: {
              products: true,
            },
          },
        },
      },
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  if (!category) {
    logger.warn(
      {
        action: 'category_not_found',
        slug,
      },
      `Category not found: ${slug}`
    );
    return null;
  }

  const categoryWithPath = category as unknown as CategoryProjection;
  categoryWithPath.productsCount = category._count.products;

  if (category.children) {
    categoryWithPath.children = category.children.map(child => ({
      ...child,
      productsCount: child._count.products,
      _count: undefined,
    })) as unknown as CategoryProjection[];
  }

  const path = await getCategoryPath(category.id, language);
  categoryWithPath.path = path;

  logger.info(
    {
      action: 'category_fetched_by_slug',
      slug,
      categoryId: category.id,
      childrenCount: category.children?.length ?? 0,
      language,
    },
    `Category fetched: ${slug}`
  );

  return categoryWithPath;
}

/**
 * Build hierarchical tree from flat category list
 */
function buildCategoryTree(
  categories: CategoryProjection[]
): CategoryProjection[] {
  const categoryMap = new Map<string, CategoryProjection>();
  const rootCategories: CategoryProjection[] = [];

  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  categories.forEach(cat => {
    const categoryNode = categoryMap.get(cat.id);
    if (!categoryNode) return;

    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        parent.children = parent.children ?? [];
        parent.children.push(categoryNode);
      } else {
        rootCategories.push(categoryNode);
      }
    } else {
      rootCategories.push(categoryNode);
    }
  });

  return rootCategories;
}

/**
 * Get breadcrumb path for a category (for SEO/UX)
 */
export async function getCategoryPath(
  categoryId: string,
  language?: Language
): Promise<CategoryProjection[]> {
  const path: CategoryProjection[] = [];
  let currentId: string | null = categoryId;

  while (currentId) {
    const category: any = await prisma.category.findUnique({
      where: { id: currentId },
      select: {
        id: true,
        slug: true,
        parentId: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        translations: {
          where: language ? { language } : undefined,
          select: {
            language: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!category) break;

    path.unshift(category as unknown as CategoryProjection);
    currentId = category.parentId;
  }

  return path;
}

/**
 * Get category count for health checks
 */
export async function getCategoryCount(): Promise<number> {
  return prisma.category.count({
    where: {
      deletedAt: null,
    },
  });
}
