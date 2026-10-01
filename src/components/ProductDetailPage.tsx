import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  ShoppingCart,
  Truck,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  MessageCircle,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { useShop, findMatchingProduct } from '../context/ShopContext';
import { ProductCard } from './ProductCard';
import { getProductCode } from '../utils/productCode';

export const ProductDetailPage: React.FC = () => {
  const {
    quickViewProduct,
    setQuickViewProduct,
    setActiveView,
    addToCart,
    setIsCheckoutOpen,
    products,
    categories,
    setSelectedCategory,
    showToast,
  } = useShop();

  const product = quickViewProduct;

  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Pure Image Viewer State: ONLY IMAGE SHOWS, ZERO TEXT
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  const productCode = product ? getProductCode(product) : '';

  // Synchronize dynamic page title for browser tab and direct sharing
  useEffect(() => {
    if (product) {
      document.title = `${product.name} (Code: ${productCode}) | Friends Apparel`;
    } else {
      document.title = "Friends Apparel | Exclusive Women's Clothing";
    }
  }, [product, productCode]);

  // If page was loaded directly via URL /product/CODE and context hasn't populated product yet, actively search
  useEffect(() => {
    if (product) return;
    const urlCode = window.location.pathname.match(/\/product\/([^/?#]+)/i)?.[1] ||
                    window.location.hash.match(/#\/?product\/([^/?#]+)/i)?.[1];
    if (!urlCode) return;
    const clean = decodeURIComponent(urlCode).trim();
    const matched = findMatchingProduct(clean, products);
    if (matched) {
      setQuickViewProduct(matched);
    }
  }, [product, products, setQuickViewProduct]);

  const handleCopyCode = () => {
    if (!productCode) return;
    try {
      navigator.clipboard.writeText(productCode);
      setCopiedCode(true);
      showToast(`✓ Product Code "${productCode}" copied to clipboard!`);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      showToast(`Product Code: ${productCode}`);
    }
  };

  const handleCopyLink = () => {
    if (!productCode) return;
    try {
      const fullUrl = `${window.location.origin}/product/${encodeURIComponent(productCode)}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      showToast(`✓ Dynamic link copied: /product/${productCode}`);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast(`Direct URL: /product/${productCode}`);
    }
  };

  useEffect(() => {
    if (product) {
      setSelectedImageIndex(0);
      setSelectedSize(product.sizes[0] || 'Free Size');
      setSelectedColor(product.colors[0]?.name || 'Standard');
      setQuantity(1);
      setIsViewerOpen(false);
      setIsZoomed(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Keyboard navigation for image viewer
  useEffect(() => {
    if (!isViewerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsViewerOpen(false);
        setIsZoomed(false);
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewerOpen, handlePrevImage, handleNextImage]);

  if (!product) {
    // Check if user came via /product/CODE
    const urlCode = window.location.pathname.match(/\/product\/([^/?#]+)/i)?.[1] ||
                    window.location.hash.match(/#\/?product\/([^/?#]+)/i)?.[1];

    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-800 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Truck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 mb-2">
          {urlCode ? `Loading Product ${decodeURIComponent(urlCode)}...` : 'No Product Selected'}
        </h2>
        <p className="text-stone-500 text-sm max-w-md mx-auto mb-6">
          {urlCode
            ? `Please wait a moment while we fetch this item, or browse our exclusive collection.`
            : 'Select any product from the catalog to see its full specifications, images, and live code.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="px-5 py-2.5 rounded-full border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Go to Home
          </button>
          <button
            type="button"
            onClick={() => setActiveView('catalog')}
            className="px-6 py-2.5 rounded-full bg-rose-800 text-white font-bold text-xs hover:bg-rose-900 transition-colors cursor-pointer shadow-md"
          >
            Explore All Collection
          </button>
        </div>
      </div>
    );
  }

  const categoryObj = categories.find(c => c.id === product.categoryId);
  const relatedProducts = products
    .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="bg-white min-h-screen pb-16">
      {/* Breadcrumb & Navigation Bar */}
      <div className="border-b border-stone-200/80 bg-stone-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-stone-600 truncate">
            <button
              onClick={() => setActiveView('home')}
              className="hover:text-rose-800 transition-colors font-medium cursor-pointer"
            >
              Home
            </button>
            <span className="text-stone-400">/</span>
            <button
              onClick={() => {
                setSelectedCategory(product.categoryId);
                setActiveView('catalog');
              }}
              className="hover:text-rose-800 transition-colors font-medium cursor-pointer capitalize"
            >
              {categoryObj?.name || product.categoryId}
            </button>
            <span className="text-stone-400">/</span>
            <span className="text-stone-900 font-bold truncate max-w-[180px] sm:max-w-md">
              {product.name}
            </span>
          </div>

          <button
            onClick={() => setActiveView('catalog')}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-800 hover:text-rose-950 transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products</span>
          </button>
        </div>
      </div>

      {/* Main Full Page Product Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Big Product Photos */}
          <div className="lg:col-span-7 space-y-4">
            {/* Primary Main Image - Click to Open Pure Fullscreen Image */}
            <div
              onClick={() => {
                setIsViewerOpen(true);
                setIsZoomed(false);
              }}
              className="relative aspect-4/5 sm:aspect-square lg:aspect-4/5 w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/90 shadow-xs group cursor-zoom-in"
            >
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500 select-none"
              />

              {/* Prev / Next Arrows on main image if multiple images */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 items-center">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImageIndex === idx
                        ? 'border-rose-800 ring-2 ring-rose-200 scale-102 shadow-sm'
                        : 'border-stone-200 hover:border-stone-400 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: In-depth Product Details & Purchasing */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              {/* Category Tag, Product Code & Stock Status */}
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-rose-800 bg-rose-50 px-3.5 py-1 rounded-full uppercase tracking-wider text-xs border border-rose-200">
                    {product.subcategory || categoryObj?.name || product.categoryId}
                  </span>

                  {/* Dynamic Product Code Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-200/90 text-stone-800 text-xs font-mono font-bold shadow-2xs">
                    <span className="text-stone-400 font-sans text-[11px] font-normal">Code:</span>
                    <span className="text-rose-900 font-extrabold tracking-wide">{productCode}</span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="ml-0.5 p-1 hover:bg-stone-200 text-stone-500 hover:text-stone-900 rounded-md transition-colors cursor-pointer"
                      title="Copy product link"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {product.stock > 0 ? (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    In Stock ({product.stock} available)
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 leading-tight">
                {product.name}
              </h1>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-3 pb-5 border-b border-stone-200">
                <span className="text-3xl sm:text-4xl font-extrabold text-stone-950">
                  ৳{product.price.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-lg text-stone-400 line-through">
                      ৳{product.originalPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Save ৳{(product.originalPrice - product.price).toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Product Description */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                Description
              </h2>
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Fabric & Care Details */}
            {(product.fabric || product.care) && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                {product.fabric && (
                  <div className="flex gap-2">
                    <span className="font-bold text-stone-900 min-w-16">Fabric:</span>
                    <span className="text-stone-700">{product.fabric}</span>
                  </div>
                )}
                {product.care && (
                  <div className="flex gap-2">
                    <span className="font-bold text-stone-900 min-w-16">Care:</span>
                    <span className="text-stone-700">{product.care}</span>
                  </div>
                )}
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-stone-800 mb-2.5">
                  <span>Select Size:</span>
                  <span className="text-stone-500 font-normal">Standard Bangladesh Fitting</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSize(s)}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        selectedSize === s
                          ? 'border-rose-800 bg-rose-50 text-rose-900 font-bold shadow-xs ring-1 ring-rose-800'
                          : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-stone-800 mb-2.5">
                  Color: <span className="font-normal text-stone-600">{selectedColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  {product.colors.map((c, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(c.name)}
                      className={`group relative w-8 h-8 rounded-full transition-transform cursor-pointer ${
                        selectedColor === c.name ? 'ring-2 ring-rose-700 ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                      title={c.name}
                      style={{ backgroundColor: c.hex }}
                    >
                      {selectedColor === c.name && (
                        <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow-sm">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 pt-1">
              <span className="text-xs font-semibold text-stone-800">Quantity:</span>
              <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="px-3.5 py-2 text-stone-600 hover:bg-stone-200 text-base font-bold transition-colors disabled:opacity-30 cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 py-2 text-xs font-bold text-stone-900 bg-white min-w-10 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="px-3.5 py-2 text-stone-600 hover:bg-stone-200 text-base font-bold transition-colors disabled:opacity-30 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart & Buy Now Action Buttons */}
            <div className="pt-3 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                id="page-add-to-cart-btn"
                className="flex-1 py-3.5 px-6 rounded-2xl border-2 border-rose-800 text-rose-800 hover:bg-rose-50 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                id="page-buy-now-btn"
                className="flex-1 py-3.5 px-6 rounded-2xl bg-rose-800 hover:bg-rose-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <span>Buy Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Bangladesh Delivery Card */}
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-start gap-3">
              <Truck className="w-5 h-5 text-rose-800 shrink-0 mt-0.5" />
              <div className="text-xs space-y-2 text-stone-700 w-full">
                <div>
                  <p className="font-bold text-stone-900">
                    Doorstep Delivery Across All 64 Districts:
                  </p>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Fast, secure courier delivery to every city, upazila, and district in Bangladesh.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-rose-200/80 shadow-2xs">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                      Inside Dhaka
                    </span>
                    <span className="font-extrabold text-rose-900 text-xs flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                      <span>1 Day Delivery</span>
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-rose-200/80 shadow-2xs">
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
                  ✓ Cash on Delivery (COD) available right at your doorstep.
                </p>
              </div>
            </div>

            {/* Quick Contact Buttons */}
            <div className="flex items-center gap-3 pt-2 text-xs">
              <a
                href="tel:01929600998"
                className="flex-1 py-2 px-3 rounded-xl border border-stone-200 hover:bg-stone-100 flex items-center justify-center gap-1.5 font-semibold text-stone-700 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-rose-800" />
                <span>Call: 01929600998</span>
              </a>
              <a
                href={`https://wa.me/8801929600998?text=${encodeURIComponent(
                  `Hello Friends Apparel, I would like to order "${product.name}" (Product Code: ${productCode}) priced at ৳${product.price.toLocaleString()}.\nLink: ${window.location.origin}/product/${productCode}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3 rounded-xl border border-stone-200 hover:bg-stone-100 flex items-center justify-center gap-1.5 font-semibold text-stone-700 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                <span>WhatsApp Query</span>
              </a>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-stone-200">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mb-6">
              More From This Category
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PURE FULL-SCREEN IMAGE VIEWER: ONLY IMAGE SHOWS, ZERO TEXT */}
      {isViewerOpen && (
        <div
          className="fixed inset-0 z-70 bg-black/95 backdrop-blur-md flex items-center justify-center select-none"
          onClick={() => {
            setIsViewerOpen(false);
            setIsZoomed(false);
          }}
        >
          {/* Close Icon (No text) */}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setIsViewerOpen(false);
              setIsZoomed(false);
            }}
            className="absolute top-4 right-4 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left Arrow Icon if multiple images (No text) */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handlePrevImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          )}

          {/* Pure Centered Image Only */}
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

          {/* Right Arrow Icon if multiple images (No text) */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handleNextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
