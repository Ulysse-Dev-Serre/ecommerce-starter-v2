/**
 * Centralized Shipping Actions
 */

import { API_ROUTES } from '@/lib/config/api-routes';

export interface ShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  email: string;
  phone: string;
}

/**
 * Fetch shipping rates for a cart and address
 */
export async function getShippingRates(
  cartId: string,
  addressTo: ShippingAddress
) {
  const response = await fetch(API_ROUTES.SHIPPING.RATES, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cartId,
      addressTo,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch shipping rates');
  }

  return await response.json();
}
