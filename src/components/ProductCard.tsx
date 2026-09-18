import React from 'react';
import { ShoppingCart, Eye, Truck } from 'lucide-react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, openProductDetail } = useShop();

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Default to first size and first color
    const defaultSize = product.sizes[0] || 'Free Size';
    const defaultColor = product.colors[0]?.name || 'Standard';
    addToCart(product, defaultSize, defaultColor, 1);
  };

  return (
    <div
      onClick={() => openProductDetail(product)}
      id={`product-card-${product.id}`}
      className="group bg-white rounded-2xl border border-stone-200/80 hover:border-rose-300 hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Image & Badges Container */}
      <div className="relative aspect-3/4 bg-stone-100 overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges: Discount & Stock */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="bg-rose-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
            </span>
          )}
          {product.stock <= 0 && (
            <span className="bg-stone-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
              Out of Stock
            </span>
          )}
        </div>

        {/* View Product overlay button */}
        <div className="absolute inset-x-0 bottom-3 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-3 z-10">
          <button
            onClick={e => {
              e.stopPropagation();
              openProductDetail(product);
            }}
            className="w-full py-2 px-3 rounded-xl bg-white/95 text-stone-900 text-xs font-semibold shadow-md hover:bg-rose-800 hover:text-white flex items-center justify-center gap-1.5 transition-colors backdrop-blur-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Product</span>
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Subcategory */}
          <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[11px] text-stone-500 mb-1">
            <span className="font-medium text-rose-800/80 uppercase tracking-wider text-[9px] sm:text-[10px]">
              {product.subcategory || product.categoryId}
            </span>
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-sm font-semibold text-stone-900 line-clamp-2 leading-snug group-hover:text-rose-800 transition-colors">
            {product.name}
          </h3>

          {/* Size Pills preview */}
          <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
            {product.sizes.slice(0, 3).map((s, idx) => (
              <span key={idx} className="text-[9px] sm:text-[10px] px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded">
                {s}
              </span>
            ))}
            {product.sizes.length > 3 && (
              <span className="text-[9px] sm:text-[10px] text-stone-400 self-center">
                +{product.sizes.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Price & Action Button */}
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-stone-100 flex items-center justify-between gap-1.5">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-lg font-extrabold text-stone-900">
                ৳{product.price.toLocaleString()}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[11px] sm:text-xs text-stone-400 line-through">
                  ৳{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {product.originalPrice && product.originalPrice > product.price ? (
              <span className="inline-block text-[9.5px] sm:text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 mt-0.5">
                Save ৳{(product.originalPrice - product.price).toLocaleString()}
              </span>
            ) : (
              <p className="text-[9px] sm:text-[10px] text-emerald-700 font-medium">
                Cash on Delivery
              </p>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={product.stock <= 0}
            className={`p-1.5 sm:p-2 rounded-xl flex items-center justify-center transition-all ${
              product.stock > 0
                ? 'bg-rose-50 hover:bg-rose-800 text-rose-800 hover:text-white cursor-pointer active:scale-95'
                : 'bg-stone-100 text-stone-300 cursor-not-allowed'
            }`}
            title="Add to Cart"
          >
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Delivery Time Information */}
        <div className="mt-2 pt-1.5 border-t border-stone-100/90 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[9.5px] sm:text-[10.5px] text-stone-600 bg-stone-50/90 px-2 py-1 sm:py-1.5 rounded-lg border border-stone-200/50 gap-0.5">
          <div className="flex items-center gap-1 font-semibold text-rose-800 shrink-0">
            <Truck className="w-3 h-3 text-rose-700 shrink-0" />
            <span>Delivery:</span>
          </div>
          <div className="font-medium text-stone-700 truncate">
            Dhaka <strong className="text-rose-900 font-bold">1 Day</strong> • Outside <strong className="text-stone-900 font-bold">3 Days</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
