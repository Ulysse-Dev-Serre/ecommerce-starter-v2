import { notFound } from 'next/navigation';

import { Language, ProductStatus } from '@/generated/prisma';
import { ImageGallery } from '@/components/product/image-gallery';
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
          attributeValues: {
            include: {
              attributeValue: {
                include: {
                  attribute: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!product || product.status !== ProductStatus.ACTIVE) {
    notFound();
  }

  const translation = product.translations[0];

  const images = product.media.map(m => ({
    url: m.url,
    alt: m.alt,
    isPrimary: m.isPrimary,
  }));

  const variants = product.variants.map(v => ({
    id: v.id,
    sku: v.sku,
    price: v.pricing[0]?.price.toString() || '0',
    currency: v.pricing[0]?.currency || 'CAD',
    stock: v.inventory?.stock || 0,
    attributes: v.attributeValues.map(av => ({
      name: av.attributeValue.attribute.name,
      value: av.attributeValue.value,
    })),
  }));

  return (
    <div className="flex-1 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ImageGallery
            images={images}
            productName={translation?.name || product.slug}
            locale={locale}
          />

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {translation?.name || product.slug}
              </h1>
            </div>

            {translation?.description && (
              <div className="prose max-w-none">
                <p className="text-gray-700">{translation.description}</p>
              </div>
            )}

            <ProductClient variants={variants} locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}
