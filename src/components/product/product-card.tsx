import { VIBE_HOVER_GROUP } from '@/lib/vibe-styles';
import Link from 'next/link';
import Image from 'next/image';
import { PriceDisplay } from '@/components/price-display';
import { ProductActions } from '@/components/cart/product-actions';
import { getTranslations } from 'next-intl/server';
import { Package } from 'lucide-react';

import { ProductProjection } from '@/lib/services/product.service';

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
    <div
      className={`vibe-card ${VIBE_HOVER_GROUP} vibe-flex-col-h-full vibe-hover-shadow-md`}
    >
      <Link
        href={`/${locale}/product/${product.slug}`}
        className="vibe-image-container-abs"
      >
        {image ? (
          <Image
            src={image}
            alt={primaryImage?.alt || translation?.name || product.slug}
            fill
            className="vibe-object-cover group-hover:vibe-scale-110 vibe-transition-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="vibe-full vibe-flex-center vibe-text-muted">
            <Package className="vibe-w-12 vibe-h-12" />
          </div>
        )}
      </Link>

      <div className="vibe-flex-col-flex-1">
        <Link
          href={`/${locale}/product/${product.slug}`}
          className="vibe-block vibe-mb-1"
        >
          <h3 className="vibe-text-bold vibe-text-lg vibe-text-foreground group-hover:vibe-text-primary vibe-transition vibe-line-clamp-1">
            {translation?.name ?? product.slug}
          </h3>
        </Link>
        <p className="vibe-text-xs vibe-text-muted vibe-mb-4 vibe-line-clamp-2 vibe-min-h-12">
          {translation?.shortDescription}
        </p>

        <div className="vibe-mt-auto vibe-pt-4 vibe-section-divider-top">
          <div className="vibe-mb-4">
            <PriceDisplay
              pricing={pricing}
              className="vibe-text-xl vibe-text-bold-foreground"
              locale={locale}
            />
          </div>
          {product.variants.length > 1 ? (
            <Link
              href={`/${locale}/product/${product.slug}`}
              className="vibe-button-secondary vibe-w-full vibe-py-3 vibe-px-4 vibe-text-xs"
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
    </div>
  );
}
