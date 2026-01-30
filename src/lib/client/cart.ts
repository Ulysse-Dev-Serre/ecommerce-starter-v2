/**
 * Centralized Client-side Cart Actions
 */

import { API_ROUTES } from '@/lib/config/api-routes';

/**
 * Add an item variant to the cart
 */
export async function addToCart(variantId: string, quantity: number = 1) {
  const response = await fetch(API_ROUTES.CART.LINES(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      variantId,
      quantity,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add to cart');
  }

  return await response.json();
}

/**
 * Update the quantity of an existing item in the cart
 */
export async function updateCartItem(itemId: string, quantity: number) {
  const response = await fetch(API_ROUTES.CART.LINES(itemId), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      quantity,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update quantity');
  }

  return await response.json();
}

/**
 * Remove an item from the cart
 */
export async function removeFromCart(itemId: string) {
  const response = await fetch(API_ROUTES.CART.LINES(itemId), {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove item');
  }

  return await response.json();
}

/**
 * Merge anonymous cart into authenticated user cart
 */
export async function mergeCart() {
  const response = await fetch(API_ROUTES.CART.MERGE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to merge cart');
  }

  return await response.json();
}
