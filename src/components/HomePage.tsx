import React from 'react';
import { ArrowRight, Truck } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { HeroBanner } from './HeroBanner';
import { TrustBadges } from './TrustBadges';
import { ProductCard } from './ProductCard';

export const HomePage: React.FC = () => {
  const { products, categories, setSelectedCategory, setActiveView } = useShop();

  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 8);
  const newArrivals = products.filter(p => p.isNewArrival).slice(0, 4);

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    setActiveView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 sm:space-y-10 pb-8 sm:pb-12">
      {/* Hero Banner with Carousel */}
      <HeroBanner />

      {/* Trust & Delivery Badges */}
      <TrustBadges />

      {/* Daraz/Flipkart Style Categories Navigation Cards */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h2 className="font-serif text-lg sm:text-2xl font-bold text-stone-900">
              Shop by Category
            </h2>
            <p className="text-[11px] sm:text-xs text-stone-500">
              Curated collections crafted specifically for women's lifestyle and celebrations
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setActiveView('catalog');
            }}
            className="text-xs font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1 shrink-0"
          >
            <span>All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="group bg-white rounded-2xl p-2 sm:p-3 border border-stone-200/80 hover:border-rose-300 hover:shadow-md transition-all text-center flex flex-col items-center cursor-pointer"
            >
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-rose-50 mb-2 p-0.5 border-2 border-rose-100 group-hover:border-rose-400 transition-colors">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-rose-800 transition-colors">
                {cat.name}
              </h3>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Collection */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end mb-3 sm:mb-6">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setActiveView('catalog');
            }}
            className="text-xs font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1 shrink-0"
          >
            <span>View All ({products.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
          {featuredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 64 Districts Delivery Information Banner */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-stone-100 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-stone-200 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
              <Truck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Delivery Across All 64 Districts of Bangladesh</span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              From Dhaka to Panchagarh, Cox's Bazar to Sylhet
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              We deliver your favorite women's fashion parcels straight to your doorstep across all 64 districts of Bangladesh with safe, reliable Cash on Delivery convenience!
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedCategory('all');
              setActiveView('catalog');
            }}
            className="shrink-0 px-6 py-3 rounded-full bg-rose-800 hover:bg-rose-900 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Explore All Clothing</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Latest Collection Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end mb-4 sm:mb-6">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setActiveView('catalog');
            }}
            className="text-xs font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1"
          >
            <span>See More Styles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {newArrivals.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
};
