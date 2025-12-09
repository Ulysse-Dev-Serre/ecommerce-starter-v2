import Link from 'next/link';

import { Language, ProductStatus } from '@/generated/prisma';
import { getProducts } from '@/lib/services/product.service';
import fr from '@/lib/i18n/dictionaries/fr.json';
import en from '@/lib/i18n/dictionaries/en.json';
import { FeaturedProductsCarousel } from '@/components/FeaturedProductsCarousel';
import Hero from '@/components/Hero';

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
      <Hero messages={messages} />

      {/* Decorative divider with subtle gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>

      <section
        id="featured-products"
        className="py-16 bg-gradient-to-b from-neutral-50/50 to-white"
      >
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
            <FeaturedProductsCarousel
              products={featuredProducts}
              locale={locale}
              messages={messages}
            />
          )}
        </div>
      </section>
    </div>
  );
}
