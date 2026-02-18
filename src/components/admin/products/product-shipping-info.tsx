'use client';

import { Truck } from 'lucide-react';

import { AdminSupplier } from '@/lib/types/domain/logistics';
import { Address } from '@/lib/types/domain/order';

const getSupplierAddress = (supplier: AdminSupplier) => {
  const address = supplier.address as unknown as Address;
  return {
    city: address?.city || '',
    country: address?.country || '',
  };
};

interface ProductShippingInfoProps {
  formData: {
    originCountry: string;
    hsCode: string;
    shippingOriginId: string;
    exportExplanation: string;
    weight: string;
    length: string;
    width: string;
    height: string;
  };
  setFormData: (fn: (prev: any) => any) => void;
  suppliers: AdminSupplier[];
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
            <label className="admin-label">{t('originCountry')}</label>
            <input
              type="text"
              id="originCountry"
              name="originCountry"
              value={formData.originCountry}
              onChange={e => handleChange('originCountry', e.target.value)}
              placeholder="e.g. CA, US, FR"
              className={`admin-input uppercase ${fieldErrors.originCountry ? 'admin-border-error admin-bg-error-subtle' : ''}`}
            />
            {fieldErrors.originCountry && (
              <p className="admin-error-text">{fieldErrors.originCountry}</p>
            )}
          </div>

          <div>
            <label className="admin-label">{t('shippingOrigin')}</label>
            <select
              name="shippingOriginId"
              id="shippingOriginId"
              value={formData.shippingOriginId}
              onChange={e => handleChange('shippingOriginId', e.target.value)}
              className={`admin-input ${fieldErrors.shippingOriginId ? 'admin-border-error admin-bg-error-subtle' : ''}`}
            >
              <option value="">{t('selectOrigin')}</option>
              {suppliers.map(s => {
                const { city, country } = getSupplierAddress(s);
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} - {city}, {country}
                  </option>
                );
              })}
            </select>
            {fieldErrors.shippingOriginId && (
              <p className="admin-error-text">{fieldErrors.shippingOriginId}</p>
            )}
          </div>

          <div>
            <label className="admin-label">{t('hsCode')}</label>
            <input
              type="text"
              id="hsCode"
              name="hsCode"
              value={formData.hsCode}
              onChange={e => handleChange('hsCode', e.target.value)}
              placeholder="e.g. 1234.56.78"
              className={`admin-input ${fieldErrors.hsCode ? 'admin-border-error admin-bg-error-subtle' : ''}`}
            />
            {fieldErrors.hsCode && (
              <p className="admin-error-text">{fieldErrors.hsCode}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="admin-label">{t('weight')} (kg)</label>
            <input
              type="number"
              id="weight"
              name="weight"
              step="0.001"
              min="0"
              value={formData.weight}
              onChange={e => handleChange('weight', e.target.value)}
              className={`admin-input ${fieldErrors.weight ? 'admin-border-error admin-bg-error-subtle' : ''}`}
            />
            {fieldErrors.weight && (
              <p className="admin-error-text">{fieldErrors.weight}</p>
            )}
          </div>

          <div>
            <label className="admin-label mb-2">{t('dimensions')} (cm)</label>
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
                  className={`admin-input ${fieldErrors['dimensions.length'] ? 'admin-border-error admin-bg-error-subtle' : ''}`}
                />
                {fieldErrors['dimensions.length'] && (
                  <p className="admin-error-text">
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
                  className={`admin-input ${fieldErrors['dimensions.width'] ? 'admin-border-error admin-bg-error-subtle' : ''}`}
                />
                {fieldErrors['dimensions.width'] && (
                  <p className="admin-error-text">
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
                  className={`admin-input ${fieldErrors['dimensions.height'] ? 'admin-border-error admin-bg-error-subtle' : ''}`}
                />
                {fieldErrors['dimensions.height'] && (
                  <p className="admin-error-text">
                    {fieldErrors['dimensions.height']}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="admin-label">{t('exportExplanation')}</label>
            <textarea
              id="exportExplanation"
              name="exportExplanation"
              value={formData.exportExplanation}
              onChange={e => handleChange('exportExplanation', e.target.value)}
              rows={2}
              className={`admin-input ${fieldErrors.exportExplanation ? 'admin-border-error admin-bg-error-subtle' : ''}`}
            />
            {fieldErrors.exportExplanation && (
              <p className="admin-error-text">
                {fieldErrors.exportExplanation}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
