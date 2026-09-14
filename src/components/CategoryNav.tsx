import React from 'react';
import { useShop } from '../context/ShopContext';
import { Sparkles } from 'lucide-react';

export const CategoryNav: React.FC = () => {
  const { categories, selectedCategory, setSelectedCategory, activeView, setActiveView } = useShop();

  const handleSelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (activeView === 'admin') {
      setActiveView('catalog');
    }
  };

  return (
    <div className="bg-white border-b border-rose-100 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 sm:space-x-2 py-2.5 overflow-x-auto no-scrollbar text-xs font-semibold">
          {/* All Collection */}
          <button
            onClick={() => handleSelect('all')}
            id="category-tab-all"
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-rose-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-rose-50 hover:text-rose-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>All Collection</span>
          </button>

          {/* Dynamic Categories */}
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`category-tab-${cat.id}`}
                onClick={() => handleSelect(cat.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-rose-800 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-rose-50 hover:text-rose-800'
                }`}
              >
                <span>{cat.name}</span>
                {cat.itemCount !== undefined && cat.itemCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-rose-700 text-rose-100' : 'bg-stone-200/80 text-stone-600'
                    }`}
                  >
                    {cat.itemCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
