import Link from 'next/link';

import { ProductActions } from '@/components/cart/product-actions';
import { PriceDisplay } from '@/components/price-display';
import { getProducts } from '@/lib/services/product.service';
import { Language } from '@/generated/prisma';

interface ShopPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; category?: string }>;
}

export default async function ShopPage({
  params,
  searchParams,
}: ShopPageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const { page = '1', category } = await searchParams;

  const { products, pagination } = await getProducts(
    {
      status: 'ACTIVE', // ProductStatus.ACTIVE (using string literal for simplicity or import enum)
      language: locale.toUpperCase() as Language,
      categorySlug: category,
    },
    {
      page: parseInt(page),
      limit: 12,
    }
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {locale === 'fr' ? 'Boutique' : 'Shop'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product: any) => {
          const translation = product.translations[0];
          const firstVariant = product.variants[0];
          const pricing = firstVariant?.pricing ?? [];
          const primaryImage = product.media?.find((m: any) => m.isPrimary);
          const variantImage = firstVariant?.media?.[0];
          const image = primaryImage?.url || variantImage?.url;

          return (
            <div
              key={product.id}
              className="group border border-border rounded-lg p-4 hover:shadow-lg transition"
            >
              <Link href={`/${locale}/product/${product.slug}`}>
                <div className="w-full h-48 bg-gray-200 rounded-md mb-3 overflow-hidden">
                  {image ? (
                    <img
                      src={image}
                      alt={
                        primaryImage?.alt || translation?.name || product.slug
                      }
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      {locale === 'fr' ? "Pas d'image" : 'No image'}
                    </div>
                  )}
                </div>
              </Link>
              <Link href={`/${locale}/product/${product.slug}`}>
                <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                  {translation?.name ?? product.slug}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground mb-3">
                {translation?.shortDescription}
              </p>
              <div className="mb-3">
                <PriceDisplay
                  pricing={pricing}
                  className="text-xl font-bold"
                  locale={locale}
                />
              </div>
              {product.variants.length > 1 ? (
                <Link
                  href={`/${locale}/product/${product.slug}`}
                  className="w-full inline-block text-center bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {locale === 'fr' ? 'Voir les options' : 'View options'}
                </Link>
              ) : (
                <ProductActions
                  variantId={firstVariant?.id}
                  locale={locale}
                  disabled={!firstVariant?.id}
                  compact={true}
                  showQuantitySelector={true}
                  maxQuantity={firstVariant?.inventory?.stock || 99}
                />
              )}
            </div>
          );
        })}
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            p => (
              <a
                key={p}
                href={`/shop?page=${p}${category ? `&category=${category}` : ''}`}
                className={`px-4 py-2 rounded ${
                  p === pagination.page
                    ? 'bg-primary text-white'
                    : 'bg-muted hover:bg-border'
                }`}
              >
                {p}
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}
