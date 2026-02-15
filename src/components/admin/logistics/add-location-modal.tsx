'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, MapPin } from 'lucide-react';
import { Address } from '@/lib/integrations/shippo';
import { useTranslations } from 'next-intl';
import { saveLogisticsLocation } from '@/lib/client/admin/logistics';

interface AddLocationModalProps {
  onClose: () => void;
  locale: string;
  initialData?: any; // To support editing
}

export function AddLocationModal({
  onClose,
  locale,
  initialData,
}: AddLocationModalProps) {
  const router = useRouter();
  const t = useTranslations('admin.logistics');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    type: initialData?.type || 'LOCAL_STOCK', // Default
    address: {
      name: initialData?.address?.name || '',
      street1: initialData?.address?.street1 || '',
      street2: initialData?.address?.street2 || '',
      city: initialData?.address?.city || '',
      state: initialData?.address?.state || '',
      zip: initialData?.address?.zip || '',
      country: initialData?.address?.country || 'CA', // Default
      email: initialData?.address?.email || '',
      phone: initialData?.address?.phone || '',
    } as Address,
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
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
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
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="logistics-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
              <label
                htmlFor="logistics-type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('locationType')}
              </label>
              <select
                required
                value={formData.type}
                onChange={e =>
                  setFormData({ ...formData, type: e.target.value })
                }
                id="logistics-type"
                className="admin-input"
              >
                <option value="LOCAL_STOCK">{t('localStock')}</option>
                <option value="DROPSHIPPER">{t('dropshipper')}</option>
                <option value="OTHER">{t('other')}</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
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

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
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
