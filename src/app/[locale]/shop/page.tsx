import Link from 'next/link';

import { PriceDisplay } from '@/components/price-display';
import { ProductCard } from '@/components/ProductCard';
import { prismaToJson } from '@/lib/utils/prisma-to-json';

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

  const queryParams = new URLSearchParams({
    page,
    limit: '12',
    status: 'ACTIVE',
    language: locale.toUpperCase(),
    ...(category && { category }),
  });

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/api/products?${queryParams}`,
    { next: { revalidate: 60 } }
  );

  const { data: products, pagination } = await response.json();

  // Convertir les objets Prisma pour les composants client
  const transformedProducts = prismaToJson(products);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {locale === 'fr' ? 'Boutique' : 'Shop'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {transformedProducts.map((product: any) => (
          <ProductCard key={product.id} product={product} locale={locale} />
        ))}
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
