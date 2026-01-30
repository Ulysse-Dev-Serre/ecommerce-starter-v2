/**
 * Centralized Admin Logistics Actions
 */

import { API_ROUTES } from '@/lib/config/api-routes';

/**
 * Handle creation or update of a logistics location
 */
export async function saveLogisticsLocation(payload: any, locationId?: string) {
  const url = locationId
    ? API_ROUTES.ADMIN.LOGISTICS.ITEM(locationId)
    : API_ROUTES.ADMIN.LOGISTICS.BASE;

  const method = locationId ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to save logistics location');
  }

  return await response.json();
}

/**
 * Delete a logistics location
 */
export async function deleteLogisticsLocation(locationId: string) {
  const response = await fetch(API_ROUTES.ADMIN.LOGISTICS.ITEM(locationId), {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete logistics location');
  }

  return await response.json();
}
