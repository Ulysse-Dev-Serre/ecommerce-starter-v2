import { NextResponse } from 'next/server';

import { logger } from '../../../../../lib/logger';
import { withError } from '../../../../../lib/middleware/withError';
import { removeCartLine } from '../../../../../lib/services/cart.service';

async function deleteCartItemHandler(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  logger.info(
    { action: 'remove_cart_item', cartItemId: id },
    `Processing removal of cart item ${id}`
  );

  try {
    await removeCartLine(id);

    logger.info(
      {
        action: 'cart_item_removed_successfully',
        cartItemId: id,
      },
      `Cart item removed successfully`
    );

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      logger.warn(
        { action: 'remove_cart_item_not_found', cartItemId: id },
        `Cart item ${id} not found`
      );
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      );
    }
    throw error;
  }
}

export const DELETE = withError(deleteCartItemHandler);
