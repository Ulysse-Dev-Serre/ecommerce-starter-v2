import { getProducts } from '@/lib/services/product.service';
import { Language } from '@/generated/prisma';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { ProductCard } from '@/components/product/product-card';
import { cn } from '@/lib/utils/cn';
import { SUPPORTED_LOCALES } from '@/lib/constants';
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
    <div className="vibe-layout-container vibe-section-py animate-in fade-in duration-700">
      <div className="mb-12 border-b border-border pb-8">
        <h1 className="vibe-page-header text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{t('description')}</p>
      </div>

      {products.length === 0 ? (
        <div className="vibe-info-box">
          <Search className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <p className="text-xl text-muted-foreground font-medium">
            {t('noProducts')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product: any, idx: number) => (
            <div
              key={product.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
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
