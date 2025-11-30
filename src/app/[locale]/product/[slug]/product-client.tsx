'use client';

import { useState } from 'react';

import { ProductActions } from '@/components/cart/product-actions';
import { PriceDisplay } from '@/components/price-display';

interface Variant {
  id: string;
  sku: string;
  pricing: Array<{ price: string; currency: string }>;
  stock: number;
  attributes: Array<{
    name: string;
    value: string;
  }>;
}

interface ProductClientProps {
  variants: Variant[];
  locale: string;
}

export function ProductClient({ variants, locale }: ProductClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    variants[0]?.id || ''
  );

  const selectedVariant = variants.find(v => v.id === selectedVariantId);

  if (!selectedVariant) {
    return (
      <div className="text-red-600">
        {locale === 'fr'
          ? 'Aucune variante disponible'
          : 'No variant available'}
      </div>
    );
  }

  const attributeGroups = variants.reduce(
    (acc, variant) => {
      variant.attributes.forEach(attr => {
        if (!acc[attr.name]) {
          acc[attr.name] = new Set();
        }
        acc[attr.name].add(attr.value);
      });
      return acc;
    },
    {} as Record<string, Set<string>>
  );

  const selectedAttributes = selectedVariant.attributes.reduce(
    (acc, attr) => {
      acc[attr.name] = attr.value;
      return acc;
    },
    {} as Record<string, string>
  );

  const handleAttributeChange = (attributeName: string, value: string) => {
    const newSelectedAttributes = {
      ...selectedAttributes,
      [attributeName]: value,
    };

    const matchingVariant = variants.find(variant =>
      variant.attributes.every(
        attr => newSelectedAttributes[attr.name] === attr.value
      )
    );

    if (matchingVariant) {
      setSelectedVariantId(matchingVariant.id);
    }
  };

  const hasAttributes = Object.keys(attributeGroups).length > 0;

  return (
    <div className="space-y-6">
      <PriceDisplay
        pricing={selectedVariant.pricing}
        className="text-2xl font-semibold text-primary"
        locale={locale}
      />

      {/* Sélecteur par attributs (si attributs définis) */}
      {hasAttributes &&
        Object.entries(attributeGroups).map(([attributeName, values]) => (
          <div key={attributeName}>
            <label className="block text-sm font-medium mb-2">
              {attributeName}
            </label>
            <div className="flex flex-wrap gap-2">
              {Array.from(values).map(value => {
                const isSelected = selectedAttributes[attributeName] === value;

                const variantWithThisValue = variants.find(v =>
                  v.attributes.some(
                    a => a.name === attributeName && a.value === value
                  )
                );
                const isAvailable = variantWithThisValue
                  ? variantWithThisValue.stock > 0
                  : false;

                return (
                  <button
                    key={value}
                    onClick={() => handleAttributeChange(attributeName, value)}
                    disabled={false}
                    className={`px-4 py-2 rounded-md border-2 transition cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary text-white'
                        : isAvailable
                          ? 'border-gray-300 hover:border-gray-400'
                          : 'border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

      {/* Sélecteur par SKU (si pas d'attributs mais plusieurs variantes) */}
      {!hasAttributes && variants.length > 1 && (
        <div>
          <label className="block text-sm font-medium mb-2">
            {locale === 'fr' ? 'Variante' : 'Variant'}
          </label>
          <div className="flex flex-wrap gap-2">
            {variants.map(variant => {
              const isSelected = variant.id === selectedVariantId;
              const isAvailable = variant.stock > 0;

              return (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                  disabled={!isAvailable}
                  className={`px-4 py-2 rounded-md border-2 transition cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary text-white'
                      : isAvailable
                        ? 'border-gray-300 hover:border-gray-400'
                        : 'border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {variant.sku}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600">
        {selectedVariant.stock > 0 ? (
          <span className="text-green-600">
            {locale === 'fr'
              ? `En stock (${selectedVariant.stock} disponibles)`
              : `In stock (${selectedVariant.stock} available)`}
          </span>
        ) : (
          <span className="text-red-600">
            {locale === 'fr' ? 'Rupture de stock' : 'Out of stock'}
          </span>
        )}
      </div>

      <ProductActions
        variantId={selectedVariant.id}
        locale={locale}
        disabled={!selectedVariant.id || selectedVariant.stock <= 0}
        maxQuantity={selectedVariant.stock}
        showQuantitySelector={true}
      />
    </div>
  );
}
