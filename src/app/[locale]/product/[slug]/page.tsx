import { VIBE_TYPOGRAPHY_PROSE } from '@/lib/vibe-styles';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SITE_CURRENCY, SUPPORTED_LOCALES } from '@/lib/config/site';
import { Language, ProductStatus } from '@/generated/prisma';
import { env } from '@/lib/core/env';

import { ImageGallery } from '@/components/product/image-gallery';
import { JsonLd } from '@/components/seo/json-ld';
import { getProductBySlug, getProductViewModel } from '@/lib/services/products';
import { ProductClient } from './product-client';
import { RelatedProducts } from '@/components/product/related-products';
import { siteConfig } from '@/lib/config/site';

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
    <div className="vibe-flex-1 vibe-section-py vibe-animate-fade-in">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <div className="vibe-layout-container">
        <div className="vibe-grid-2-cols-wide">
          <ImageGallery
            images={images}
            productName={translation?.name || product.slug}
            locale={locale}
          />

          <div className="vibe-stack-y-8">
            <div>
              <h1 className="vibe-page-header vibe-text-left">
                {translation?.name || product.slug}
              </h1>
            </div>

            {translation?.shortDescription && (
              <p className="vibe-description">{translation.shortDescription}</p>
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
              <div className="vibe-pt-8 vibe-section-divider-top">
                <h3 className="vibe-section-title vibe-text-left vibe-border-none vibe-pb-0">
                  {tProduct('title')}
                </h3>
                <div className={`${VIBE_TYPOGRAPHY_PROSE} vibe-text-muted`}>
                  <p className="vibe-whitespace-pre-line vibe-leading-relaxed">
                    {translation.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="vibe-mt-20">
          <RelatedProducts currentProductId={product.id} locale={locale} />
        </div>
      </div>
    </div>
  );
}
