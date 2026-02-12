import { VIBE_HOVER_GROUP } from '@/lib/config/vibe-styles';
import Link from 'next/link';
import Image from 'next/image';
import { PriceDisplay } from '@/components/price-display';
import { ProductActions } from '@/components/cart/product-actions';
import { getTranslations } from 'next-intl/server';
import { Package } from 'lucide-react';
import { Card } from '@/components/ui/card';

import { ProductProjection } from '@/lib/types/domain/product';

interface ProductCardProps {
  product: ProductProjection;
  locale: string;
}

export async function ProductCard({ product, locale }: ProductCardProps) {
  const t = await getTranslations({ locale, namespace: 'shop' });
  const translation = product.translations[0];
  const firstVariant = product.variants[0];
  const pricing = firstVariant?.pricing ?? [];
  const primaryImage = product.media?.find(m => m.isPrimary);
  const variantImage = firstVariant?.media?.[0];
  const image = primaryImage?.url || variantImage?.url;

  return (
    <Card
      className={`${VIBE_HOVER_GROUP} flex flex-col h-full hover:shadow-md`}
      data-testid="product-card"
      data-product-slug={product.slug}
    >
      <Link
        href={`/${locale}/product/${product.slug}`}
        className="relative mb-4 overflow-hidden rounded-lg bg-muted aspect-square"
      >
        {image ? (
          <Image
            src={image}
            alt={
              primaryImage?.alt ||
              translation?.name ||
              product.slug ||
              t('productImage')
            }
            fill
            className="vibe-object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="vibe-full vibe-flex-center text-muted-foreground">
            <Package className="vibe-w-12 vibe-h-12" />
          </div>
        )}
      </Link>

      <div className="vibe-flex-col-flex-1">
        <Link
          href={`/${locale}/product/${product.slug}`}
          className="block vibe-mb-1"
        >
          <h3
            className="font-bold vibe-text-lg text-foreground group-hover:text-primary transition-all duration-300 line-clamp-1"
            data-testid="product-name"
          >
            {translation?.name ?? product.slug}
          </h3>
        </Link>
        <p className="vibe-text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[3rem]">
          {translation?.shortDescription}
        </p>

        <div className="vibe-mt-auto vibe-pt-4 border-t border-border pt-4 mt-4">
          <div className="mb-4">
            <PriceDisplay
              pricing={pricing}
              className="vibe-text-xl font-bold text-foreground"
              locale={locale}
              dataTestId="product-price"
            />
          </div>
          {product.variants.length > 1 ? (
            <Link
              href={`/${locale}/product/${product.slug}`}
              className="vibe-button-secondary vibe-w-full vibe-py-3 px-4 vibe-text-xs"
            >
              {t('viewOptions')}
            </Link>
          ) : (
            <ProductActions
              variantId={firstVariant?.id}
              locale={locale}
              disabled={!firstVariant?.id}
              compact={true}
              showQuantitySelector={false}
              maxQuantity={firstVariant?.inventory?.stock || 99}
              productName={translation?.name || product.slug}
            />
          )}
        </div>
      </div>
    </Card>
  );
}
