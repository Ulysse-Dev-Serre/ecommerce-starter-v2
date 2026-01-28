import { getProducts } from '@/lib/services/product.service';
import { Language } from '@/generated/prisma';
import { getTranslations } from 'next-intl/server';
import { ProductCard } from './product-card';

interface RelatedProductsProps {
  currentProductId: string;
  locale: string;
}

export async function RelatedProducts({
  currentProductId,
  locale,
}: RelatedProductsProps) {
  const t = await getTranslations({ locale, namespace: 'products' });

  // Fetch some active products
  const { products } = await getProducts(
    {
      status: 'ACTIVE',
      language: locale.toUpperCase() as Language,
    },
    {
      limit: 5, // Fetch 5 to be sure to have 4 if one is the current product
    }
  );

  // Filter out the current product and take only first 4
  const filteredProducts = products
    .filter(p => p.id !== currentProductId)
    .slice(0, 4);

  if (filteredProducts.length === 0) {
    return null;
  }

  return (
    <div className="vibe-related-section">
      <h2 className="vibe-section-title border-none pb-0">
        {t('relatedProducts')}
      </h2>
      <div className="vibe-grid-4-cols">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} locale={locale} />
        ))}
      </div>
    </div>
  );
}
