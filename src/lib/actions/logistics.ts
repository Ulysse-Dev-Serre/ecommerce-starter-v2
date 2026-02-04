'use server';

import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/core/logger';
import {
  logisticsLocationService,
  CreateLocationData,
  UpdateLocationData,
} from '@/lib/services/logistics/logistics-location.service';
import { createLocationSchema } from '@/lib/validators/admin';
import { formatZodErrors } from '@/lib/validators';
import { requireAdmin } from '@/lib/auth/server';

/**
 * Create a new location
 */
export async function createLocationAction(data: unknown) {
  const userId = await requireAdmin();
  const requestId = crypto.randomUUID();

  const validation = createLocationSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: formatZodErrors(validation.error),
    };
  }

  try {
    const location = await logisticsLocationService.createLocation(
      validation.data as CreateLocationData
    );
    logger.info(
      { requestId, action: 'create_location', userId, locationId: location.id },
      'Location created via Server Action'
    );

    revalidatePath('/admin/logistics/locations');
    return { success: true, data: location };
  } catch (error) {
    logger.error({ requestId, error, userId }, 'Failed to create location');
    return { success: false, error: 'Failed to create location' };
  }
}

/**
 * Update a location
 */
export async function updateLocationAction(id: string, data: unknown) {
  const userId = await requireAdmin();
  const requestId = crypto.randomUUID();

  // Re-use create schema for now as partial updates might require a different schema or permissive Partial one.
  // The previous API used the same schema but required all fields. Let's start with full object update as per API.
  const validation = createLocationSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: formatZodErrors(validation.error),
    };
  }

  try {
    const location = await logisticsLocationService.updateLocation(
      id,
      validation.data as UpdateLocationData
    );
    logger.info(
      { requestId, action: 'update_location', userId, locationId: location.id },
      'Location updated via Server Action'
    );

    revalidatePath('/admin/logistics/locations');
    return { success: true, data: location };
  } catch (error) {
    logger.error({ requestId, error, userId }, 'Failed to update location');
    return { success: false, error: 'Failed to update location' };
  }
}

/**
 * Delete (Deactivate) a location
 */
export async function deleteLocationAction(id: string) {
  const userId = await requireAdmin();
  const requestId = crypto.randomUUID();

  try {
    await logisticsLocationService.deleteLocation(id);
    logger.info(
      { requestId, action: 'delete_location', userId, locationId: id },
      'Location deleted via Server Action'
    );

    revalidatePath('/admin/logistics/locations');
    return { success: true };
  } catch (error) {
    logger.error({ requestId, error, userId }, 'Failed to delete location');
    return { success: false, error: 'Failed to delete location' };
  }
}
