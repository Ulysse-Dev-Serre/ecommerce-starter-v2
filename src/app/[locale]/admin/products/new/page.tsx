'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, X, Plus, Trash2, Check } from 'lucide-react';
import Link from 'next/link';
import { i18n } from '@/lib/i18n/config';
import { SUPPORTED_LOCALES, SupportedLocale } from '@/lib/constants';

interface Translation {
  language: SupportedLocale;
  name: string;
  description: string;
  shortDescription: string;
}

interface SimpleVariant {
  id: string;
  nameEN: string;
  nameFR: string;
  priceCAD: string;
  priceUSD: string;
  stock: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const params = useParams();

  const locale = (params.locale as string) || i18n.defaultLocale;

  const [messages, setMessages] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  // Validation du slug en temps réel
  const [isSlugValid, setIsSlugValid] = useState(false);

  const [formData, setFormData] = useState({
    slug: '',
    status: 'DRAFT' as 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
    isFeatured: false,
    translations: SUPPORTED_LOCALES.map(loc => ({
      language: loc,
      name: '',
      description: '',
      shortDescription: '',
    })),
  });

  const [variants, setVariants] = useState<SimpleVariant[]>([]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const msgs = await import(
          `../../../../../lib/i18n/dictionaries/${locale}.json`
        );
        setMessages(msgs.default);
      } catch (error) {
        console.error('Failed to load translations:', error);
        const msgs = await import(
          `../../../../../lib/i18n/dictionaries/en.json`
        );
        setMessages(msgs.default);
      }
    };
    void loadMessages();
  }, [locale]);

  // Validation du slug en temps réel
  useEffect(() => {
    setIsSlugValid(validateSlug(formData.slug));
  }, [formData.slug]);

  const handleTranslationChange = (
    index: number,
    field: keyof Translation,
    value: string
  ) => {
    const newTranslations = [...formData.translations];
    newTranslations[index] = { ...newTranslations[index], [field]: value };
    setFormData({ ...formData, translations: newTranslations });
  };

  // Validation du slug selon les mêmes règles que le backend
  const validateSlug = (slug: string): boolean => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug) && slug.length > 0;
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleEnglishNameChange = (name: string) => {
    // On trouve l'index de 'en' dynamiquement
    const enIndex = formData.translations.findIndex(t => t.language === 'en');
    if (enIndex !== -1) {
      handleTranslationChange(enIndex, 'name', name);
    }

    if (!formData.slug) {
      const newSlug = generateSlug(name);
      setFormData(prev => ({
        ...prev,
        slug: newSlug,
        translations: prev.translations,
      }));
    }
  };

  const handleAddVariant = () => {
    const newVariant: SimpleVariant = {
      id: crypto.randomUUID(),
      nameEN: '',
      nameFR: '',
      priceCAD: '',
      priceUSD: '',
      stock: '0',
    };
    setVariants([...variants, newVariant]);
  };

  const handleVariantChange = (
    id: string,
    field: 'nameEN' | 'nameFR' | 'priceCAD' | 'priceUSD' | 'stock',
    value: string
  ) => {
    setVariants(
      variants.map(v => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const handleDeleteVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const handleNextStep = () => {
    if (!formData.slug) {
      setError(t.validation.slugRequired);
      return;
    }

    if (!isSlugValid) {
      setError(t.validation.slugInvalid);
      return;
    }

    // On valide que le nom anglais est présent (requis pour le SEO/Slug par défaut)
    const enTranslation = formData.translations.find(t => t.language === 'en');
    if (!enTranslation || !enTranslation.name) {
      setError(t.validation.nameRequired);
      return;
    }

    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (variants.length === 0) {
        throw new Error(t.validation.variantRequired);
      }

      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        if (!v.nameEN || !v.nameFR) {
          throw new Error(
            t.validation.variantNameRequired.replace(
              '{{index}}',
              (i + 1).toString()
            )
          );
        }
        const hasCAD = v.priceCAD && parseFloat(v.priceCAD) >= 0;
        const hasUSD = v.priceUSD && parseFloat(v.priceUSD) >= 0;
        if (!hasCAD && !hasUSD) {
          throw new Error(
            t.validation.variantPriceRequired.replace(
              '{{index}}',
              (i + 1).toString()
            )
          );
        }
      }

      // Step 1: Create product
      const productResponse = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const productData = await productResponse.json();

      if (!productResponse.ok) {
        throw new Error(productData.message || t.messages.errorCreatingProduct);
      }

      const productId = productData.product.id;

      // Step 2: Create simple variants
      const variantsPayload = {
        variants: variants.map(v => ({
          nameEN: v.nameEN,
          nameFR: v.nameFR,
          priceCAD: v.priceCAD ? parseFloat(v.priceCAD) : null,
          priceUSD: v.priceUSD ? parseFloat(v.priceUSD) : null,
          stock: parseInt(v.stock) || 0,
        })),
      };

      const variantsResponse = await fetch(
        `/api/admin/products/${productId}/variants/simple`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(variantsPayload),
        }
      );

      if (!variantsResponse.ok) {
        const variantsError = await variantsResponse.json();
        throw new Error(
          variantsError.message || t.messages.errorCreatingProduct
        );
      }

      router.push(`/${locale}/admin/products`);
    } catch (err) {
      setError(err instanceof Error ? err.message : tc.error);
    } finally {
      setLoading(false);
    }
  };

  if (!messages) {
    return (
      <div className="space-y-6">
        <div className="admin-card text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const t = messages.admin.products;
  const tc = messages.common;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/admin/products`}
            className="admin-btn-secondary p-2"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="admin-page-title">{t.newProduct}</h1>
            <p className="admin-page-subtitle">
              {step === 1 ? t.productInfo : t.variantsConfig}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            {step > 1 ? <Check className="h-4 w-4" /> : '1'}
          </div>
          <span className="text-sm font-medium text-gray-900">
            {t.productInfo}
          </span>
        </div>
        <div className="h-px flex-1 bg-gray-200" />
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            2
          </div>
          <span className="text-sm font-medium text-gray-600">
            {t.variants}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <X className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-900">{tc.error}</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <>
            <div className="admin-card">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                {t.basicInfo}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t.slug} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="product-url-slug"
                    className="admin-input"
                    required
                  />
                  {formData.slug && (
                    <p
                      className={`mt-1 text-xs ${isSlugValid ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {isSlugValid ? `✓ ${t.validSlug}` : `✗ ${t.invalidSlug}`}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">{t.slugHelp}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t.status}
                  </label>
                  <select
                    value={formData.status}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        status: e.target.value as typeof formData.status,
                      })
                    }
                    className="admin-input"
                  >
                    <option value="DRAFT">{t.draft}</option>
                    <option value="ACTIVE">{t.active}</option>
                    <option value="INACTIVE">{t.inactive}</option>
                    <option value="ARCHIVED">{t.archived}</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={e =>
                      setFormData({ ...formData, isFeatured: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <label
                    htmlFor="isFeatured"
                    className="text-sm font-medium text-gray-700"
                  >
                    {t.featured}
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {formData.translations.map((translation, index) => (
                <div key={translation.language} className="admin-card">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    {translation.language.toUpperCase()}
                    {translation.language === 'en' && (
                      <span className="ml-2 text-sm font-normal text-red-500">
                        *
                      </span>
                    )}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t.productName}
                        {translation.language === 'en' && (
                          <span className="text-red-500"> *</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={translation.name}
                        onChange={e =>
                          translation.language === 'en'
                            ? handleEnglishNameChange(e.target.value)
                            : handleTranslationChange(
                                index,
                                'name',
                                e.target.value
                              )
                        }
                        placeholder={t.productName}
                        className="admin-input"
                        required={translation.language === 'en'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t.shortDescription}
                      </label>
                      <input
                        type="text"
                        value={translation.shortDescription}
                        onChange={e =>
                          handleTranslationChange(
                            index,
                            'shortDescription',
                            e.target.value
                          )
                        }
                        placeholder={t.shortDescriptionPlaceholder}
                        className="admin-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t.fullDescription}
                      </label>
                      <textarea
                        value={translation.description}
                        onChange={e =>
                          handleTranslationChange(
                            index,
                            'description',
                            e.target.value
                          )
                        }
                        placeholder={t.fullDescriptionPlaceholder}
                        rows={4}
                        className="admin-input"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-4">
              <Link
                href={`/${locale}/admin/products`}
                className="admin-btn-secondary"
              >
                {tc.cancel}
              </Link>
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!isSlugValid}
                className="admin-btn-primary disabled:opacity-50"
              >
                {t.nextStep}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="admin-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t.variants} ({variants.length})
                </h2>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="admin-btn-primary bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  {tc.add} {t.variant}
                </button>
              </div>

              {variants.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                  <p className="text-sm text-gray-600">{t.noVariantsAdded}</p>
                  <p className="mt-2 text-xs text-red-600">
                    ⚠️ {t.validation.variantRequired}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {variants.map((variant, index) => (
                    <div
                      key={variant.id}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">
                          {t.variant} #{index + 1}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleDeleteVariant(variant.id)}
                          className="text-red-600 hover:text-red-900"
                          title={tc.delete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            {t.productName} (EN){' '}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={variant.nameEN}
                            onChange={e =>
                              handleVariantChange(
                                variant.id,
                                'nameEN',
                                e.target.value
                              )
                            }
                            placeholder="Green"
                            className="admin-input"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            {t.productName} (FR){' '}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={variant.nameFR}
                            onChange={e =>
                              handleVariantChange(
                                variant.id,
                                'nameFR',
                                e.target.value
                              )
                            }
                            placeholder="Vert"
                            className="admin-input"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            {t.price} ($ CAD)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={variant.priceCAD}
                            onChange={e =>
                              handleVariantChange(
                                variant.id,
                                'priceCAD',
                                e.target.value
                              )
                            }
                            placeholder="49.99"
                            className="admin-input"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            {t.price} ($ USD)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={variant.priceUSD}
                            onChange={e =>
                              handleVariantChange(
                                variant.id,
                                'priceUSD',
                                e.target.value
                              )
                            }
                            placeholder="36.99"
                            className="admin-input"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            {t.stock}
                          </label>
                          <input
                            type="number"
                            value={variant.stock}
                            onChange={e =>
                              handleVariantChange(
                                variant.id,
                                'stock',
                                e.target.value
                              )
                            }
                            placeholder="0"
                            className="admin-input"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-500">
                            💡{' '}
                            {t.validation.variantPriceRequired.replace(
                              '{{index}}',
                              ''
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="admin-btn-secondary"
              >
                {t.back}
              </button>

              <div className="flex items-center gap-4">
                <Link
                  href={`/${locale}/admin/products`}
                  className="admin-btn-secondary"
                >
                  {tc.cancel}
                </Link>
                <button
                  type="submit"
                  disabled={loading || variants.length === 0}
                  className="admin-btn-primary disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading
                    ? t.creating
                    : variants.length > 0
                      ? t.createProductWithVariants.replace(
                          '{{count}}',
                          variants.length.toString()
                        )
                      : t.createProduct}
                </button>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
