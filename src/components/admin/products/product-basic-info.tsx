'use client';

import { CheckCircle, X } from 'lucide-react';
import { SUPPORTED_LOCALES } from '@/lib/constants';

interface ProductBasicInfoProps {
  formData: {
    slug: string;
    status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
    isFeatured: boolean;
  };
  setFormData: (fn: (prev: any) => any) => void;
  translations: Record<
    string,
    {
      name: string;
      description: string;
      shortDescription: string;
    }
  >;
  setTranslations: (fn: (prev: any) => any) => void;
  isSlugValid: boolean;
  t: (key: string) => string;
  tc: (key: string) => string;
}

export function ProductBasicInfo({
  formData,
  setFormData,
  translations,
  setTranslations,
  isSlugValid,
  t,
}: ProductBasicInfoProps) {
  const handleTranslationChange = (
    lang: string,
    field: string,
    value: string
  ) => {
    setTranslations(prev => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="admin-card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t('basicInfo')}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('slug')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={e =>
                setFormData(prev => ({ ...prev, slug: e.target.value }))
              }
              placeholder="product-url-slug"
              className="admin-input"
              required
            />
            {formData.slug && (
              <p
                className={`mt-1 text-xs ${isSlugValid ? 'text-green-600' : 'text-red-600'}`}
              >
                {isSlugValid ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> {t('validSlug')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <X className="h-3 w-3" /> {t('invalidSlug')}
                  </span>
                )}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">{t('slugHelp')}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('status')}
              </label>
              <select
                value={formData.status}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    status: e.target.value as
                      | 'DRAFT'
                      | 'ACTIVE'
                      | 'INACTIVE'
                      | 'ARCHIVED',
                  }))
                }
                className="admin-input"
              >
                <option value="DRAFT">{t('draft')}</option>
                <option value="ACTIVE">{t('active')}</option>
                <option value="INACTIVE">{t('inactive')}</option>
                <option value="ARCHIVED">{t('archived')}</option>
              </select>
            </div>

            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      isFeatured: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t('featured')}
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {SUPPORTED_LOCALES.map(lang => (
          <div key={lang} className="admin-card">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {lang.toUpperCase()}
              {lang === 'en' && (
                <span className="ml-2 text-sm font-normal text-red-500">*</span>
              )}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('productName')}
                  {lang === 'en' && <span className="text-red-500"> *</span>}
                </label>
                <input
                  type="text"
                  value={translations[lang]?.name || ''}
                  onChange={e =>
                    handleTranslationChange(lang, 'name', e.target.value)
                  }
                  placeholder={t('productName')}
                  className="admin-input"
                  required={lang === 'en'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('shortDescription')}
                </label>
                <input
                  type="text"
                  value={translations[lang]?.shortDescription || ''}
                  onChange={e =>
                    handleTranslationChange(
                      lang,
                      'shortDescription',
                      e.target.value
                    )
                  }
                  placeholder={t('shortDescriptionPlaceholder')}
                  className="admin-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('fullDescription')}
                </label>
                <textarea
                  value={translations[lang]?.description || ''}
                  onChange={e =>
                    handleTranslationChange(lang, 'description', e.target.value)
                  }
                  placeholder={t('fullDescriptionPlaceholder')}
                  rows={4}
                  className="admin-input"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
