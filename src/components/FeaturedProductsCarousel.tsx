'use client';

import Link from 'next/link';
import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback } from 'react';

import { PriceDisplay } from '@/components/price-display';

interface Product {
  id: string;
  slug: string;
  translations: Array<{
    language: string;
    name: string;
    shortDescription?: string;
  }>;
  media?: Array<{
    id: string;
    url: string;
    alt?: string;
    isPrimary: boolean;
  }>;
  variants: Array<{
    pricing: Array<{
      price: number;
      currency: string;
    }>;
  }>;
}

interface CarouselProductCardProps {
  product: Product;
  locale: string;
}

function CarouselProductCard({ product, locale }: CarouselProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const translation = product.translations.find(
    t => t.language === locale.toUpperCase()
  );
  const firstVariant = product.variants?.[0];
  const pricing = firstVariant?.pricing ?? [];
  const allImages = product.media || [];

  // Trouver l'index de l'image principale ou utiliser la première
  const primaryImageIndex = allImages.findIndex(img => img.isPrimary) || 0;
  const currentImage =
    allImages[currentImageIndex] || allImages[primaryImageIndex];

  return (
    <div className="flex-shrink-0 w-[420px] group">
      <div className="overflow-hidden hover:shadow-lg transition-shadow">
        <Link href={`/${locale}/product/${product.slug}`}>
          <div className="w-[420px] h-[360px] bg-muted relative overflow-hidden rounded-xl">
            {currentImage ? (
              <img
                src={currentImage.url}
                alt={currentImage.alt || translation?.name || ''}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                {locale === 'fr' ? "Pas d'image" : 'No image'}
              </div>
            )}
          </div>
        </Link>
        <div className="p-4 w-[420px]">
          <Link href={`/${locale}/product/${product.slug}`}>
            <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {translation?.name || product.slug}
            </h3>
          </Link>
          {translation?.shortDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {translation.shortDescription}
            </p>
          )}
          <div className="mb-3">
            {pricing.length > 0 && (
              <PriceDisplay
                pricing={pricing.map(p => ({
                  price: p.price.toString(),
                  currency: p.currency,
                }))}
                className="text-lg font-normal [&>span]:font-light"
                locale="en"
              />
            )}
          </div>

          {/* Miniatures circulaires sous le prix, alignées à gauche */}
          {allImages.length > 1 && (
            <div className="flex gap-2 mt-3">
              {allImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={e => {
                    e.preventDefault();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-6 h-6 rounded-full border-2 overflow-hidden transition-all ${
                    index === currentImageIndex
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  title={`Image ${index + 1}`}
                >
                  <img
                    src={image.url}
                    alt={`Miniature ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface FeaturedProductsCarouselProps {
  products: Product[];
  locale: string;
  messages: any;
}

export function FeaturedProductsCarousel({
  products,
  locale,
  messages,
}: FeaturedProductsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 3 },
    },
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="relative">
      {/* Carousel container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {products.map(product => (
            <CarouselProductCard
              key={product.id}
              product={product}
              locale={locale}
            />
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      <button
        onClick={scrollPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow z-10"
        aria-label="Previous products"
      >
        <ChevronLeft className="h-5 w-5 text-gray-700" />
      </button>

      <button
        onClick={scrollNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow z-10"
        aria-label="Next products"
      >
        <ChevronRight className="h-5 w-5 text-gray-700" />
      </button>
    </div>
  );
}
