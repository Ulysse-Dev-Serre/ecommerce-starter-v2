import Link from 'next/link';
import Image from 'next/image';
import { PriceDisplay } from '@/components/price-display';
import { ProductActions } from '@/components/cart/product-actions';
import { getTranslations } from 'next-intl/server';
import { Package } from 'lucide-react';

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
    <div className="vibe-card group flex flex-col h-full hover:shadow-md">
      <Link
        href={`/${locale}/product/${product.slug}`}
        className="block mb-4 overflow-hidden rounded-lg bg-muted aspect-square relative"
      >
        {image ? (
          <Image
            src={image}
            alt={primaryImage?.alt || translation?.name || product.slug}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Package className="w-12 h-12" />
          </div>
        )}
      </Link>

      <div className="flex flex-col flex-1">
        <Link
          href={`/${locale}/product/${product.slug}`}
          className="block mb-1"
        >
          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {translation?.name ?? product.slug}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
          {translation?.shortDescription}
        </p>

        <div className="mt-auto pt-4 border-t border-border/50">
          <div className="mb-4">
            <PriceDisplay
              pricing={pricing}
              className="text-xl font-black text-foreground"
              locale={locale}
            />
          </div>
          {product.variants.length > 1 ? (
            <Link
              href={`/${locale}/product/${product.slug}`}
              className="w-full inline-flex items-center justify-center bg-muted text-foreground py-3 px-4 rounded-xl font-bold hover:bg-border transition-colors text-sm"
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
