'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Translation {
  id: string;
  language: 'EN' | 'FR';
  name: string;
  description: string | null;
  shortDescription: string | null;
}

interface Variant {
  id: string;
  sku: string;
  pricing: {
    id: string;
    price: string;
    currency: string;
  }[];
  inventory: {
    id: string;
    stock: number;
  } | null;
  attributeValues: {
    attributeValue: {
      translations: { language: string; displayName: string }[];
    };
  }[];
}

interface Product {
  id: string;
  slug: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  isFeatured: boolean;
  sortOrder: number;
  translations: Translation[];
}

interface NewVariant {
  id: string;
  nameEN: string;
  nameFR: string;
  price: string;
  stock: string;
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const router = useRouter();
  const [productId, setProductId] = useState<string | null>(null);
  const [locale, setLocale] = useState('en');
  const [messages, setMessages] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [newVariants, setNewVariants] = useState<NewVariant[]>([]);

  const [formData, setFormData] = useState({
    slug: '',
    status: 'DRAFT' as 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
    isFeatured: false,
    sortOrder: 0,
  });

  const [enTranslation, setEnTranslation] = useState({
    name: '',
    description: '',
    shortDescription: '',
  });

  const [frTranslation, setFrTranslation] = useState({
    name: '',
    description: '',
    shortDescription: '',
  });

