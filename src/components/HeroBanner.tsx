import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { INITIAL_HERO_SLIDES } from '../data/initialHeroSlides';

export const HeroBanner: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { heroSlides, setSelectedCategory, setActiveView } = useShop();

  const activeSlides = (heroSlides && heroSlides.length > 0)
    ? heroSlides.filter(s => s.isActive !== false)
    : INITIAL_HERO_SLIDES;

  const slidesToUse = activeSlides.length > 0 ? activeSlides : INITIAL_HERO_SLIDES;

  // Auto advance slides if multiple exist
  useEffect(() => {
    if (slidesToUse.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slidesToUse.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [slidesToUse.length]);

  const slide = slidesToUse[currentSlide % slidesToUse.length] || slidesToUse[0];

  const handleCtaClick = (category: string) => {
    setSelectedCategory(category || 'all');
    setActiveView('catalog');
  };

  return (
    <div className="relative bg-stone-900 overflow-hidden">
      {/* Banner Container */}
      <div className="relative min-h-[300px] sm:min-h-[440px] lg:min-h-[480px] flex items-center">
        {/* Background Image with Dark & Rose Vignette Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover object-center transition-all duration-1000 transform scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-900/75 to-transparent" />
          <div className="absolute inset-0 bg-rose-950/20 mix-blend-multiply" />
        </div>

        {/* Content Box */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 w-full">
          <div className="max-w-xl space-y-3 sm:space-y-4">
            {/* Title */}
            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight drop-shadow-sm">
              {slide.title}
            </h1>

            {/* Subtitle */}
            {slide.subtitle && (
              <p className="text-xs sm:text-base text-stone-200 leading-relaxed max-w-lg line-clamp-3 sm:line-clamp-none">
                {slide.subtitle}
              </p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-rose-200/90 py-0.5 sm:py-1">
              <span className="inline-flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                <span>64 Districts Delivery</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                <span>100% Quality Fabric</span>
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
              <button
                onClick={() => handleCtaClick(slide.category)}
                id="hero-cta-button"
                className="bg-rose-700 hover:bg-rose-800 text-white font-semibold px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-all transform hover:translate-x-1 shadow-lg cursor-pointer"
              >
                <span>{slide.cta || 'Shop Now'}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setActiveView('catalog');
                }}
                id="hero-browse-all-btn"
                className="bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-medium px-4 py-2 sm:px-5 sm:py-3 rounded-full text-xs sm:text-sm transition-colors border border-white/20 cursor-pointer"
              >
                View Full Catalog
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Prev/Next Controls */}
        {slidesToUse.length > 1 && (
          <>
            <button
              onClick={() => setCurrentSlide(prev => (prev - 1 + slidesToUse.length) % slidesToUse.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer focus:outline-hidden"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrentSlide(prev => (prev + 1) % slidesToUse.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer focus:outline-hidden"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicator dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {slidesToUse.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    (currentSlide % slidesToUse.length) === idx ? 'w-8 bg-rose-500' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
