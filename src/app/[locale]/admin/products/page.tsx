import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/core/db';
import { ProductsList } from '@/components/admin/products/products-list';

export const dynamic = 'force-dynamic';

import { getAllProducts } from '@/lib/services/products';

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  const { status } = await searchParams;

  const products = await getAllProducts({
    status,
    language: locale.toUpperCase(),
  });

  // Serialization to match LocalProduct interface
  const serializedProducts = products.map(product => ({
    id: product.id,
    slug: product.slug,
    status: product.status,
    isFeatured: product.isFeatured,
    sortOrder: product.sortOrder,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    translations: product.translations.map(t => ({
      language: t.language,
      name: t.name,
      shortDescription: t.shortDescription,
    })),
    variants:
      (product as any).variants?.map((variant: any) => ({
        id: variant.id,
        sku: variant.sku,
        pricing:
          variant.pricing?.map((p: any) => ({
            price: Number(p.price),
            currency: p.currency,
            priceType: p.priceType,
          })) || [],
        inventory: variant.inventory
          ? {
              stock: variant.inventory.stock,
            }
          : null,
      })) || [],
    media:
      (product as any).media?.map((m: any) => ({
        url: m.url,
        isPrimary: m.isPrimary,
      })) || [],
  }));

  return <ProductsList initialProducts={serializedProducts} locale={locale} />;
}
