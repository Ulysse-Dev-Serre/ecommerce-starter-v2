import { NextResponse } from 'next/server';

import { logger } from '../../../../lib/logger';
import { withError } from '../../../../lib/middleware/withError';
import {
  deleteProduct,
  getProductById,
} from '../../../../lib/services/product.service';

async function deleteProductHandler(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  logger.info(
    { action: 'delete_product', productId: id },
    `Processing deletion for product ${id}`
  );

  const product = await getProductById(id);
  if (!product) {
    logger.warn(
      { action: 'delete_product_not_found', productId: id },
      `Product ${id} not found`
    );
    return NextResponse.json(
      { success: false, error: 'Product not found' },
      { status: 404 }
    );
  }

  const deletedProduct = await deleteProduct(id);

  logger.info(
    {
      action: 'product_deleted_successfully',
      productId: id,
      slug: deletedProduct.slug,
    },
    `Product deleted successfully: ${deletedProduct.slug}`
  );

  return NextResponse.json({
    success: true,
    product: deletedProduct,
    message: 'Product deleted successfully',
    timestamp: new Date().toISOString(),
  });
}

export const DELETE = withError(deleteProductHandler);
