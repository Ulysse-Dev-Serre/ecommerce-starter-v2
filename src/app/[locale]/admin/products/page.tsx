import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/core/db';
import { ProductsList } from '@/components/admin/products/products-list';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Utiliser Fetch API du backend interne pour garantir la cohérence des data si logique complexe,
  // OU appeler Prisma directement. Ici, la logique "getAll" est simple.
  // Cependant, le controlleur d'API fait quelques includes.
  // Pour être iso-fonctionnel :

  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      translations: true,
      variants: {
        where: { deletedAt: null },
        include: {
          pricing: true,
          inventory: true,
          attributeValues: {
            include: {
              attributeValue: {
                include: {
                  translations: true,
                },
              },
            },
          },
        },
      },
      media: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });

  // Serialization to avoid "Decimal objects are not supported" error and match LocalProduct interface
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
    variants: product.variants.map(variant => ({
      id: variant.id,
      sku: variant.sku,
      pricing: variant.pricing.map(p => ({
        price: Number(p.price),
        currency: p.currency,
        priceType: p.priceType,
      })),
      inventory: variant.inventory
        ? {
            stock: variant.inventory.stock,
          }
        : null,
    })),
    media: product.media.map(m => ({
      url: m.url,
      isPrimary: m.isPrimary,
    })),
  }));

  return <ProductsList initialProducts={serializedProducts} locale={locale} />;
}
