import { notFound } from 'next/navigation';

import { Language, ProductStatus } from '@/generated/prisma';
import { prisma } from '@/lib/db/prisma';

import { ProductClient } from './product-client';

// Disable static generation (requires DB)
export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function ProductPage({
  params,
}: ProductPageProps): Promise<React.ReactElement> {
  const { locale, slug } = await params;
  const language = locale.toUpperCase() as Language;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      translations: {
        where: { language },
      },
      media: {
        orderBy: { sortOrder: 'asc' },
      },
      variants: {
        where: { deletedAt: null },
        include: {
          pricing: {
            where: { isActive: true, priceType: 'base' },
            orderBy: { validFrom: 'desc' },
            take: 1,
          },
          inventory: true,
        },
      },
    },
  });

  if (!product || product.status !== ProductStatus.ACTIVE) {
    notFound();
  }

  const translation = product.translations[0];
  const primaryImage = product.media.find(m => m.isPrimary);
  const defaultVariant = product.variants[0];
  const defaultPrice = defaultVariant?.pricing[0];

  return (
    <div className="flex-1 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
            {primaryImage ? (
              <img
                src={primaryImage.url}
                alt={primaryImage.alt || translation?.name || ''}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                {locale === 'fr' ? "Pas d'image" : 'No image'}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {translation?.name || product.slug}
              </h1>
              {defaultPrice && (
                <p className="text-2xl font-semibold text-primary">
                  {defaultPrice.price.toString()} {defaultPrice.currency}
                </p>
              )}
            </div>

            {translation?.description && (
              <div className="prose max-w-none">
                <p className="text-gray-700">{translation.description}</p>
              </div>
            )}

            {defaultVariant?.inventory && (
              <div className="text-sm text-gray-600">
                {defaultVariant.inventory.stock > 0 ? (
                  <span className="text-green-600">
                    {locale === 'fr'
                      ? `En stock (${defaultVariant.inventory.stock} disponibles)`
                      : `In stock (${defaultVariant.inventory.stock} available)`}
                  </span>
                ) : (
                  <span className="text-red-600">
                    {locale === 'fr' ? 'Rupture de stock' : 'Out of stock'}
                  </span>
                )}
              </div>
            )}

            <ProductClient
              variantId={defaultVariant?.id || ''}
              locale={locale}
              disabled={
                !defaultVariant?.id ||
                !defaultVariant?.inventory ||
                defaultVariant.inventory.stock <= 0
              }
              stock={defaultVariant?.inventory?.stock || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
