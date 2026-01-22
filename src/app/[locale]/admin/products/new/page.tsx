'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, X, Plus, Trash2, Check } from 'lucide-react';
import Link from 'next/link';
import { i18n } from '@/lib/i18n/config';

interface Translation {
  language: 'EN' | 'FR';
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
    translations: [
      {
        language: 'EN' as const,
        name: '',
        description: '',
        shortDescription: '',
      },
      {
        language: 'FR' as const,
        name: '',
        description: '',
        shortDescription: '',
      },
    ],
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
    handleTranslationChange(0, 'name', name);
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
      setError('Product slug is required');
      return;
    }

    if (!isSlugValid) {
      setError(
        'Le slug doit être valide pour continuer (minuscules, chiffres et tirets uniquement)'
      );
      return;
    }

    const enTranslation = formData.translations[0];
    if (!enTranslation.name) {
      setError('English product name is required');
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
        throw new Error('Au moins 1 variante est requise');
      }

      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        if (!v.nameEN || !v.nameFR) {
          throw new Error(`Variante ${i + 1}: nom EN et FR requis`);
        }
        const hasCAD = v.priceCAD && parseFloat(v.priceCAD) >= 0;
        const hasUSD = v.priceUSD && parseFloat(v.priceUSD) >= 0;
        if (!hasCAD && !hasUSD) {
          throw new Error(
            `Variante ${i + 1}: au moins un prix (CAD ou USD) est requis`
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
        throw new Error(productData.message || 'Failed to create product');
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
        throw new Error(variantsError.message || 'Failed to create variants');
      }

      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!messages) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
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
            href="/admin/products"
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.newProduct}</h1>
            <p className="mt-2 text-sm text-gray-600">
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
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
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
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    required
                  />
                  {formData.slug && (
                    <p
                      className={`mt-1 text-xs ${isSlugValid ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {isSlugValid ? '✓ Slug valide' : '✗ Slug invalide'}
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
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
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
                <div
                  key={translation.language}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    {translation.language === 'EN'
                      ? `🇬🇧 ${t.english}`
                      : `🇫🇷 ${t.french}`}
                    {translation.language === 'EN' && (
                      <span className="ml-2 text-sm font-normal text-red-500">
                        *
                      </span>
                    )}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t.productName}
                        {translation.language === 'EN' && (
                          <span className="text-red-500"> *</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={translation.name}
                        onChange={e =>
                          translation.language === 'EN'
                            ? handleEnglishNameChange(e.target.value)
                            : handleTranslationChange(
                                index,
                                'name',
                                e.target.value
                              )
                        }
                        placeholder={t.productName}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        required={translation.language === 'EN'}
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
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
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
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-4">
              <Link
                href="/admin/products"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {tc.cancel}
              </Link>
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!isSlugValid}
                className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.nextStep}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t.variants} ({variants.length})
                </h2>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  {tc.add} {t.variant}
                </button>
              </div>

              {variants.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                  <p className="text-sm text-gray-600">
                    Aucune variante ajoutée. Cliquez sur &quot;{tc.add}{' '}
                    {t.variant}&quot; pour commencer.
                  </p>
                  <p className="mt-2 text-xs text-red-600">
                    ⚠️ Au moins 1 variante est requise
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
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
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
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
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
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
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
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
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
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-500">
                            💡 Au moins un prix (CAD ou USD) est requis
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
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t.back}
              </button>

              <div className="flex items-center gap-4">
                <Link
                  href="/admin/products"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {tc.cancel}
                </Link>
                <button
                  type="submit"
                  disabled={loading || variants.length === 0}
                  className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
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
