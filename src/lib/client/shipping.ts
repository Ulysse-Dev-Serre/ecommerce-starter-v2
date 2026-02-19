/**
 * Centralized Shipping Actions
 */

import { API_ROUTES } from '@/lib/config/api-routes';
import { ShippingAddress } from '@/lib/types/domain/shipping';

import { ShippingRate } from '@/lib/integrations/shippo';

/**
 * Fetch shipping rates for a cart and address
 */
export async function getShippingRates(
  cartId: string,
  addressTo: ShippingAddress,
  items?: Array<{ variantId: string; quantity: number }>
): Promise<{ rates: ShippingRate[] }> {
  const response = await fetch(API_ROUTES.SHIPPING.RATES, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cartId,
      addressTo,
      items,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch shipping rates');
  }

  return (await response.json()) as { rates: ShippingRate[] };
}
