'use client';

import { useState } from 'react';

import { Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { updateSystemSetting } from '@/lib/actions/settings';

interface SettingsClientProps {
  locations: Array<{ id: string; name: string }>;
  currentLocationId: string | null;
}

export function SettingsClient({
  locations,
  currentLocationId,
}: SettingsClientProps) {
  const t = useTranslations('admin.settings');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mainLocationId, setMainLocationId] = useState(currentLocationId || '');

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      await updateSystemSetting('storefront_main_location_id', mainLocationId);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Storefront Display Settings */}
      <div className="admin-card">
        <h2 className="text-lg font-bold admin-text-main mb-6 flex items-center gap-2">
          {t('storefrontDisplay')}
        </h2>

        <div className="space-y-6">
          <div>
            <label className="admin-label">{t('mainStorefrontAddress')}</label>
            <p className="text-xs admin-text-subtle mb-3">
              {t('mainStorefrontAddressHelp')}
            </p>
            <select
              value={mainLocationId}
              onChange={e => setMainLocationId(e.target.value)}
              className="admin-input"
            >
              <option value="">{t('none')}</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="admin-btn-primary flex items-center gap-2 px-8"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t('save')}
          </button>

          {success && (
            <span className="flex items-center gap-1 text-success text-sm font-medium animate-in fade-in slide-in-from-left-2">
              <CheckCircle2 className="h-4 w-4" />
              {t('saved')}
            </span>
          )}

          {error && (
            <span className="flex items-center gap-1 text-error text-sm font-medium animate-in fade-in">
              <AlertCircle className="h-4 w-4" />
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
