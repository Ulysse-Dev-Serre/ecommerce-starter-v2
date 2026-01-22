import Link from 'next/link';
import { PriceDisplay } from '@/components/price-display';
import { ProductActions } from '@/components/cart/product-actions';
import { getTranslations } from 'next-intl/server';

interface ProductCardProps {
  product: any;
  locale: string;
}

export async function ProductCard({ product, locale }: ProductCardProps) {
  const t = await getTranslations({ locale, namespace: 'shop' });
  const translation = product.translations[0];
  const firstVariant = product.variants[0];
  const pricing = firstVariant?.pricing ?? [];
  const primaryImage = product.media?.find((m: any) => m.isPrimary);
  const variantImage = firstVariant?.media?.[0];
  const image = primaryImage?.url || variantImage?.url;

  return (
    <div className="group border border-border rounded-lg p-4 hover:shadow-lg transition flex flex-col h-full bg-card">
      <Link href={`/${locale}/product/${product.slug}`} className="block mb-3">
        <div className="w-full h-48 bg-muted rounded-md overflow-hidden relative">
          {image ? (
            <img
              src={image}
              alt={primaryImage?.alt || translation?.name || product.slug}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {t('noImage')}
            </div>
          )}
        </div>
      </Link>
      <Link href={`/${locale}/product/${product.slug}`} className="block mb-1">
        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
          {translation?.name ?? product.slug}
        </h3>
      </Link>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2 min-h-[2.5rem]">
        {translation?.shortDescription}
      </p>
      <div className="mt-auto">
        <div className="mb-4">
          <PriceDisplay
            pricing={pricing}
            className="text-xl font-bold"
            locale={locale}
          />
        </div>
        {product.variants.length > 1 ? (
          <Link
            href={`/${locale}/product/${product.slug}`}
            className="w-full inline-block text-center bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary-hover transition-colors font-medium"
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
  );
}
