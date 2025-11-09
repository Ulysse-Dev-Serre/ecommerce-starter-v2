import { NextRequest, NextResponse } from 'next/server';

import { ProductStatus, Language } from '../../../generated/prisma';
import { logger } from '../../../lib/logger';
import { withError } from '../../../lib/middleware/withError';
import {
  getProducts,
  createProduct,
  CreateProductData,
} from '../../../lib/services/product.service';

async function getProductsHandler(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);
  const status = searchParams.get('status') as ProductStatus | null;
  const isFeatured = searchParams.get('featured');
  const categorySlug = searchParams.get('category');
  const search = searchParams.get('search');
  const language = searchParams.get('language') as Language | null;
  const sortBy = (searchParams.get('sortBy') ??
    'createdAt') as keyof typeof sortByMap;
  const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';

  const sortByMap = {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    name: 'name',
    price: 'price',
  } as const;

  logger.info(
    {
      requestId,
      action: 'get_products',
      page,
      limit,
      status,
      isFeatured,
      categorySlug,
      search,
      language,
      sortBy,
      sortOrder,
    },
    'Fetching products with filters'
  );

  const filters: any = {};
  if (status && Object.values(ProductStatus).includes(status)) {
    filters.status = status;
  } else if (!status) {
    filters.status = ProductStatus.ACTIVE;
  }

  if (isFeatured !== null) {
    filters.isFeatured = isFeatured === 'true';
  }

  if (categorySlug) {
    filters.categorySlug = categorySlug;
  }

  if (search && language) {
    filters.search = search;
    filters.language = language;
  }

  const result = await getProducts(filters, {
    page,
    limit,
    sortBy: sortByMap[sortBy] ?? 'createdAt',
    sortOrder,
  });

  logger.info(
    {
      requestId,
      action: 'products_fetched_successfully',
      count: result.products.length,
      total: result.pagination.total,
      page: result.pagination.page,
    },
    `Retrieved ${result.products.length} products`
  );

  return NextResponse.json(
    {
      success: true,
      requestId,
      data: result.products,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'X-Request-ID': requestId,
      },
    }
  );
}

export const GET = withError(getProductsHandler);

async function createProductHandler(
  request: Request
): Promise<NextResponse> {
  const body = await request.json();

  logger.info(
    { action: 'create_product', slug: body.slug },
    'Creating new product'
  );

  const productData: CreateProductData = {
    slug: body.slug,
    status: body.status,
    isFeatured: body.isFeatured,
    sortOrder: body.sortOrder,
    translations: body.translations,
  };

  const product = await createProduct(productData);

  logger.info(
    {
      action: 'product_created_successfully',
      productId: product.id,
      slug: product.slug,
    },
    `Product created: ${product.slug}`
  );

  return NextResponse.json(
    {
      success: true,
      product,
      message: 'Product created successfully',
      timestamp: new Date().toISOString(),
    },
    { status: 201 }
  );
}

export const POST = withError(createProductHandler);
