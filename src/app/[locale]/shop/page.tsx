interface ShopPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; category?: string }>;
}

export default async function ShopPage({
  params,
  searchParams,
}: ShopPageProps) {
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
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/products?${queryParams}`,
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
          const price = firstVariant?.pricing[0]?.price || '0';
          const image = firstVariant?.media[0]?.url || '/placeholder.png';

          return (
            <div
              key={product.id}
              className="border border-[var(--border)] rounded-lg p-4 hover:shadow-lg transition"
            >
              <img
                src={image}
                alt={translation?.name || product.slug}
                className="w-full h-48 object-cover rounded-md mb-3"
              />
              <h3 className="font-semibold text-lg mb-1">
                {translation?.name || product.slug}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-3">
                {translation?.shortDescription}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">{price} CAD</span>
                <button className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 py-2 rounded text-sm">
                  {locale === 'fr' ? 'Ajouter' : 'Add'}
                </button>
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
