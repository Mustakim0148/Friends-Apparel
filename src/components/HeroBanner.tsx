import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, ShieldCheck, Truck } from 'lucide-react';
import { useShop } from '../context/ShopContext';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  tag: string;
  category: string;
  image: string;
  cta: string;
}

const HERO_SLIDES: Slide[] = [
  {
    id: 1,
    title: 'Heritage Jamdani & Silk Sarees',
    subtitle: 'Hand-woven elegance from Dhakai artisans with golden zari motifs for festive and bridal celebrations.',
    tag: 'Festive Collection 2026',
    category: 'sarees',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
    cta: 'Explore Sarees',
  },
  {
    id: 2,
    title: 'Luxury 3-Piece Embroidered Kurtis',
    subtitle: 'Exquisite needlework, breathable slub cotton & pure linen paired with coordinated dupattas.',
    tag: 'New Season Arrival',
    category: 'kurtis',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
    cta: 'Shop Kurtis',
  },
  {
    id: 3,
    title: 'Dubai Cut Flared Abayas & Borka',
    subtitle: 'Premium Korean Nida cloth silhouettes with matching chiffon hijabs for modest, graceful everyday comfort.',
    tag: 'Modest Elegance',
    category: 'abayas',
    image: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=1200&q=80',
    cta: 'View Abayas',
  },
];

export const HeroBanner: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { setSelectedCategory, setActiveView } = useShop();

  // Auto advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  const handleCtaClick = (category: string) => {
    setSelectedCategory(category);
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
            {/* Tag Pill */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-rose-600 text-white tracking-wider uppercase">
                <Sparkles className="w-3 h-3 text-amber-300" />
                {slide.tag}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight drop-shadow-sm">
              {slide.title}
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-base text-stone-200 leading-relaxed max-w-lg line-clamp-3 sm:line-clamp-none">
              {slide.subtitle}
            </p>

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
                <span>{slide.cta}</span>
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
        <button
          onClick={() => setCurrentSlide(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer focus:outline-hidden"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer focus:outline-hidden"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Indicator dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {HERO_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                currentSlide === idx ? 'w-8 bg-rose-500' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
