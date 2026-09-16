import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ShoppingCart,
  Truck,
  ArrowRight,
  Check,
  Clock,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const ProductDetailModal: React.FC = () => {
  const {
    quickViewProduct,
    setQuickViewProduct,
    addToCart,
    setIsCheckoutOpen,
  } = useShop();

  const product = quickViewProduct;

  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Full-screen image zoom / lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  useEffect(() => {
    if (product) {
      setSelectedImageIndex(0);
      setSelectedSize(product.sizes[0] || 'Free Size');
      setSelectedColor(product.colors[0]?.name || 'Standard');
      setQuantity(1);
      setIsLightboxOpen(false);
      setIsZoomed(false);
    }
  }, [product]);

  const images = product?.images && product.images.length > 0 ? product.images : [];
  const currentImage = images[selectedImageIndex] || '';

  const handlePrevImage = useCallback(() => {
    if (images.length <= 1) return;
    setSelectedImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    setIsZoomed(false);
  }, [images.length]);

  const handleNextImage = useCallback(() => {
    if (images.length <= 1) return;
    setSelectedImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
  }, [images.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!product) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
          setIsZoomed(false);
        } else {
          setQuickViewProduct(null);
        }
      } else if (isLightboxOpen) {
        if (e.key === 'ArrowLeft') {
          handlePrevImage();
        } else if (e.key === 'ArrowRight') {
          handleNextImage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, isLightboxOpen, handlePrevImage, handleNextImage, setQuickViewProduct]);

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    setQuickViewProduct(null);
    setIsCheckoutOpen(true);
  };

  return (
    <>
      {/* Large Product Detail Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-start sm:items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 animate-fadeIn">
        <div
          className="relative bg-white rounded-2xl sm:rounded-3xl max-w-6xl w-full overflow-hidden shadow-2xl border border-stone-200 my-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Close Modal Button */}
          <button
            onClick={() => setQuickViewProduct(null)}
            id="close-product-detail-modal"
            title="Close (ESC)"
            className="absolute top-3.5 right-3.5 z-20 p-2.5 rounded-full bg-white/90 hover:bg-rose-50 text-stone-700 hover:text-rose-800 shadow-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Gallery Section - 7 Columns on Large Screen for Big Immersive Photos */}
            <div className="lg:col-span-7 p-4 sm:p-6 lg:p-8 bg-stone-50/70 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-stone-200">
              <div>
                {/* Main Interactive Big Image Container */}
                <div
                  onClick={() => {
                    setIsLightboxOpen(true);
                    setIsZoomed(false);
                  }}
                  className="relative aspect-4/5 sm:aspect-square lg:aspect-4/5 max-h-[580px] w-full rounded-2xl overflow-hidden bg-stone-200/50 shadow-inner group cursor-zoom-in"
                  title="Click to zoom / বড় করে দেখতে ক্লিক করুন"
                >
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 select-none"
                  />

                  {/* Click to Zoom Floating Badge */}
                  <div className="absolute bottom-3 right-3 z-10 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 shadow-lg backdrop-blur-xs transition-all group-hover:scale-105 pointer-events-none">
                    <Maximize2 className="w-3.5 h-3.5 text-rose-300" />
                    <span>বড় করে দেখুন / Click to Zoom</span>
                  </div>

                  {/* Image counter pill */}
                  {images.length > 1 && (
                    <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-semibold backdrop-blur-xs pointer-events-none">
                      {selectedImageIndex + 1} / {images.length}
                    </div>
                  )}

                  {/* Prev/Next arrows on main image if multiple images */}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handlePrevImage();
                        }}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 hover:bg-white text-stone-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                        title="Previous Image"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleNextImage();
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 hover:bg-white text-stone-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                        title="Next Image"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails Switcher */}
                {images.length > 1 && (
                  <div className="flex gap-2.5 mt-3 sm:mt-4 overflow-x-auto pb-1 items-center">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          selectedImageIndex === idx
                            ? 'border-rose-800 ring-2 ring-rose-200 scale-102 shadow-sm'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        title={`View photo ${idx + 1}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Hint */}
              <p className="text-[11px] text-stone-500 mt-2 text-center lg:text-left flex items-center justify-center lg:justify-start gap-1">
                <Maximize2 className="w-3 h-3 text-rose-700" />
                <span>ছবিতে ক্লিক করে ফুলস্ক্রিনে বড় করে ও জুম করে দেখতে পারেন</span>
              </p>
            </div>

            {/* Product Details Section - 5 Columns on Large Screen */}
            <div className="lg:col-span-5 p-5 sm:p-7 lg:p-8 flex flex-col justify-between lg:max-h-[88vh] lg:overflow-y-auto">
              <div>
                {/* Category & Badge */}
                <div className="flex items-center justify-between gap-2 text-xs mb-2.5">
                  <span className="font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider text-[11px] border border-rose-200">
                    {product.subcategory || product.categoryId}
                  </span>
                  {product.stock > 0 && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      In Stock ({product.stock})
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-stone-900 leading-snug">
                  {product.name}
                </h2>

                {/* Price */}
                <div className="mt-3.5 flex items-center justify-between pb-4 border-b border-stone-100">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-950">
                      ৳{product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm sm:text-base text-stone-400 line-through">
                        ৳{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div>
                    {product.stock <= 0 && (
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
                  <div className="mt-4 p-3.5 rounded-xl bg-stone-50 text-xs space-y-1.5 text-stone-700 border border-stone-200/70">
                    {product.fabric && (
                      <p>
                        <strong className="text-stone-900 font-semibold">Fabric:</strong> {product.fabric}
                      </p>
                    )}
                    {product.care && (
                      <p>
                        <strong className="text-stone-900 font-semibold">Care:</strong> {product.care}
                      </p>
                    )}
                  </div>
                )}

                {/* Size Selector */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-800 mb-2">
                    <span>Select Size:</span>
                    <span className="text-[11px] text-rose-800 font-medium">Standard Fit</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSize(s)}
                        className={`px-3.5 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                          selectedSize === s
                            ? 'border-rose-800 bg-rose-50 text-rose-900 font-bold shadow-xs ring-1 ring-rose-800'
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
                            <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold drop-shadow-sm">
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
                      className="px-3 py-1.5 text-stone-600 hover:bg-stone-200 text-sm font-bold transition-colors disabled:opacity-30 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3.5 py-1.5 text-xs font-bold text-stone-900 bg-white min-w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className="px-3 py-1.5 text-stone-600 hover:bg-stone-200 text-sm font-bold transition-colors disabled:opacity-30 cursor-pointer"
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

      {/* Full-Screen Pure Product Image Viewer - ZERO TEXT */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-70 bg-black/95 backdrop-blur-md flex items-center justify-center select-none"
          onClick={() => {
            setIsLightboxOpen(false);
            setIsZoomed(false);
          }}
        >
          {/* Close Icon (No text) */}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setIsLightboxOpen(false);
              setIsZoomed(false);
            }}
            className="absolute top-4 right-4 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous Arrow Icon if multiple images (No text) */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handlePrevImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Previous"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          )}

          {/* Pure Centered Image Display */}
          <div
            className="flex items-center justify-center max-w-[95vw] max-h-[95vh] overflow-auto"
            onClick={e => {
              e.stopPropagation();
              setIsZoomed(!isZoomed);
            }}
          >
            <img
              src={currentImage}
              alt=""
              className={`max-w-[92vw] max-h-[92vh] object-contain select-none transition-transform duration-300 ${
                isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
              }`}
            />
          </div>

          {/* Next Arrow Icon if multiple images (No text) */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handleNextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Next"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          )}
        </div>
      )}
    </>
  );
};

