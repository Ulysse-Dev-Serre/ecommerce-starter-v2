import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SITE_CURRENCY, SUPPORTED_LOCALES } from '@/lib/constants';
import { Language, ProductStatus } from '@/generated/prisma';
import { env } from '@/lib/env';

import { ImageGallery } from '@/components/product/image-gallery';
import { JsonLd } from '@/components/seo/json-ld';
import { getProductBySlug } from '@/lib/services/product.service';
import { ProductClient } from './product-client';
import { RelatedProducts } from '@/components/product/related-products';

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(
    slug,
    locale.toUpperCase() as Language
  );

  if (!product) return {};

  const translation = product.translations[0];
  const title = translation?.name || product.slug;
  const description =
    translation?.description || translation?.shortDescription || '';

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/product/${slug}`,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map(loc => [loc, `/${loc}/product/${slug}`])
      ),
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
  const product = await getProductBySlug(
    slug,
    locale.toUpperCase() as Language
  );

  if (!product || product.status !== 'ACTIVE') {
    return notFound();
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
      price: p.price,
      currency: p.currency,
    })),
    stock: v.inventory?.stock || 0,
    attributes: v.attributeValues.map(av => ({
      name:
        av.attributeValue?.translations[0]?.displayName ||
        av.attributeValue?.attribute.key ||
        '',
      value: av.attributeValue?.value || '',
    })),
  }));

  const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const productUrl = `${siteUrl}/${locale}/product/${product.slug}`;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: translation?.name || product.slug,
    description:
      translation?.description || translation?.shortDescription || '',
    image: images[0]?.url || '',
    sku: variants[0]?.sku || '',
    offers: {
      '@type': 'Offer',
      price: variants[0]?.pricing[0]?.price || '0',
      priceCurrency: variants[0]?.pricing[0]?.currency || SITE_CURRENCY,
      availability:
        (variants[0]?.stock || 0) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: productUrl,
    },
    brand: { '@type': 'Organization', name: 'AgTechNest' },
  };

  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const tShop = await getTranslations({ locale, namespace: 'shop' });

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: tCommon('home'),
        item: `${siteUrl}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: tShop('title'),
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
    <div className="flex-1 vibe-section-py animate-in fade-in duration-700">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <div className="vibe-layout-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <ImageGallery
            images={images}
            productName={translation?.name || product.slug}
            locale={locale}
          />

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
                {translation?.name || product.slug}
              </h1>
            </div>

            {translation?.shortDescription && (
              <p className="text-xl text-muted-foreground leading-relaxed">
                {translation.shortDescription}
              </p>
            )}

            <ProductClient
              variants={variants}
              locale={locale}
              productId={product.id}
              productName={translation?.name || product.slug}
              initialPrice={variants[0]?.pricing[0]?.price}
              initialCurrency={variants[0]?.pricing[0]?.currency}
            />

            {translation?.description && (
              <div className="pt-8 border-t border-border">
                <h3 className="text-lg font-bold mb-4">
                  {tShop('description') || 'Description'}
                </h3>
                <div className="prose prose-stone dark:prose-invert max-w-none text-muted-foreground">
                  <p className="whitespace-pre-line leading-relaxed">
                    {translation.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-20">
          <RelatedProducts currentProductId={product.id} locale={locale} />
        </div>
      </div>
    </div>
  );
}
