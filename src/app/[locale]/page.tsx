import { ArrowRight } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/config/site';
import { VIBE_ANIMATION_SLIDE_IN_BOTTOM } from '@/lib/config/vibe-styles';
import { getProducts } from '@/lib/services/products';

import { Language, ProductStatus } from '@/generated/prisma';

import { ProductCard } from '@/components/product/product-card';

// Disable static generation for this page (requires DB)
export const dynamic = 'force-dynamic';

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: HomeProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ...Object.fromEntries(SUPPORTED_LOCALES.map(loc => [loc, `/${loc}`])),
        'x-default': `/${DEFAULT_LOCALE}`,
      },
    },
  };
}

export default async function Home({
  params,
}: HomeProps): Promise<React.ReactElement> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

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
      <section className="bg-gradient-to-r from-muted/50 to-background border-b border-border vibe-section-py">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
            {t('heroTitle')}
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>
        </div>
      </section>

      <section className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end vibe-mb-12">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                {t('featuredProducts')}
              </h2>
              <div className="h-1.5 w-20 bg-primary mt-3 rounded-full" />
            </div>
            <Link
              href={`/${locale}/shop`}
              className="text-primary font-bold hover:underline underline-offset-4 inline-flex items-center"
            >
              {t('viewAll')}{' '}
              <ArrowRight className="inline-block h-5 w-5 ml-1" />
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="vibe-info-box">
              <p className="text-2xl font-bold text-foreground text-muted-foreground">
                {t('noFeaturedProducts')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className={VIBE_ANIMATION_SLIDE_IN_BOTTOM}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <ProductCard product={product} locale={locale} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
