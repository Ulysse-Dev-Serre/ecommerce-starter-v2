'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, MapPin } from 'lucide-react';
import { Address } from '@/lib/services/shippo';
import { useTranslations } from 'next-intl';

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
    incoterm: initialData?.incoterm || 'DDU', // Default
    address: {
      name: initialData?.address?.name || 'Default',
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
      const url = initialData
        ? `/api/admin/logistics/locations/${initialData.id}`
        : '/api/admin/logistics/locations';

      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to save location');
      }

      window.location.reload();
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la sauvegarde du lieu');
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
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {initialData ? t('editLocation') : <Plus className="h-5 w-5" />}
            {initialData ? '' : t('addLocation')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Types & Nom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du lieu (ex: Entrepôt Principal)
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Mon Entrepôt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de lieu
              </label>
              <select
                required
                value={formData.type}
                onChange={e =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm bg-white"
              >
                <option value="LOCAL_STOCK">Local Stock (Warehouse)</option>
                <option value="DROPSHIPPER">Dropshipper</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default Incoterm
              </label>
              <select
                required
                value={formData.incoterm}
                onChange={e =>
                  setFormData({ ...formData, incoterm: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm bg-white"
              >
                <option value="DDU">DDU (Customer pays duties)</option>
                <option value="DDP">DDP (Sender pays duties)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Determines who pays customs fees for international shipments.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Adresse de départ (pour le calcul des tarifs)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Adresse (Rue)
                </label>
                <input
                  type="text"
                  required
                  value={formData.address.street1}
                  onChange={e => updateAddress('street1', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="123 rue Exemple"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  required
                  value={formData.address.city}
                  onChange={e => updateAddress('city', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Montréal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Province / État
                </label>
                <input
                  type="text"
                  required
                  value={formData.address.state}
                  onChange={e => updateAddress('state', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="QC"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Code Postal / ZIP
                </label>
                <input
                  type="text"
                  required
                  value={formData.address.zip}
                  onChange={e => updateAddress('zip', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="H1A 1A1"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Pays (Code ISO 2 lettres)
                </label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={formData.address.country}
                  onChange={e =>
                    updateAddress('country', e.target.value.toUpperCase())
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="CA"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Email contact (Optionnel)
                </label>
                <input
                  type="email"
                  value={formData.address.email || ''}
                  onChange={e => updateAddress('email', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="logistics@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Téléphone (Optionnel)
                </label>
                <input
                  type="text"
                  value={formData.address.phone || ''}
                  onChange={e => updateAddress('phone', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t('cancel') || 'Annuler'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {loading
                ? t('loading') || 'Sauvegarde...'
                : t('save') || 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
