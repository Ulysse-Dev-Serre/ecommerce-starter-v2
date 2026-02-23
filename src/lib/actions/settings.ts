'use server';

import { revalidatePath } from 'next/cache';

import { SettingsService } from '@/lib/services/settings/settings.service';

/**
 * Update a system setting from the admin panel
 */
export async function updateSystemSetting(key: string, value: string) {
  await SettingsService.updateSetting(key, value);
  revalidatePath('/[locale]/admin/settings', 'page');
  return { success: true };
}
