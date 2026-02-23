import { getTranslations } from 'next-intl/server';

import { logisticsLocationService } from '@/lib/services/logistics/logistics-location.service';
import { SettingsService } from '@/lib/services/settings/settings.service';

import { SettingsClient } from './settings-client';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.settings' });

  // Fetch all logistics locations
  const locations = await logisticsLocationService.getLocations();

  // Fetch current main location ID setting
  const mainLocationId = await SettingsService.getSetting(
    'storefront_main_location_id'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b admin-border-subtle pb-4 mb-6">
        <div>
          <h1 className="admin-page-title">{t('title')}</h1>
          <p className="admin-page-subtitle">{t('subtitle')}</p>
        </div>
      </div>

      <SettingsClient
        locations={locations.map(l => ({ id: l.id, name: l.name }))}
        currentLocationId={mainLocationId}
      />
    </div>
  );
}
