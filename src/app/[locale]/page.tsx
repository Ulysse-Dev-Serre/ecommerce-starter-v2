import Link from 'next/link';

import { Language, ProductStatus } from '@/generated/prisma';
import { AddToCartButton } from '@/components/cart/add-to-cart-button';
import { getProducts } from '@/lib/services/product.service';

// Disable static generation for this page (requires DB)
export const dynamic = 'force-dynamic';

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export default async function Home({
  params,
}: HomeProps): Promise<React.ReactElement> {
  const { locale } = await params;

  const language = locale.toUpperCase() as Language;

  const { products: featuredProducts } = await getProducts(
    {
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      language,
    },
    {
      page: 1,
      limit: 8,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }
  );

  return (
    <div className="flex-1">
      <section className="bg-gradient-to-r from-gray-100 to-gray-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold">Hero</h1>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">
            {locale === 'fr' ? 'Produits en vedette' : 'Featured Products'}
          </h2>

          {featuredProducts.length === 0 ? (
            <p className="text-center text-gray-500">
              {locale === 'fr'
                ? 'Aucun produit en vedette pour le moment.'
                : 'No featured products at the moment.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map(product => {
                const translation = product.translations.find(
                  t => t.language === language
                );
                const primaryImage = product.media?.find(m => m.isPrimary);
                const firstVariant = product.variants?.[0];
                const price = firstVariant?.pricing?.[0];

                return (
                  <div
                    key={product.id}
                    className="group border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <Link href={`/${locale}/product/${product.slug}`}>
                      <div className="aspect-square bg-gray-200 relative overflow-hidden">
                        {primaryImage ? (
                          <img
                            src={primaryImage.url}
                            alt={primaryImage.alt || translation?.name || ''}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            {locale === 'fr' ? "Pas d'image" : 'No image'}
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link href={`/${locale}/product/${product.slug}`}>
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                          {translation?.name || product.slug}
                        </h3>
                      </Link>
                      {translation?.shortDescription && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {translation.shortDescription}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        {price && (
                          <span className="text-lg font-bold">
                            {price.price.toString()} {price.currency}
                          </span>
                        )}
                        {firstVariant && (
                          <AddToCartButton
                            variantId={firstVariant.id}
                            locale={locale}
                            disabled={!firstVariant.id}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
