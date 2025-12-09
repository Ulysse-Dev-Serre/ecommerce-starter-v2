'use client';

import Link from 'next/link';
import { useState } from 'react';

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

interface ProductCardProps {
  product: Product;
  locale: string;
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const translation = product.translations?.[0];
  const firstVariant = product.variants?.[0];
  const pricing = firstVariant?.pricing ?? [];
  const allImages = product.media || [];

  // Trouver l'index de l'image principale ou utiliser la première
  const primaryImageIndex = allImages.findIndex(img => img.isPrimary) || 0;
  const currentImage =
    allImages[currentImageIndex] || allImages[primaryImageIndex];

  return (
    <div className="group relative border border-border rounded-lg p-4 hover:shadow-lg transition">
      <Link href={`/${locale}/product/${product.slug}`}>
        <div className="w-full h-48 bg-muted rounded-md mb-3 overflow-hidden">
          {currentImage ? (
            <img
              src={currentImage.url}
              alt={currentImage.alt || translation?.name || product.slug}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {locale === 'fr' ? "Pas d'image" : 'No image'}
            </div>
          )}
        </div>
      </Link>

      <Link href={`/${locale}/product/${product.slug}`}>
        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
          {translation?.name ?? product.slug}
        </h3>
      </Link>

      <p className="text-sm text-muted-foreground mb-3">
        {translation?.shortDescription}
      </p>

      <div className="mb-3">
        <PriceDisplay
          pricing={pricing.map(p => ({
            price: p.price.toString(),
            currency: p.currency,
          }))}
          className="text-xl font-bold"
          locale={locale}
        />
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
              className={`w-6 h-6 rounded-full border-2 overflow-hidden transition-all cursor-pointer ${
                index === currentImageIndex
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-[#c4b5a0] hover:border-[#9d8e7e]'
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
  );
}
