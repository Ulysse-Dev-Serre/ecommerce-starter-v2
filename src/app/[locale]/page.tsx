import { VIBE_ANIMATION_SLIDE_IN_BOTTOM } from '@/lib/vibe-styles';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';

import { Language, ProductStatus } from '@/generated/prisma';
import { getProducts } from '@/lib/services/product.service';
import { ProductCard } from '@/components/product/product-card';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/config/site';

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
  const tShop = await getTranslations({ locale, namespace: 'shop' });

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
    <div className="vibe-flex-1">
      <section className="vibe-hero-section">
        <div className="vibe-layout-container vibe-text-center">
          <h1 className="vibe-hero-title">{t('heroTitle')}</h1>
          <p className="vibe-hero-subtitle">{t('heroSubtitle')}</p>
        </div>
      </section>

      <section className="vibe-section-py">
        <div className="vibe-layout-container">
          <div className="vibe-flex-between-items-end vibe-mb-12">
            <div>
              <h2 className="vibe-h2">{t('featuredProducts')}</h2>
              <div className="vibe-divider" />
            </div>
            <Link href={`/${locale}/shop`} className="vibe-link-action">
              {t('viewAll')}{' '}
              <ArrowRight className="vibe-inline-block vibe-icon-sm vibe-ml-1" />
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="vibe-info-box">
              <p className="vibe-text-price-xl vibe-text-muted">
                {t('noFeaturedProducts')}
              </p>
            </div>
          ) : (
            <div className="vibe-grid-4-cols">
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