  useEffect(() => {
    params.then(p => {
      setProductId(p.id);
      setLocale(p.locale || 'en');
      loadProduct(p.id);
      loadVariants(p.id);
    });
  }, [params]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const msgs = await import(
          `../../../../../../lib/i18n/dictionaries/${locale}.json`
        );
        setMessages(msgs.default);
      } catch (error) {
        console.error('Failed to load translations:', error);
        const msgs = await import(`../../../../../../lib/i18n/dictionaries/en.json`);
        setMessages(msgs.default);
      }
    };
    loadMessages();
  }, [locale]);

  const loadProduct = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/products/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load product');
      }

      const data = await response.json();
      const productData = data.data;
      setProduct(productData);

      setFormData({
        slug: productData.slug,
        status: productData.status,
        isFeatured: productData.isFeatured,
        sortOrder: productData.sortOrder,
      });

      const enTrans = productData.translations.find((t: Translation) => t.language === 'EN');
      const frTrans = productData.translations.find((t: Translation) => t.language === 'FR');

      if (enTrans) {
        setEnTranslation({
          name: enTrans.name || '',
          description: enTrans.description || '',
          shortDescription: enTrans.shortDescription || '',
        });
      }

      if (frTrans) {
        setFrTranslation({
          name: frTrans.name || '',
          description: frTrans.description || '',
          shortDescription: frTrans.shortDescription || '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const loadVariants = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}/variants`);
      if (!response.ok) {
        console.error('Failed to load variants');
        return;
      }

      const data = await response.json();
      setVariants(data.data || []);
    } catch (err) {
      console.error('Failed to load variants:', err);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update product');
      }

      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateVariant = async (
    variantId: string,
    updates: { price?: string; stock?: number }
  ) => {
    if (!productId) return;

    try {
      const payload: any = {};

      if (updates.price !== undefined) {
        payload.pricing = {
          price: parseFloat(updates.price),
          currency: 'CAD',
        };
      }

      if (updates.stock !== undefined) {
        payload.inventory = {
          stock: updates.stock,
        };
      }

      const response = await fetch(
        `/api/admin/products/${productId}/variants/${variantId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update variant');
      }

      await loadVariants(productId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update variant');
    }
  };

  const handleDeleteVariant = async (variantId: string, variantName: string) => {
    if (!productId) return;
    if (!messages) return;

    const t = messages.admin.products;
    if (
      !confirm(
        t.deleteVariantConfirm.replace('{{sku}}', variantName)
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/variants/${variantId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete variant');
      }

      await loadVariants(productId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete variant');
    }
  };

  const handleAddNewVariant = () => {
    const newVariant: NewVariant = {
      id: crypto.randomUUID(),
      nameEN: '',
      nameFR: '',
      price: '49.99',
      stock: '0',
    };
    setNewVariants([...newVariants, newVariant]);
  };

  const handleNewVariantChange = (
    id: string,
    field: 'nameEN' | 'nameFR' | 'price' | 'stock',
    value: string
  ) => {
    setNewVariants(newVariants.map(v => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const handleDeleteNewVariant = (id: string) => {
    setNewVariants(newVariants.filter(v => v.id !== id));
  };

  const handleSaveNewVariants = async () => {
    if (!productId || newVariants.length === 0) return;

    try {
      const variantsPayload = {
        variants: newVariants.map(v => ({
          nameEN: v.nameEN,
          nameFR: v.nameFR,
          price: parseFloat(v.price),
          stock: parseInt(v.stock) || 0,
          currency: 'CAD',
        })),
      };

      const response = await fetch(`/api/admin/products/${productId}/variants/simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(variantsPayload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create variants');
      }

      setNewVariants([]);
      await loadVariants(productId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create variants');
    }
  };

  const getVariantName = (variant: Variant): string => {
    if (variant.attributeValues.length === 0) return variant.sku;
    const translation = variant.attributeValues[0].attributeValue.translations.find(
      t => t.language === locale.toUpperCase()
    );
    return (
      translation?.displayName ||
      variant.attributeValues[0].attributeValue.translations[0]?.displayName ||
      variant.sku
    );
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.editProduct}</h1>
            <p className="mt-2 text-sm text-gray-600">{tc.loading}</p>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-gray-500">{tc.loading}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.editProduct}</h1>
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-12 text-center shadow-sm">
          <p className="text-red-600">Product not found</p>
          <Link
            href="/admin/products"
            className="mt-4 inline-block text-sm text-red-700 hover:text-red-900"
          >
            {t.back}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.editProduct}</h1>
            <p className="mt-2 text-sm text-gray-600">{enTranslation.name || 'Product details'}</p>
          </div>
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

      <form onSubmit={handleUpdateProduct} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t.basicInfo}</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t.slug} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">{t.status}</label>
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
                onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">
                {t.featured}
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">{t.sortOrder}</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={e =>
                  setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              🇬🇧 {t.english}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t.productName}
                </label>
                <input
                  type="text"
                  value={enTranslation.name}
                  disabled
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                />
                <p className="mt-1 text-xs text-gray-500">{t.editingTranslationsComingSoon}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              🇫🇷 {t.french}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t.productName}
                </label>
                <input
                  type="text"
                  value={frTranslation.name}
                  disabled
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                />
                <p className="mt-1 text-xs text-gray-500">{t.editingTranslationsComingSoon}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/products"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {tc.cancel}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? t.saving : tc.save}
          </button>
        </div>
      </form>

      {/* Variantes existantes */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t.variants} ({variants.length})
        </h2>

        {variants.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t.variant}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t.sku}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t.price}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t.stock}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {variants.map(variant => (
                  <tr key={variant.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {getVariantName(variant)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {variant.sku}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={variant.pricing[0]?.price || '0.00'}
                          onBlur={e =>
                            handleUpdateVariant(variant.id, { price: e.target.value })
                          }
                          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        />
                        <span className="text-sm text-gray-600">CAD</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <input
                        type="number"
                        defaultValue={variant.inventory?.stock || 0}
                        onBlur={e =>
                          handleUpdateVariant(variant.id, {
                            stock: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(variant.id, getVariantName(variant))}
                        className="text-red-600 hover:text-red-900"
                        title={tc.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Nouvelles variantes à ajouter */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {tc.add} {t.variants}
          </h2>
          <button
            type="button"
            onClick={handleAddNewVariant}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            {tc.add} {t.variant}
          </button>
        </div>

        {newVariants.length > 0 && (
          <>
            <div className="space-y-4">
              {newVariants.map((variant, index) => (
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
                      onClick={() => handleDeleteNewVariant(variant.id)}
                      className="text-red-600 hover:text-red-900"
                      title={tc.delete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t.productName} (EN) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={variant.nameEN}
                        onChange={e =>
                          handleNewVariantChange(variant.id, 'nameEN', e.target.value)
                        }
                        placeholder="Green"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t.productName} (FR) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={variant.nameFR}
                        onChange={e =>
                          handleNewVariantChange(variant.id, 'nameFR', e.target.value)
                        }
                        placeholder="Vert"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t.price} (CAD) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.price}
                        onChange={e =>
                          handleNewVariantChange(variant.id, 'price', e.target.value)
                        }
                        placeholder="49.99"
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
                          handleNewVariantChange(variant.id, 'stock', e.target.value)
                        }
                        placeholder="0"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveNewVariants}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Save className="h-4 w-4" />
              {tc.save} {newVariants.length} {t.variant}
              {newVariants.length > 1 ? 's' : ''}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
