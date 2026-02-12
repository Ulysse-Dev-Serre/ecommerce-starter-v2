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
  fieldErrors?: Record<string, string>;
  t: (key: string) => string;
}

export function ProductShippingInfo({
  formData,
  setFormData,
  suppliers,
  fieldErrors = {},
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
              id="originCountry"
              name="originCountry"
              value={formData.originCountry}
              onChange={e => handleChange('originCountry', e.target.value)}
              placeholder="e.g. CA, US, FR"
              className={`admin-input uppercase ${fieldErrors.originCountry ? 'border-red-500 bg-red-50' : ''}`}
            />
            {fieldErrors.originCountry && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {fieldErrors.originCountry}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('shippingOrigin')}
            </label>
            <select
              name="shippingOriginId"
              id="shippingOriginId"
              value={formData.shippingOriginId}
              onChange={e => handleChange('shippingOriginId', e.target.value)}
              className={`admin-input ${fieldErrors.shippingOriginId ? 'border-red-500 bg-red-50' : ''}`}
            >
              <option value="">{t('selectOrigin')}</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} - {s.city}, {s.country}
                </option>
              ))}
            </select>
            {fieldErrors.shippingOriginId && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {fieldErrors.shippingOriginId}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('hsCode')}
            </label>
            <input
              type="text"
              id="hsCode"
              name="hsCode"
              value={formData.hsCode}
              onChange={e => handleChange('hsCode', e.target.value)}
              placeholder="e.g. 1234.56.78"
              className={`admin-input ${fieldErrors.hsCode ? 'border-red-500 bg-red-50' : ''}`}
            />
            {fieldErrors.hsCode && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {fieldErrors.hsCode}
              </p>
            )}
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
                id="weight"
                name="weight"
                step="0.001"
                min="0"
                value={formData.weight}
                onChange={e => handleChange('weight', e.target.value)}
                className={`admin-input ${fieldErrors.weight ? 'border-red-500 bg-red-50' : ''}`}
              />
              {fieldErrors.weight && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {fieldErrors.weight}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('incoterm')}
              </label>
              <input
                type="text"
                id="incoterm"
                name="incoterm"
                value={formData.incoterm}
                onChange={e => handleChange('incoterm', e.target.value)}
                placeholder="e.g. EXW, FOB"
                className={`admin-input uppercase ${fieldErrors.incoterm ? 'border-red-500 bg-red-50' : ''}`}
              />
              {fieldErrors.incoterm && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {fieldErrors.incoterm}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dimensions')} (cm)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <input
                  type="number"
                  id="length"
                  name="length"
                  step="0.1"
                  value={formData.length}
                  onChange={e => handleChange('length', e.target.value)}
                  placeholder="L"
                  className={`admin-input ${fieldErrors['dimensions.length'] ? 'border-red-500 bg-red-50' : ''}`}
                />
                {fieldErrors['dimensions.length'] && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {fieldErrors['dimensions.length']}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="number"
                  id="width"
                  name="width"
                  step="0.1"
                  value={formData.width}
                  onChange={e => handleChange('width', e.target.value)}
                  placeholder="W"
                  className={`admin-input ${fieldErrors['dimensions.width'] ? 'border-red-500 bg-red-50' : ''}`}
                />
                {fieldErrors['dimensions.width'] && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {fieldErrors['dimensions.width']}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="number"
                  id="height"
                  name="height"
                  step="0.1"
                  value={formData.height}
                  onChange={e => handleChange('height', e.target.value)}
                  placeholder="H"
                  className={`admin-input ${fieldErrors['dimensions.height'] ? 'border-red-500 bg-red-50' : ''}`}
                />
                {fieldErrors['dimensions.height'] && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {fieldErrors['dimensions.height']}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('exportExplanation')}
            </label>
            <textarea
              id="exportExplanation"
              name="exportExplanation"
              value={formData.exportExplanation}
              onChange={e => handleChange('exportExplanation', e.target.value)}
              rows={2}
              className={`admin-input ${fieldErrors.exportExplanation ? 'border-red-500 bg-red-50' : ''}`}
            />
            {fieldErrors.exportExplanation && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {fieldErrors.exportExplanation}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
