/**
 * Centralized Admin Order Actions
 */

import { API_ROUTES } from '@/lib/config/api-routes';

/**
 * Update an order status
 */
export async function updateAdminOrderStatus(
  orderId: string,
  payload: { status: string; comment?: string }
) {
  const response = await fetch(API_ROUTES.ADMIN.ORDERS.STATUS(orderId), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to update order status');
  }

  return await response.json();
}

/**
 * Purchase a shipping label for an order
 */
/**
 * Purchase a shipping label for an order
 */
export async function purchaseOrderLabel(orderId: string, rateId?: string) {
  const response = await fetch(
    API_ROUTES.ADMIN.ORDERS.PURCHASE_LABEL(orderId),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rateId }),
    }
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to purchase shipping label');
  }

  return await response.json();
}

/**
 * Create or preview a return label for an order
 */
export async function handleAdminReturnLabel(
  orderId: string,
  options: { preview?: boolean } = {}
) {
  const url = options.preview
    ? `${API_ROUTES.ADMIN.ORDERS.RETURN_LABEL(orderId)}?preview=true`
    : API_ROUTES.ADMIN.ORDERS.RETURN_LABEL(orderId);

  const response = await fetch(url, {
    method: 'POST',
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to process return label');
  }

  return await response.json();
}
