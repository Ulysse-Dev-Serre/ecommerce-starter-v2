import Link from 'next/link';

import { Language, ProductStatus } from '@/generated/prisma';
import { ProductActions } from '@/components/cart/product-actions';
import { PriceDisplay } from '@/components/price-display';
import { getProducts } from '@/lib/services/product.service';
import fr from '@/lib/i18n/dictionaries/fr.json';
import en from '@/lib/i18n/dictionaries/en.json';

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
  const messages = locale === 'fr' ? fr : en;

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
      <section className="bg-gradient-to-r from-muted to-accent bamboo-texture -mt-4 relative">
        <img
          src="/hero22.png"
          alt="Hero Image"
          className="w-full h-[28rem] object-cover opacity-80"
        />
        <div className="absolute inset-0 flex items-start justify-start pt-8 pl-8">
          <h1 className="text-6xl font-bold drop-shadow-2xl animate-pulse">
            <span className="text-amber-900 drop-shadow-lg">Manor</span>
            <span className="text-green-800 drop-shadow-lg">Leaf</span>
          </h1>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-left">
            {messages.common.bestsellers}
          </h2>

          {featuredProducts.length === 0 ? (
            <p className="text-center text-muted-foreground">
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
                const pricing = firstVariant?.pricing ?? [];

                return (
                  <div
                    key={product.id}
                    className="group border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <Link href={`/${locale}/product/${product.slug}`}>
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        {primaryImage ? (
                          <img
                            src={primaryImage.url}
                            alt={primaryImage.alt || translation?.name || ''}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
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
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {translation.shortDescription}
                        </p>
                      )}
                      <div className="mb-3">
                        {pricing.length > 0 && (
                          <PriceDisplay
                            pricing={pricing.map(p => ({
                              price: p.price.toString(),
                              currency: p.currency,
                            }))}
                            className="text-lg font-bold"
                            locale={locale}
                          />
                        )}
                      </div>
                      {firstVariant &&
                        (product.variants.length > 1 ? (
                          <Link
                            href={`/${locale}/product/${product.slug}`}
                            className="w-full inline-block text-center bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            {locale === 'fr'
                              ? 'Voir les options'
                              : 'View options'}
                          </Link>
                        ) : (
                          <ProductActions
                            variantId={firstVariant.id}
                            locale={locale}
                            disabled={!firstVariant.id}
                            compact={true}
                            showQuantitySelector={true}
                            maxQuantity={firstVariant.inventory?.stock || 99}
                          />
                        ))}
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
