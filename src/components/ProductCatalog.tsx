import React, { useState, useMemo } from 'react';
import { Filter, SlidersHorizontal, ArrowUpDown, X, Sparkles, ShoppingCart } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from './ProductCard';

export const ProductCatalog: React.FC = () => {
  const {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    selectedSize,
    setSelectedSize,
    isLoadingProducts,
  } = useShop();

  // Price range state
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Derive unique sizes & colors from available products
  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => p.sizes.forEach(s => set.add(s)));
    return Array.from(set);
  }, [products]);

  const availableColors = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach(p => p.colors.forEach(c => map.set(c.name, c.hex)));
    return Array.from(map.entries());
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(p => p.categoryId === selectedCategory);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
        (p.fabric && p.fabric.toLowerCase().includes(q))
      );
    }

    // Price range
    list = list.filter(p => p.price >= minPrice && p.price <= maxPrice);

    // Size filter
    if (selectedSize !== 'all') {
      list = list.filter(p => p.sizes.some(s => s.toLowerCase().includes(selectedSize.toLowerCase())));
    }

    // Color filter
    if (selectedColor !== 'all') {
      list = list.filter(p => p.colors.some(c => c.name.toLowerCase() === selectedColor.toLowerCase()));
    }

    // Sorting
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    }

    return list;
  }, [products, selectedCategory, searchQuery, minPrice, maxPrice, selectedSize, selectedColor, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setMinPrice(0);
    setMaxPrice(10000);
    setSelectedSize('all');
    setSelectedColor('all');
    setSortBy('featured');
  };

  const activeCategoryName = categories.find(c => c.id === selectedCategory)?.name || 'All Women\'s Clothing';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* Category Heading & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 sm:pb-6 border-b border-stone-200/80 gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1">
            <span>Home</span>
            <span>/</span>
            <span>Shop</span>
            {selectedCategory !== 'all' && (
              <>
                <span>/</span>
                <span className="font-semibold text-rose-800">{activeCategoryName}</span>
              </>
            )}
          </div>
          <h2 className="font-serif text-xl sm:text-3xl font-bold text-stone-900 flex items-center gap-2">
            <span>{activeCategoryName}</span>
            <span className="text-xs sm:text-sm font-sans font-bold bg-rose-50 text-rose-800 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-rose-200">
              {filteredProducts.length} items
            </span>
          </h2>
          {searchQuery && (
            <p className="text-xs text-stone-500 mt-1">
              Search results matching: <strong className="text-stone-800">"{searchQuery}"</strong>
            </p>
          )}
        </div>

        {/* Top Controls: Sort & Mobile Filter Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="lg:hidden px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-rose-800" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs text-stone-500 hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-800 focus:outline-hidden cursor-pointer shadow-2xs"
            >
              <option value="featured">Featured Collection</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">New Arrivals First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8 pt-4 sm:pt-6">
        {/* Left Filters Sidebar */}
        <aside
          className={`${
            isMobileFilterOpen ? 'block' : 'hidden'
          } lg:block lg:col-span-1 space-y-6 bg-white lg:bg-transparent p-5 lg:p-0 rounded-2xl lg:rounded-none border lg:border-none border-stone-200`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-rose-800" />
              <span>Filters</span>
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-rose-800 hover:text-rose-950 transition-colors"
            >
              Reset All
            </button>
          </div>

          {/* Categories Filter */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-2.5">
              Categories
            </h4>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-between ${
                  selectedCategory === 'all'
                    ? 'bg-rose-50 text-rose-900 font-bold'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>All Categories</span>
                <span className="text-stone-400 text-[11px]">{products.length}</span>
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-between ${
                    selectedCategory === cat.id
                      ? 'bg-rose-50 text-rose-900 font-bold'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-stone-400 text-[11px]">{cat.itemCount}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="pt-4 border-t border-stone-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-2.5">
              Price Range (৳ BDT)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-stone-400">Min Price</label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="100"
                  value={minPrice}
                  onChange={e => setMinPrice(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] text-stone-400">Max Price</label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="100"
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold"
                />
              </div>
            </div>

            {/* Quick Price presets */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              <button
                onClick={() => {
                  setMinPrice(0);
                  setMaxPrice(2000);
                }}
                className="text-[10px] px-2 py-1 rounded-md bg-stone-100 text-stone-600 hover:bg-rose-50 hover:text-rose-800"
              >
                Under ৳2,000
              </button>
              <button
                onClick={() => {
                  setMinPrice(2000);
                  setMaxPrice(4000);
                }}
                className="text-[10px] px-2 py-1 rounded-md bg-stone-100 text-stone-600 hover:bg-rose-50 hover:text-rose-800"
              >
                ৳2,000 – ৳4,000
              </button>
              <button
                onClick={() => {
                  setMinPrice(4000);
                  setMaxPrice(10000);
                }}
                className="text-[10px] px-2 py-1 rounded-md bg-stone-100 text-stone-600 hover:bg-rose-50 hover:text-rose-800"
              >
                Above ৳4,000
              </button>
            </div>
          </div>

          {/* Size Filter */}
          <div className="pt-4 border-t border-stone-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-2.5">
              Available Sizes
            </h4>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedSize('all')}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                  selectedSize === 'all'
                    ? 'border-rose-800 bg-rose-50 text-rose-900 font-bold'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                All Sizes
              </button>
              {['S', 'M', 'L', 'XL', 'Free Size'].map(sz => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                    selectedSize === sz
                      ? 'border-rose-800 bg-rose-50 text-rose-900 font-bold'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Color Filter */}
          {availableColors.length > 0 && (
            <div className="pt-4 border-t border-stone-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-2.5">
                Colors
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedColor('all')}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border transition-colors ${
                    selectedColor === 'all'
                      ? 'border-rose-800 bg-rose-50 text-rose-900 font-bold'
                      : 'border-stone-200 text-stone-600'
                  }`}
                >
                  All
                </button>
                {availableColors.slice(0, 8).map(([name, hex]) => (
                  <button
                    key={name}
                    onClick={() => setSelectedColor(name)}
                    className={`w-6 h-6 rounded-full border transition-transform ${
                      selectedColor === name ? 'ring-2 ring-rose-700 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: hex }}
                    title={name}
                  />
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Product Grid Area (3 cols) */}
        <div className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-800 flex items-center justify-center mx-auto">
                <ShoppingCart className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                No matching women's clothing found
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try loosening your filters, selecting a different category, or resetting your price range.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-full bg-rose-800 text-white text-xs font-bold hover:bg-rose-900 transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
