'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ProductActions } from '@/components/cart/product-actions';
import { PriceDisplay } from '@/components/price-display';
import { VariantButton } from '@/components/ui/variant-button';
import { trackEvent } from '@/lib/client/analytics';

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
  productId: string;
  productName: string;
  initialPrice?: string;
  initialCurrency?: string;
}

export function ProductClient({
  variants,
  locale,
  productId,
  productName,
  initialPrice,
  initialCurrency,
}: ProductClientProps) {
  useEffect(() => {
    void trackEvent(
      'view_item',
      {
        productId,
        productName,
        price: initialPrice,
        currency: initialCurrency,
      },
      productName
    );
  }, [productId, productName, initialPrice, initialCurrency]);

  const [selectedVariantId, setSelectedVariantId] = useState(
    variants[0]?.id || ''
  );
  const t = useTranslations('product');
  const tCommon = useTranslations('shop'); // For "viewOptions" etc

  const selectedVariant = variants.find(v => v.id === selectedVariantId);

  if (!selectedVariant) {
    return <div className="text-error">{t('outOfStock')}</div>;
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
        className="text-2xl font-bold text-foreground text-primary"
        locale={locale}
      />

      {/* Sélecteur par attributs (si attributs définis) */}
      {hasAttributes &&
        Object.entries(attributeGroups).map(([attributeName, values]) => (
          <div key={attributeName}>
            <label className="block vibe-text-xs-bold vibe-mb-2">
              {attributeName}
            </label>
            <div className="vibe-flex-wrap-gap-2">
              {Array.from(values).map(value => (
                <VariantButton
                  key={value}
                  label={value}
                  isSelected={selectedAttributes[attributeName] === value}
                  isAvailable={
                    (variants.find(v =>
                      v.attributes.some(
                        a => a.name === attributeName && a.value === value
                      )
                    )?.stock ?? 0) > 0
                  }
                  onClick={() => handleAttributeChange(attributeName, value)}
                />
              ))}
            </div>
          </div>
        ))}

      {/* Sélecteur par SKU (si pas d'attributs mais plusieurs variantes) */}
      {!hasAttributes && variants.length > 1 && (
        <div>
          <label className="block vibe-text-xs-bold vibe-mb-2">
            {t('variant')}
          </label>
          <div className="vibe-flex-wrap-gap-2">
            {variants.map(variant => (
              <VariantButton
                key={variant.id}
                label={variant.sku}
                isSelected={variant.id === selectedVariantId}
                isAvailable={variant.stock > 0}
                onClick={() => setSelectedVariantId(variant.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="vibe-text-xs text-muted-foreground">
        {selectedVariant.stock > 0 ? (
          <span className="text-success">
            {t('inStock', { stock: selectedVariant.stock })}
          </span>
        ) : (
          <span className="text-error">{t('outOfStock')}</span>
        )}
      </div>

      <ProductActions
        variantId={selectedVariant.id}
        productName={productName}
        locale={locale}
        disabled={!selectedVariant.id || selectedVariant.stock <= 0}
        maxQuantity={selectedVariant.stock}
        showQuantitySelector={true}
      />
    </div>
  );
}
