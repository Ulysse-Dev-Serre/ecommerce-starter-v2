'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/server';
import { logger } from '@/lib/core/logger';
import { updateOrderStatus } from '@/lib/services/orders';

import { OrderStatus } from '@/generated/prisma';

/**
 * Update Order Status
 */
export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  comment?: string
) {
  const userId = await requireAdmin();
  const requestId = crypto.randomUUID();

  try {
    const result = await updateOrderStatus({
      orderId,
      status,
      comment,
      userId,
    });

    logger.info(
      { requestId, action: 'update_order_status', userId, orderId, status },
      'Order status updated via Server Action'
    );

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');

    return { success: true, data: result };
  } catch (error) {
    logger.error(
      {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      },
      'Failed to update order status'
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update order status',
    };
  }
}
