import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { Language, ProductStatus } from '@/generated/prisma';
import { ImageGallery } from '@/components/product/image-gallery';
import { JsonLd } from '@/components/seo/json-ld';
import { prisma } from '@/lib/db/prisma';

import { ProductClient } from './product-client';

// Disable static generation (requires DB)
export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const language = locale.toUpperCase() as Language;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      translations: { where: { language } },
      media: { orderBy: { sortOrder: 'asc' }, take: 1 },
    },
  });

  if (!product) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: 'products' });
  const translation = product.translations[0];
  const title = translation?.name || product.slug;
  const description = translation?.description
    ? translation.description.substring(0, 160)
    : t('fallbackDescription', { title });

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/product/${slug}`,
      languages: {
        fr: `/fr/product/${slug}`,
        en: `/en/product/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      images: product.media[0] ? [product.media[0].url] : [],
    },
  };
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
          },
          inventory: true,
          attributeValues: {
            include: {
              attributeValue: {
                include: {
                  attribute: {
                    include: {
                      translations: {
                        where: { language },
                      },
                    },
                  },
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
    pricing: v.pricing.map(p => ({
      price: p.price.toString(),
      currency: p.currency,
    })),
    stock: v.inventory?.stock || 0,
    attributes: v.attributeValues.map(av => ({
      name:
        av.attributeValue.attribute.translations[0]?.name ||
        av.attributeValue.attribute.key,
      value: av.attributeValue.value,
    })),
  }));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const productUrl = `${siteUrl}/${locale}/product/${product.slug}`;
  const imageUrl = images[0]?.url || '';

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: translation?.name || product.slug,
    description:
      translation?.description || translation?.shortDescription || '',
    image: imageUrl,
    sku: product.variants[0]?.sku || '',
    offers: {
      '@type': 'Offer',
      price: variants[0]?.pricing[0]?.price || '0',
      priceCurrency: variants[0]?.pricing[0]?.currency || 'CAD',
      availability:
        (variants[0]?.stock || 0) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: productUrl,
    },
    brand: {
      '@type': 'Organization',
      name: 'AgTechNest',
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'fr' ? 'Accueil' : 'Home',
        item: `${siteUrl}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: locale === 'fr' ? 'Boutique' : 'Shop',
        item: `${siteUrl}/${locale}/shop`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: translation?.name || product.slug,
        item: productUrl,
      },
    ],
  };

  return (
    <div className="flex-1 py-8">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
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

            <ProductClient
              variants={variants}
              locale={locale}
              productId={product.id}
              productName={translation?.name || product.slug}
              initialPrice={variants[0]?.pricing[0]?.price}
              initialCurrency={variants[0]?.pricing[0]?.currency}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
