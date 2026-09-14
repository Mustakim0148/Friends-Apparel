import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Truck, ShieldCheck, Heart, ArrowRight, Check, Sparkles, Clock } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const ProductDetailModal: React.FC = () => {
  const {
    quickViewProduct,
    setQuickViewProduct,
    addToCart,
    setIsCheckoutOpen,
    wishlist,
    toggleWishlist,
  } = useShop();

  const product = quickViewProduct;

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.images[0] || '');
      setSelectedSize(product.sizes[0] || 'Free Size');
      setSelectedColor(product.colors[0]?.name || 'Standard');
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  const isWishlisted = wishlist.includes(product.id);

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    setQuickViewProduct(null);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-2 sm:p-6 animate-fadeIn">
      <div
        className="relative bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-rose-100 my-2 sm:my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setQuickViewProduct(null)}
          id="close-product-detail-modal"
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 hover:bg-stone-200 text-stone-600 shadow-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Gallery Section */}
          <div className="p-3 sm:p-6 bg-stone-50 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-200/70">
            {/* Main Image */}
            <div className="relative aspect-4/5 rounded-2xl overflow-hidden bg-stone-200/50 shadow-inner">
              <img
                src={selectedImage || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-all duration-300"
              />

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
                  isWishlisted ? 'bg-rose-600 text-white' : 'bg-white/80 text-stone-700 hover:text-rose-600'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Thumbnail Switcher */}
            {product.images.length > 1 && (
              <div className="flex gap-2 mt-3 sm:mt-4 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-14 h-18 sm:w-16 sm:h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImage === img ? 'border-rose-700 ring-2 ring-rose-200' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details Section */}
          <div className="p-4 sm:p-8 flex flex-col justify-between md:max-h-[85vh] md:overflow-y-auto">
            <div>
              {/* Category */}
              <div className="flex items-center justify-between gap-2 text-xs mb-2">
                <span className="font-semibold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider text-[11px]">
                  {product.subcategory || product.categoryId}
                </span>
              </div>

              {/* Title */}
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
                {product.name}
              </h2>

              {/* Price & Stock info */}
              <div className="mt-3 flex items-center justify-between pb-4 border-b border-stone-100">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-stone-950">
                    ৳{product.price.toLocaleString()}
                  </span>
                </div>

                <div className="text-right">
                  {product.stock > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                      <span>In Stock ({product.stock} left)</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="mt-4 text-xs sm:text-sm text-stone-600 leading-relaxed">
                {product.description}
              </p>

              {/* Fabric & Care Details */}
              {(product.fabric || product.care) && (
                <div className="mt-3.5 p-3 rounded-xl bg-stone-50 text-[11px] space-y-1 text-stone-600 border border-stone-100">
                  {product.fabric && (
                    <p>
                      <strong className="text-stone-800">Fabric:</strong> {product.fabric}
                    </p>
                  )}
                  {product.care && (
                    <p>
                      <strong className="text-stone-800">Care:</strong> {product.care}
                    </p>
                  )}
                </div>
              )}

              {/* Size Selector */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-800 mb-2">
                  <span>Select Size:</span>
                  <span className="text-[11px] text-rose-800 cursor-pointer underline">Size Guide</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSize(s)}
                      className={`px-3.5 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                        selectedSize === s
                          ? 'border-rose-800 bg-rose-50 text-rose-900 font-bold shadow-2xs'
                          : 'border-stone-200 hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-stone-800 mb-2">
                    Color: <span className="font-normal text-stone-600">{selectedColor}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {product.colors.map((c, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(c.name)}
                        className={`group relative w-7 h-7 rounded-full transition-transform cursor-pointer ${
                          selectedColor === c.name ? 'ring-2 ring-rose-700 ring-offset-2 scale-110' : 'hover:scale-105'
                        }`}
                        title={c.name}
                        style={{ backgroundColor: c.hex }}
                      >
                        {selectedColor === c.name && (
                          <span className="absolute inset-0 flex items-center justify-center text-white text-[10px]">
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs font-semibold text-stone-800">Quantity:</span>
                <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-1.5 text-stone-600 hover:bg-stone-200 text-sm font-bold transition-colors disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="px-3.5 py-1.5 text-xs font-bold text-stone-900 bg-white min-w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="px-3 py-1.5 text-stone-600 hover:bg-stone-200 text-sm font-bold transition-colors disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Bangladesh Delivery Card */}
              <div className="mt-5 p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-start gap-3">
                <Truck className="w-5 h-5 text-rose-800 shrink-0 mt-0.5" />
                <div className="text-xs space-y-2 text-stone-700 w-full">
                  <div>
                    <p className="font-bold text-stone-900">
                      Doorstep Delivery Across All 64 Districts:
                    </p>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      Fast, secure courier delivery to every city, upazila, and district.
                    </p>
                  </div>

                  {/* Delivery time breakdown for Dhaka vs outside Dhaka */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div className="bg-white p-2 rounded-xl border border-rose-200/80 shadow-2xs">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                        Inside Dhaka
                      </span>
                      <span className="font-extrabold text-rose-900 text-xs flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                        <span>1 Day Delivery</span>
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-rose-200/80 shadow-2xs">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                        Outside Dhaka
                      </span>
                      <span className="font-extrabold text-stone-800 text-xs flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                        <span>3 Days Delivery</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-700 font-semibold pt-0.5">
                    ✓ Cash on Delivery available right at your doorstep.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-stone-100 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                id="modal-add-to-cart-btn"
                className="flex-1 py-3 px-4 rounded-xl border-2 border-rose-800 text-rose-800 hover:bg-rose-50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                id="modal-buy-now-btn"
                className="flex-1 py-3 px-4 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <span>Buy Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
