import { Search } from 'lucide-react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SUPPORTED_LOCALES } from '@/lib/config/site';
import { getProducts } from '@/lib/services/products';
import { ProductProjection } from '@/lib/types/domain/product';

import { Language } from '@/generated/prisma';

import { ProductCard } from '@/components/product/product-card';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 duration-500">
      <div className="vibe-mb-12 border-b border-border pb-4 pb-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-2 vibe-text-lg">
          {t('description')}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="vibe-info-box">
          <Search className="vibe-w-16 vibe-h-16 text-muted-foreground/30 mb-4" />
          <p className="text-2xl font-bold text-foreground text-muted-foreground font-medium">
            {t('noProducts')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
