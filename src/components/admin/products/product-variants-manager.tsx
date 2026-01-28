'use client';

import { Plus, Trash2, Save } from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '@/lib/config/site';
import { Variant, NewVariant } from './product-form';

interface ProductVariantsManagerProps {
  variants: Variant[];
  newVariants: NewVariant[];
  setNewVariants: (data: NewVariant[]) => void;
  productId?: string;
  onUpdateVariant: (id: string, updates: any) => Promise<void>;
  onDeleteVariant: (id: string, name: string) => Promise<void>;
  onSaveNewVariants: () => Promise<void>;
  locale: string;
  t: (key: string) => string;
  tc: (key: string) => string;
}

export function ProductVariantsManager({
  variants,
  newVariants,
  setNewVariants,
  productId,
  onUpdateVariant,
  onDeleteVariant,
  onSaveNewVariants,
  locale,
  t,
  tc,
}: ProductVariantsManagerProps) {
  const getVariantName = (variant: Variant): string => {
    if (!variant.attributeValues || variant.attributeValues.length === 0)
      return variant.sku;
    const translation =
      variant.attributeValues[0].attributeValue.translations.find(
        (tr: any) => tr.language === locale.toUpperCase()
      );
    return (
      translation?.displayName ||
      variant.attributeValues[0].attributeValue.translations[0]?.displayName ||
      variant.sku
    );
  };

  const handleAddNewVariant = () => {
    const initialPrices: Record<string, string> = {};
    SUPPORTED_CURRENCIES.forEach((curr: string) => {
      initialPrices[curr] = '';
    });

    const newVariant: NewVariant = {
      id: crypto.randomUUID(),
      nameEN: '',
      nameFR: '',
      prices: initialPrices,
      stock: '0',
      weight: '',
      length: '',
      width: '',
      height: '',
    };
    setNewVariants([...newVariants, newVariant]);
  };

  const handleNewVariantChange = (
    id: string,
    field: string,
    value: string,
    currency?: string
  ) => {
    setNewVariants(
      newVariants.map(v => {
        if (v.id !== id) return v;
        if (field === 'price' && currency) {
          return {
            ...v,
            prices: { ...v.prices, [currency]: value },
          };
        }
        return { ...v, [field as keyof NewVariant]: value } as NewVariant;
      })
    );
  };

  const handleDeleteNewVariant = (id: string) => {
    setNewVariants(newVariants.filter(v => v.id !== id));
  };

  if (!productId) return null;

  return (
    <div className="space-y-6">
      <div className="admin-card p-0 overflow-hidden">
        <h2 className="p-6 pb-2 admin-section-title">
          {t('variants')} ({variants.length})
        </h2>

        {variants.length > 0 && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead className="admin-table-thead">
                <tr>
                  <th className="admin-table-th">{t('variant')}</th>
                  <th className="admin-table-th">{t('sku')}</th>
                  {SUPPORTED_CURRENCIES.map(curr => (
                    <th key={curr} className="admin-table-th">
                      {t('price')} {curr}
                    </th>
                  ))}
                  <th className="admin-table-th">{t('stock')}</th>
                  <th className="admin-table-th text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {variants.map(variant => (
                  <tr key={variant.id} className="admin-table-tr">
                    <td className="admin-table-td font-medium">
                      {getVariantName(variant)}
                    </td>
                    <td className="admin-table-td admin-text-subtle">
                      {variant.sku}
                    </td>
                    {SUPPORTED_CURRENCIES.map((curr: string) => (
                      <td key={curr} className="admin-table-td">
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={
                            variant.pricing.find(
                              (p: any) => p.currency === curr
                            )?.price || ''
                          }
                          onBlur={e =>
                            e.target.value &&
                            onUpdateVariant(variant.id, {
                              prices: { [curr]: parseFloat(e.target.value) },
                            })
                          }
                          className="w-24 admin-input py-1"
                        />
                      </td>
                    ))}
                    <td className="admin-table-td">
                      <input
                        type="number"
                        defaultValue={variant.inventory?.stock || 0}
                        onBlur={e =>
                          onUpdateVariant(variant.id, {
                            stock: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-20 admin-input py-1"
                      />
                    </td>
                    <td className="admin-table-td text-right">
                      <button
                        type="button"
                        onClick={() =>
                          onDeleteVariant(variant.id, getVariantName(variant))
                        }
                        className="text-red-600 hover:text-red-900"
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

      <div className="admin-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="admin-section-title">
            {tc('add')} {t('variants')}
          </h2>
          <button
            type="button"
            onClick={handleAddNewVariant}
            className="admin-btn-primary"
          >
            <Plus className="h-4 w-4" /> {tc('add')} {t('variant')}
          </button>
        </div>

        {newVariants.length > 0 && (
          <div className="space-y-4">
            {newVariants.map((variant, index) => (
              <div
                key={variant.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">
                    {t('variant')} #{index + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleDeleteNewVariant(variant.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('productName')} (EN) *
                    </label>
                    <input
                      type="text"
                      value={variant.nameEN}
                      onChange={e =>
                        handleNewVariantChange(
                          variant.id,
                          'nameEN',
                          e.target.value
                        )
                      }
                      className="admin-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('productName')} (FR) *
                    </label>
                    <input
                      type="text"
                      value={variant.nameFR}
                      onChange={e =>
                        handleNewVariantChange(
                          variant.id,
                          'nameFR',
                          e.target.value
                        )
                      }
                      className="admin-input"
                    />
                  </div>
                  {SUPPORTED_CURRENCIES.map((curr: string) => (
                    <div key={curr}>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('price')} ({curr})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.prices[curr] || ''}
                        onChange={e =>
                          handleNewVariantChange(
                            variant.id,
                            'price',
                            e.target.value,
                            curr
                          )
                        }
                        className="admin-input"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('stock')}
                    </label>
                    <input
                      type="number"
                      value={variant.stock}
                      onChange={e =>
                        handleNewVariantChange(
                          variant.id,
                          'stock',
                          e.target.value
                        )
                      }
                      className="admin-input"
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-4">
              <button
                type="button"
                onClick={onSaveNewVariants}
                className="admin-btn-primary"
              >
                <Save className="h-4 w-4" /> {tc('save')} {newVariants.length}{' '}
                {t('variant')}
                {newVariants.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
