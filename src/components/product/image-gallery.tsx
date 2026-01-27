'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface ImageGalleryProps {
  images: Array<{
    url: string;
    alt: string | null;
    isPrimary: boolean;
  }>;
  productName: string;
  locale: string;
}

export function ImageGallery({
  images,
  productName,
  locale,
}: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tCommon = useTranslations('common');
  const tShop = useTranslations('shop');

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center text-muted-foreground border border-border">
        <ImageIcon className="w-12 h-12" />
        <span className="sr-only">{tShop('noImage')}</span>
      </div>
    );
  }

  const selectedImage = images[selectedIndex];
  const hasPrevious = selectedIndex > 0;
  const hasNext = selectedIndex < images.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) setSelectedIndex(selectedIndex - 1);
  };

  const goToNext = () => {
    if (hasNext) setSelectedIndex(selectedIndex + 1);
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group border border-border">
        <Image
          src={selectedImage.url}
          alt={selectedImage.alt || productName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={selectedIndex === 0}
        />

        {images.length > 1 && (
          <>
            {hasPrevious && (
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md backdrop-blur-sm z-10"
                aria-label={tCommon('previousImage')}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {hasNext && (
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md backdrop-blur-sm z-10"
                aria-label={tCommon('nextImage')}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer shadow-sm ${
                    index === selectedIndex
                      ? 'bg-primary w-4'
                      : 'bg-background/80 hover:bg-background'
                  }`}
                  aria-label={`${tCommon('goToImage')} ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square bg-muted rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                index === selectedIndex
                  ? 'border-primary opacity-100 ring-2 ring-primary/20'
                  : 'border-transparent hover:border-border opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt || `${productName} ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 10vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
