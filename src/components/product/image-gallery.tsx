'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

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
      <div className="vibe-image-container vibe-flex-center vibe-text-muted">
        <ImageIcon className="vibe-w-12 vibe-h-12" />
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
    <div className="vibe-stack-y-4">
      <div className="vibe-image-container vibe-group">
        <Image
          src={selectedImage.url}
          alt={selectedImage.alt || productName}
          fill
          className="vibe-object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={selectedIndex === 0}
        />

        {images.length > 1 && (
          <>
            {hasPrevious && (
              <button
                onClick={goToPrevious}
                className="vibe-image-abs-center vibe-left-4"
                aria-label={tCommon('previousImage')}
              >
                <ChevronLeft className="vibe-icon-md" />
              </button>
            )}

            {hasNext && (
              <button
                onClick={goToNext}
                className="vibe-image-abs-center vibe-right-4"
                aria-label={tCommon('nextImage')}
              >
                <ChevronRight className="vibe-icon-md" />
              </button>
            )}

            <div className="vibe-image-dots-container">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    'vibe-image-dot',
                    index === selectedIndex && 'vibe-image-dot-active'
                  )}
                  aria-label={`${tCommon('goToImage')} ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="vibe-grid-gallery">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'vibe-image-thumb',
                index === selectedIndex
                  ? 'vibe-image-thumb-active'
                  : 'vibe-image-thumb-inactive'
              )}
            >
              <Image
                src={image.url}
                alt={image.alt || `${productName} ${index + 1}`}
                fill
                className="vibe-object-cover"
                sizes="(max-width: 768px) 25vw, 10vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
