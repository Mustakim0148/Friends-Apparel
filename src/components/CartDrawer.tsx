import React from 'react';
import { X, Trash2, ShoppingCart, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal,
    cartItemCount,
    setIsCheckoutOpen,
    currentUser,
    setIsAuthModalOpen,
    setAuthModalTab,
    showToast,
  } = useShop();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    if (!currentUser) {
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      showToast('Please log in to your account before checking out');
      return;
    }
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/40">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-rose-800" />
            <h2 className="font-serif text-lg font-bold text-stone-900">Your Shopping Cart</h2>
            <span className="text-xs bg-rose-200 text-rose-900 font-bold px-2 py-0.5 rounded-full">
              {cartItemCount}
            </span>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            id="close-cart-drawer"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping / Delivery highlight */}
        <div className="bg-amber-50/70 border-b border-amber-200/60 px-4 py-2 text-[11px] text-amber-900 flex items-center gap-1.5">
          <Truck className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            Doorstep Delivery across all 64 Districts of Bangladesh
          </span>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-stone-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-800 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="font-bold text-stone-900 text-base">Your cart is empty</h3>
              <p className="text-xs text-stone-500 max-w-xs">
                Explore our festive sarees, stylish kurtis, and elegant abayas to fill your cart!
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-2 px-5 py-2.5 rounded-full bg-rose-800 text-white text-xs font-semibold hover:bg-rose-900 transition-colors cursor-pointer"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={`${item.product.id}-${item.size}-${item.color}-${index}`} className="py-3.5 flex gap-3">
                {/* Thumbnail */}
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-20 h-24 rounded-xl object-cover object-center bg-stone-100 shrink-0 border border-stone-200"
                />

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-stone-900 line-clamp-2">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-stone-500">
                      <span>Size: <strong className="text-stone-700">{item.size}</strong></span>
                      <span>•</span>
                      <span>Color: <strong className="text-stone-700">{item.color}</strong></span>
                    </div>
                  </div>

                  {/* Quantity & Price */}
                  <div className="flex items-center justify-between mt-2 pt-1">
                    <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                      <button
                        onClick={() => updateCartQuantity(index, item.quantity - 1)}
                        className="px-2 py-0.5 text-stone-600 hover:bg-stone-200 text-xs font-bold transition-colors"
                      >
                        -
                      </button>
                      <span className="px-2.5 py-0.5 text-xs font-bold text-stone-900 bg-white min-w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(index, item.quantity + 1)}
                        className="px-2 py-0.5 text-stone-600 hover:bg-stone-200 text-xs font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-stone-400 block font-normal">
                        ৳{item.product.price.toLocaleString()} each
                      </span>
                      <span className="text-sm font-extrabold text-stone-900">
                        ৳{(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Subtotal & Checkout */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-rose-100 bg-stone-50/70 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal ({cartItemCount} items)</span>
                <span className="font-bold text-stone-900">৳{cartSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-stone-500 text-[11px]">
                <span>Delivery Charge</span>
                <span className="text-rose-800 font-medium">Calculated at Checkout</span>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200/60 flex justify-between items-baseline">
              <span className="text-sm font-bold text-stone-900">Estimated Subtotal:</span>
              <span className="text-lg font-extrabold text-rose-900">৳{cartSubtotal.toLocaleString()}</span>
            </div>

            <button
              onClick={handleCheckout}
              id="cart-proceed-checkout-btn"
              className="w-full py-3 px-4 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>{currentUser ? 'Proceed to Checkout' : 'Log In to Checkout'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!currentUser && (
              <p className="text-center text-[11px] text-rose-800 font-semibold bg-rose-50 p-1.5 rounded-lg border border-rose-200/60">
                🔒 Please log in to your account to place an order
              </p>
            )}

            <p className="text-center text-[11px] text-stone-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cash on delivery available in all 64 districts</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
