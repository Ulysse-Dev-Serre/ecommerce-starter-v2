import { getProducts } from '@/lib/services/product.service';
import { Language } from '@/generated/prisma';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { ProductCard } from '@/components/product/product-card';

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
    alternates: {
      canonical: `/${locale}/shop`,
      languages: {
        fr: '/fr/shop',
        en: '/en/shop',
      },
    },
    openGraph: {
      title: t('title'),
    },
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-muted/50 rounded-lg">
          <p className="text-xl text-muted-foreground">
            {t('noProducts') || 'No products found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-12 flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            p => (
              <a
                key={p}
                href={`/${locale}/shop?page=${p}${category ? `&category=${category}` : ''}`}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  p === pagination.page
                    ? 'bg-primary text-white'
                    : 'bg-muted hover:bg-border text-foreground'
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
