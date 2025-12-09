'use client';

import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface HeroCarouselProps {
  images: string[];
  autoplay?: boolean;
  autoplayInterval?: number;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({
  images,
  autoplay = true,
  autoplayInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoplay) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [autoplay, autoplayInterval, images.length]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  };

  return (
    <div className="relative w-full h-full">
      {/* Image Container */}
      <div className="relative w-full h-[500px] overflow-hidden rounded-2xl shadow-2xl">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt={`Hero ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
        {/* Up Button */}
        <button
          onClick={handlePrev}
          className="group pointer-events-auto self-center pt-4 transition-all duration-300 hover:scale-110"
          aria-label="Previous image"
        >
          <ChevronUp className="w-6 h-6 text-white drop-shadow-lg group-hover:text-emerald-300" />
        </button>

        {/* Down Button */}
        <button
          onClick={handleNext}
          className="group pointer-events-auto self-center pb-4 transition-all duration-300 hover:scale-110"
          aria-label="Next image"
        >
          <ChevronDown className="w-6 h-6 text-white drop-shadow-lg group-hover:text-emerald-300" />
        </button>
      </div>

      {/* Indicator Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-emerald-600 w-8'
                : 'bg-white/50 hover:bg-white/75 w-2'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Transparent frame effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 to-emerald-50/10 rounded-2xl blur-2xl pointer-events-none"></div>
    </div>
  );
};

export default HeroCarousel;
