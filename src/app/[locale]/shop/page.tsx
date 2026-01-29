import { getProducts } from '@/lib/services/products';
import { ProductProjection } from '@/lib/types/domain/product';
import { Language } from '@/generated/prisma';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { ProductCard } from '@/components/product/product-card';
import { cn } from '@/lib/utils/cn';
import { SUPPORTED_LOCALES } from '@/lib/config/site';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { ShopPagination } from '@/components/shop/shop-pagination';

interface ShopPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; category?: string }>;
}

export async function generateMetadata({
  params,
}: ShopPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'shop' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `/${locale}/shop`,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map(loc => [loc, `/${loc}/shop`])
      ),
    },
    openGraph: { title: t('title') },
  };
}

export default async function ShopPage({
  params,
  searchParams,
}: ShopPageProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  const { page = '1', category } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'shop' });

  const { products, pagination } = await getProducts(
    {
      status: 'ACTIVE',
      language: locale.toUpperCase() as Language,
      categorySlug: category,
    },
    {
      page: parseInt(page),
      limit: 12,
    }
  );

  return (
    <div className="vibe-layout-container vibe-section-py vibe-animate-fade-in">
      <div className="vibe-mb-12 vibe-section-divider-bottom vibe-pb-8">
        <h1 className="vibe-page-header vibe-text-foreground">{t('title')}</h1>
        <p className="vibe-text-muted vibe-mt-2 vibe-text-lg">
          {t('description')}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="vibe-info-box">
          <Search className="vibe-w-16 vibe-h-16 vibe-text-muted-soft vibe-mb-4" />
          <p className="vibe-text-price-xl vibe-text-muted vibe-text-medium">
            {t('noProducts')}
          </p>
        </div>
      ) : (
        <div className="vibe-grid-4-cols">
          {products.map((product: ProductProjection, idx: number) => (
            <div
              key={product.id}
              className="vibe-animate-slide-in-bottom"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <ProductCard product={product} locale={locale} />
            </div>
          ))}
        </div>
      )}

      <ShopPagination
        totalPages={pagination.totalPages}
        currentPage={pagination.page}
        locale={locale}
        categorySlug={category}
      />
    </div>
  );
}
