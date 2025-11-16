'use client';

import { useState } from 'react';

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

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center text-gray-400">
        {locale === 'fr' ? "Pas d'image" : 'No image'}
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
      <div className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden group">
        <img
          src={selectedImage.url}
          alt={selectedImage.alt || productName}
          className="w-full h-full object-cover"
        />

        {images.length > 1 && (
          <>
            {hasPrevious && (
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                aria-label={
                  locale === 'fr' ? 'Image précédente' : 'Previous image'
                }
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}

            {hasNext && (
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                aria-label={locale === 'fr' ? 'Image suivante' : 'Next image'}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`w-2 h-2 rounded-full transition cursor-pointer ${
                    index === selectedIndex
                      ? 'bg-white'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`${locale === 'fr' ? "Aller à l'image" : 'Go to image'} ${index + 1}`}
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
              className={`aspect-square bg-gray-100 rounded-md overflow-hidden border-2 transition cursor-pointer ${
                index === selectedIndex
                  ? 'border-primary'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={image.url}
                alt={image.alt || `${productName} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
