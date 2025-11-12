import { AddToCartButton } from '@/components/cart/add-to-cart-button';

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {locale === 'fr' ? 'Boutique' : 'Shop'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product: any) => {
          const translation = product.translations[0];
          const firstVariant = product.variants[0];
          const price = firstVariant?.pricing[0]?.price ?? '0';
          const primaryImage = product.media?.find((m: any) => m.isPrimary);
          const variantImage = firstVariant?.media?.[0];
          const image = primaryImage?.url || variantImage?.url;

          return (
            <div
              key={product.id}
              className="border border-[var(--border)] rounded-lg p-4 hover:shadow-lg transition"
            >
              <div className="w-full h-48 bg-gray-200 rounded-md mb-3 overflow-hidden">
                {image ? (
                  <img
                    src={image}
                    alt={primaryImage?.alt || translation?.name || product.slug}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    {locale === 'fr' ? "Pas d'image" : 'No image'}
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-lg mb-1">
                {translation?.name ?? product.slug}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-3">
                {translation?.shortDescription}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">{price} CAD</span>
                <AddToCartButton
                  variantId={firstVariant?.id}
                  locale={locale}
                  disabled={!firstVariant?.id}
                />
              </div>
            </div>
          );
        })}
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
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] hover:bg-[var(--border)]'
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
