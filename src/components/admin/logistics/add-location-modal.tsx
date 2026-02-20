'use client';

import { useState } from 'react';

import { Plus, X, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { saveLogisticsLocation } from '@/lib/client/admin/logistics';
import { STORE_ORIGIN_ADDRESS } from '@/lib/config/site';
import { Address } from '@/lib/integrations/shippo';
import { AdminSupplier } from '@/lib/types/domain/logistics';

import { SupplierType } from '@/generated/prisma';

interface AddLocationModalProps {
  onClose: () => void;
  locale: string;
  initialData?: AdminSupplier | null; // To support editing
}

export function AddLocationModal({
  onClose,
  locale: _locale,
  initialData,
}: AddLocationModalProps) {
  const router = useRouter();
  const t = useTranslations('admin.logistics');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialAddress = initialData?.address as unknown as Address | undefined;

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    type: (initialData?.type as string) || '', // Force user selection if new
    incoterm: initialData?.incoterm || '', // Force selection
    address: {
      name: initialAddress?.name || '',
      street1: initialAddress?.street1 || '',
      street2: initialAddress?.street2 || '',
      city: initialAddress?.city || '',
      state: initialAddress?.state || '',
      zip: initialAddress?.zip || '',
      country: initialAddress?.country || STORE_ORIGIN_ADDRESS.country,
      email: initialAddress?.email || '',
      phone: initialAddress?.phone || '',
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await saveLogisticsLocation(formData, initialData?.id);

      router.refresh();
      onClose();
    } catch (err) {
      console.error(err);
      setError(t('saveError'));
    } finally {
      setLoading(false);
    }
  };

  const updateAddress = (field: keyof Address, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b admin-border-subtle pb-4 mb-6">
          <h2 className="admin-section-title flex items-center gap-2">
            {initialData ? (
              <MapPin className="h-5 w-5" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
            {initialData ? t('editLocation') : t('addLocation')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 admin-text-subtle hover:admin-bg-subtle hover:admin-text-main transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mb-6 admin-alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="logistics-name" className="admin-label">
                {t('locationName')}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                id="logistics-name"
                className="admin-input"
                placeholder={t('locationName')}
              />
            </div>
            <div>
              <label htmlFor="logistics-type" className="admin-label">
                {t('locationType')}
              </label>
              <select
                required
                value={formData.type}
                onChange={e =>
                  setFormData({
                    ...formData,
                    type: e.target.value as SupplierType,
                  })
                }
                id="logistics-type"
                className="admin-input"
              >
                <option value="" disabled>
                  {t('selectType')}
                </option>
                <option value="LOCAL_STOCK">{t('localStock')}</option>
                <option value="DROPSHIPPER">{t('dropshipper')}</option>
                <option value="OTHER">{t('other')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="logistics-incoterm" className="admin-label">
                {t('incoterm')}
              </label>
              <select
                required
                value={formData.incoterm}
                onChange={e =>
                  setFormData({
                    ...formData,
                    incoterm: e.target.value as 'DDP' | 'DDU',
                  })
                }
                id="logistics-incoterm"
                className="admin-input"
              >
                <option value="" disabled>
                  {t('selectIncoterm')}
                </option>
                <option value="DDP">DDP (Delivered Duty Paid)</option>
                <option value="DDU">DDU (Delivered Duty Unpaid)</option>
              </select>
            </div>
          </div>

          <div className="border-t admin-border-subtle pt-6">
            <h3 className="text-sm font-semibold admin-text-main mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 admin-text-subtle" />
              {t('originAddress')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label
                  htmlFor="logistics-sender-name"
                  className="block text-xs font-medium admin-text-subtle mb-1"
                >
                  {t('senderName')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.address.name}
                  onChange={e => updateAddress('name', e.target.value)}
                  id="logistics-sender-name"
                  className="admin-input text-sm"
                  placeholder={t('senderNamePlaceholder')}
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="logistics-street"
                  className="block text-xs font-medium admin-text-subtle mb-1"
                >
                  {t('street')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.address.street1}
                  onChange={e => updateAddress('street1', e.target.value)}
                  id="logistics-street"
                  className="admin-input text-sm"
                  placeholder={t('streetPlaceholder')}
                />
              </div>

              <div>
                <label
                  htmlFor="logistics-city"
                  className="block text-xs font-medium admin-text-subtle mb-1"
                >
                  {t('city')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.address.city}
                  onChange={e => updateAddress('city', e.target.value)}
                  id="logistics-city"
                  className="admin-input text-sm"
                  placeholder={t('cityPlaceholder')}
                />
              </div>

              <div>
                <label
                  htmlFor="logistics-state"
                  className="block text-xs font-medium admin-text-subtle mb-1"
                >
                  {t('state')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.address.state}
                  onChange={e => updateAddress('state', e.target.value)}
                  id="logistics-state"
                  className="admin-input text-sm"
                  placeholder={t('statePlaceholder')}
                />
              </div>

              <div>
                <label
                  htmlFor="logistics-zip"
                  className="block text-xs font-medium admin-text-subtle mb-1"
                >
                  {t('zip')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.address.zip}
                  onChange={e => updateAddress('zip', e.target.value)}
                  id="logistics-zip"
                  className="admin-input text-sm"
                  placeholder={t('zipPlaceholder')}
                />
              </div>

              <div>
                <label
                  htmlFor="logistics-country"
                  className="block text-xs font-medium admin-text-subtle mb-1"
                >
                  {t('country')}
                </label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={formData.address.country}
                  onChange={e =>
                    updateAddress('country', e.target.value.toUpperCase())
                  }
                  id="logistics-country"
                  className="admin-input text-sm"
                  placeholder={t('countryPlaceholder')}
                />
              </div>

              <div>
                <label
                  htmlFor="logistics-email"
                  className="block text-xs font-medium admin-text-subtle mb-1"
                >
                  {t('email')}
                </label>
                <input
                  type="email"
                  required
                  value={formData.address.email || ''}
                  onChange={e => updateAddress('email', e.target.value)}
                  id="logistics-email"
                  className="admin-input text-sm"
                  placeholder={t('emailPlaceholder')}
                />
              </div>
              <div>
                <label
                  htmlFor="logistics-phone"
                  className="block text-xs font-medium admin-text-subtle mb-1"
                >
                  {t('phone')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.address.phone || ''}
                  onChange={e => updateAddress('phone', e.target.value)}
                  id="logistics-phone"
                  className="admin-input text-sm"
                  placeholder={t('phone')}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t admin-border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="admin-btn-secondary px-6"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="admin-btn-primary px-8"
            >
              {loading ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
