import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';

export const SettingsService = {
  /**
   * Get a system setting by key
   */
  async getSetting(key: string) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });
    return setting?.value || null;
  },

  /**
   * Update or create a system setting
   */
  async updateSetting(
    key: string,
    value: string,
    type: string = 'string',
    description?: string
  ) {
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, type, description },
      create: { key, value, type, description },
    });

    logger.info({ key, value }, 'System setting updated');
    return setting;
  },

  /**
   * Get multiple settings at once
   */
  async getSettings(keys: string[]) {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: keys },
      },
    });

    return settings.reduce(
      (acc: Record<string, string>, curr: { key: string; value: string }) => {
        acc[curr.key] = curr.value;
        return acc;
      },
      {} as Record<string, string>
    );
  },
};
