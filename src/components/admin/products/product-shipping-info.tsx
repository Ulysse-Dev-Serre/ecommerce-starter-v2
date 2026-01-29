'use client';

import { Truck } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  city: string;
  country: string;
}

interface ProductShippingInfoProps {
  formData: {
    originCountry: string;
    hsCode: string;
    shippingOriginId: string;
    exportExplanation: string;
    incoterm: string;
    weight: string;
    length: string;
    width: string;
    height: string;
  };
  setFormData: (fn: (prev: any) => any) => void;
  suppliers: Supplier[];
  t: (key: string) => string;
}

export function ProductShippingInfo({
  formData,
  setFormData,
  suppliers,
  t,
}: ProductShippingInfoProps) {
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="admin-card">
      <div className="mb-4 flex items-center gap-2">
        <Truck className="h-5 w-5 admin-text-subtle" />
        <h2 className="admin-section-title">{t('shippingAndLogistics')}</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('originCountry')}
            </label>
            <input
              type="text"
              value={formData.originCountry}
              onChange={e => handleChange('originCountry', e.target.value)}
              placeholder="e.g. CA, US, FR"
              className="admin-input uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('shippingOrigin')}
            </label>
            <select
              value={formData.shippingOriginId}
              onChange={e => handleChange('shippingOriginId', e.target.value)}
              className="admin-input"
            >
              <option value="">{t('selectOrigin')}</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} - {s.city}, {s.country}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('hsCode')}
            </label>
            <input
              type="text"
              value={formData.hsCode}
              onChange={e => handleChange('hsCode', e.target.value)}
              placeholder="e.g. 1234.56.78"
              className="admin-input"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('weight')} (kg)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.weight}
                onChange={e => handleChange('weight', e.target.value)}
                className="admin-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('incoterm')}
              </label>
              <input
                type="text"
                value={formData.incoterm}
                onChange={e => handleChange('incoterm', e.target.value)}
                placeholder="e.g. EXW, FOB"
                className="admin-input uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dimensions')} (cm)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                step="0.1"
                value={formData.length}
                onChange={e => handleChange('length', e.target.value)}
                placeholder="L"
                className="admin-input"
              />
              <input
                type="number"
                step="0.1"
                value={formData.width}
                onChange={e => handleChange('width', e.target.value)}
                placeholder="W"
                className="admin-input"
              />
              <input
                type="number"
                step="0.1"
                value={formData.height}
                onChange={e => handleChange('height', e.target.value)}
                placeholder="H"
                className="admin-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('exportExplanation')}
            </label>
            <textarea
              value={formData.exportExplanation}
              onChange={e => handleChange('exportExplanation', e.target.value)}
              rows={2}
              className="admin-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
