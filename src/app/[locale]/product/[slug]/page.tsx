import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import {
  SITE_CURRENCY,
  SUPPORTED_LOCALES,
  siteConfig,
} from '@/lib/config/site';
import { VIBE_TYPOGRAPHY_PROSE } from '@/lib/config/vibe-styles';
import { env } from '@/lib/core/env';
import { getProductBySlug, getProductViewModel } from '@/lib/services/products';

import { Language } from '@/generated/prisma';

import { ImageGallery } from '@/components/product/image-gallery';
import { RelatedProducts } from '@/components/product/related-products';
import { JsonLd } from '@/components/seo/json-ld';

import { ProductClient } from './product-client';

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

  const { images, variants } = getProductViewModel(product);
  const translation = product.translations[0];

  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
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
    brand: { '@type': 'Organization', name: siteConfig.name },
  };

  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const tProduct = await getTranslations({ locale, namespace: 'product' });
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
    <div className="flex-1 py-8 lg:py-12 duration-500">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <ImageGallery
            images={images}
            productName={translation?.name || product.slug}
            locale={locale}
          />

          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-8 text-left">
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
              <div className="vibe-pt-8 border-t border-border pt-4 mt-4">
                <h3 className="text-xl font-bold mb-6 text-foreground border-b border-border pb-4 text-left vibe-border-none vibe-pb-0">
                  {tProduct('title')}
                </h3>
                <div
                  className={`${VIBE_TYPOGRAPHY_PROSE} text-muted-foreground`}
                >
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
