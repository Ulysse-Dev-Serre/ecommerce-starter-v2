'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import HeroCarousel from './HeroCarousel';
import type { Messages } from '@/lib/i18n/types';

interface HeroProps {
  messages: Messages;
}

const Hero: React.FC<HeroProps> = ({ messages }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToSection = () => {
    const element = document.getElementById('featured-products');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home"
      className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden 
                 bg-gradient-to-br from-white to-neutral-50 pt-20"
    >
      {/* Subtle background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top right accent */}
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 
                       rounded-full blur-3xl opacity-30 -mr-48 -mt-48"
        ></div>
        {/* Bottom left accent */}
        <div
          className="absolute bottom-0 left-0 w-96 h-96 bg-neutral-200 
                       rounded-full blur-3xl opacity-20 -ml-48 -mb-48"
        ></div>
      </div>

      {/* Main Content Grid */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          {/* Left - Logo, Description & CTA */}
          <div
            className={`flex flex-col items-center lg:items-start justify-center gap-6 transform transition-all duration-1000 delay-800 
                         ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
          >
            {/* Animated 3D Logo */}
            <div className="flex lg:justify-start justify-center mb-4 perspective">
              <div className="relative h-24 w-24 sm:h-32 sm:w-32 animate-float">
                {/* 3D Glow effect */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-emerald-600/20 
                               rounded-full blur-2xl animate-pulse"
                ></div>

                {/* Logo Image with 3D effect */}
                <img
                  src="/ManorLeaf_transparent.png"
                  alt="ManorLeaf Logo"
                  className="h-full w-full object-contain relative z-10 filter drop-shadow-2xl 
                            transition-transform duration-300 hover:scale-110"
                />

                {/* Shadow/3D depth */}
                <div
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-3 
                               bg-gradient-to-r from-transparent via-black/10 to-transparent 
                               rounded-full blur-lg"
                ></div>
              </div>
            </div>

            {/* Company Description */}
            <div className="space-y-4 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900">
                <span className="manor-text-3d">MANOR</span>
                <span className="leaf-text-3d ml-2">LEAF</span>
              </h1>

              <p className="text-sm sm:text-base text-neutral-700 font-medium leading-relaxed">
                {messages.hero.companyTagline}
              </p>

              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs sm:text-sm text-emerald-700 font-semibold">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"
                    clipRule="evenodd"
                  />
                </svg>
                {messages.hero.mobileCompatible}
              </div>
            </div>

            <p className="text-center lg:text-left text-neutral-600 max-w-sm leading-relaxed text-sm sm:text-base">
              {messages.hero.description}
            </p>
            <button
              onClick={scrollToSection}
              className="group inline-flex items-center space-x-3 px-8 py-4 
                       bg-neutral-900 text-white 
                       rounded-lg font-semibold transition-all duration-300 
                       hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-105
                       border border-neutral-800 text-sm sm:text-base"
            >
              <span>{messages.hero.exploreProducts}</span>
              <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-300" />
            </button>
          </div>

          {/* Right - Image Carousel */}
          <div
            className={`transform transition-all duration-1000 delay-600 
                         ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'}`}
          >
            <HeroCarousel
              images={['/hero22.png', '/hero1.jpg', '/hero3.png']}
              autoplay={true}
              autoplayInterval={5000}
            />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        type="button"
        onClick={() => scrollToSection()}
        title="Défiler vers les produits"
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer group p-4 hover:scale-110 transition-transform z-10"
        aria-label="Scroll to featured products"
      >
        <div
          className="w-6 h-10 border-2 border-neutral-900 rounded-full flex justify-center 
                       opacity-50 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        >
          <div className="w-1 h-2 bg-neutral-900 rounded-full mt-2 animate-pulse"></div>
        </div>
      </button>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .perspective {
          perspective: 1000px;
        }
      `}</style>
    </section>
  );
};

export default Hero;
