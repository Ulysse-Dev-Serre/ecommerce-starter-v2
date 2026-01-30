/**
 * Centralized Order Actions
 */

import { API_ROUTES } from '@/lib/config/api-routes';

/**
 * Verify an order status via Payment Intent ID or Session ID
 */
export async function verifyOrder(identifier: string) {
  const isSession = identifier.startsWith('cs_');
  const paramName = isSession ? 'session_id' : 'payment_intent_id';
  const response = await fetch(
    `${API_ROUTES.ORDERS.VERIFY}?${paramName}=${identifier}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to verify order');
  }

  return await response.json();
}

/**
 * Submit a refund request
 */
export async function submitRefundRequest(
  orderId: string,
  payload: string | FormData
) {
  const isFormData = payload instanceof FormData;
  const body = isFormData
    ? payload
    : JSON.stringify({ orderId, reason: payload });
  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(API_ROUTES.ORDERS.REFUND_REQUEST, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit refund request');
  }

  return await response.json();
}
