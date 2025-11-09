import { NextResponse } from 'next/server';

import { prisma } from '../../../../../lib/db/prisma';
import { logger } from '../../../../../lib/logger';
import { withError } from '../../../../../lib/middleware/withError';

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
    // Direct deletion for admin/test purposes (no auth check)
    const deletedItem = await prisma.cartItem.delete({
      where: { id },
    });

    logger.info(
      {
        action: 'cart_item_removed_successfully',
        cartItemId: id,
        cartId: deletedItem.cartId,
      },
      `Cart item removed successfully`
    );

    return NextResponse.json({
      success: true,
      cartItem: deletedItem,
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
