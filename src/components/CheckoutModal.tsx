import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle, Truck, MapPin, Phone, Mail, User, ShoppingCart, ShieldCheck, AlertCircle, Sparkles, Clock, MessageCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { District } from '../types';

export const CheckoutModal: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    cartItemCount,
    districts,
    isCheckoutOpen,
    setIsCheckoutOpen,
    clearCart,
    setCurrentOrder,
    showToast,
    reloadDistricts,
    currentUser,
    setIsAuthModalOpen,
    setAuthModalTab,
    openOrderTracker,
  } = useShop();

  // Form states
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('dhaka');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Freshly refresh districts when checkout modal opens to guarantee live admin rates
  useEffect(() => {
    if (isCheckoutOpen) {
      reloadDistricts();
      if (currentUser) {
        if (!customerName && currentUser.name) setCustomerName(currentUser.name);
        if (!customerPhone && currentUser.phone) setCustomerPhone(currentUser.phone);
      }
    }
  }, [isCheckoutOpen, reloadDistricts, currentUser]);

  // Find the selected district object from live database table
  const selectedDistrict = useMemo(() => {
    return districts.find(d => d.id === selectedDistrictId) || {
      id: 'dhaka',
      name: 'Dhaka',
      bnName: 'Dhaka',
      division: 'Dhaka',
      charge: 80,
    };
  }, [districts, selectedDistrictId]);

  // Dynamic delivery charge from database table
  const deliveryCharge = selectedDistrict.charge;
  const grandTotal = cartSubtotal + deliveryCharge;

  // Group districts by division for an organized, user-friendly dropdown
  const groupedDistricts = useMemo(() => {
    const groups: Record<string, District[]> = {};
    for (const d of districts) {
      if (!groups[d.division]) groups[d.division] = [];
      groups[d.division].push(d);
    }
    return groups;
  }, [districts]);

  if (!isCheckoutOpen) return null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Enforce login strictly as requested by user
    if (!currentUser) {
      setErrorMessage('Please log in to your account before placing an order.');
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }

    // Validation
    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    // Convert Bengali numerals (০-৯) to English digits if user entered Bangla numerals
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const cleanPhone = customerPhone.replace(/[০-৯]/g, d => String(banglaDigits.indexOf(d))).replace(/[\s\-+]/g, '').replace(/^88/, '');
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      setErrorMessage('Please enter a valid 11-digit mobile number (e.g. 01929600998).');
      return;
    }

    if (!customerAddress.trim() || customerAddress.length < 5) {
      setErrorMessage('Please provide a complete delivery address (House, Road, Area).');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Your cart is empty. Please add items to order.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems = cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.images[0],
        size: item.size,
        color: item.color,
        price: item.product.price,
        quantity: item.quantity,
      }));

      const newOrder = await api.createOrder({
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerAddress: customerAddress.trim(),
        districtId: selectedDistrict.id,
        items: orderItems,
        paymentMethod: 'cod',
        notes: notes.trim(),
        userUid: currentUser.uid,
      });

      // Clear cart, close checkout, open order confirmation
      clearCart();
      setIsCheckoutOpen(false);
      setCurrentOrder(newOrder);
      showToast(`Order placed successfully! Order ID: ${newOrder.orderNumber}`);
    } catch (err: any) {
      console.error('Order placement error:', err);
      setErrorMessage(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-2 sm:p-6 animate-fadeIn">
      <div
        className="relative bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-rose-100 my-2 sm:my-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-6 border-b border-rose-100 flex items-center justify-between bg-gradient-to-r from-rose-900 to-rose-950 text-white">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-rose-300" />
            </div>
            <div>
              <h2 className="font-serif text-base sm:text-xl font-bold">Checkout & Delivery</h2>
              <p className="text-[11px] sm:text-xs text-rose-200">
                Nationwide Delivery across all 64 districts of Bangladesh
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(false)}
            id="close-checkout-modal"
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="m-3 sm:m-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!currentUser && (
          <div className="m-3 sm:m-6 p-3.5 sm:p-6 bg-gradient-to-r from-rose-50 to-amber-50/50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3 text-left">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-rose-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-stone-900">
                  Login Required to Place Order
                </h3>
                <p className="text-[11px] sm:text-xs text-stone-600 mt-0.5">
                  Please log in to your Friends Apparel account to confirm and track your order.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('login');
                  setIsAuthModalOpen(true);
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer text-center"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('register');
                  setIsAuthModalOpen(true);
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-white border border-rose-300 text-rose-900 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
              >
                Register
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Customer & Shipping Form (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-7 space-y-4 sm:space-y-5 border-b lg:border-b-0 lg:border-r border-stone-200/80 lg:max-h-[80vh] lg:overflow-y-auto">
            {/* Step 1: Customer Contact */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-900 mb-3">
                <User className="w-4 h-4 text-rose-700" />
                <span>1. Customer Details</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="e.g. Nusrat Jahan"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-rose-700 focus:outline-hidden transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Mobile Number <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-stone-500">
                      +88
                    </span>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="01712345678"
                      className="w-full pl-11 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-rose-700 focus:outline-hidden transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">
                    We will send SMS updates and delivery confirmation to this number.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: District Selector & Address */}
            <div className="pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-rose-900 mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-700" />
                  <span>2. Delivery Address & District</span>
                </div>
                <span className="text-[11px] font-normal lowercase text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full">
                  64 districts supported
                </span>
              </div>

              <div className="space-y-3">
                {/* District Selector (Dropdown listing all 64 districts) */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Select District <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={selectedDistrictId}
                    onChange={e => setSelectedDistrictId(e.target.value)}
                    id="checkout-district-selector"
                    className="w-full px-3.5 py-2.5 bg-rose-50/40 border-2 border-rose-300 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 focus:bg-white focus:border-rose-700 focus:outline-hidden cursor-pointer"
                  >
                    {(Object.entries(groupedDistricts) as [string, District[]][]).map(([division, dists]) => (
                      <optgroup key={division} label={`── ${division} Division ──`}>
                        {dists.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name} — Delivery: ৳{d.charge}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>

                  {/* Highlight dynamic fee and delivery timeline */}
                  <div className="mt-2 p-3 rounded-xl bg-rose-50/80 border border-rose-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-rose-950 font-medium">
                        Selected: <strong>{selectedDistrict.name}</strong> ({selectedDistrict.division} Division)
                      </span>
                      <span className="bg-rose-800 text-white font-bold px-2.5 py-0.5 rounded-md text-[11px]">
                        Delivery: ৳{deliveryCharge}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-stone-600 flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                        <span>Estimated Delivery Time:</span>
                      </span>
                      <span className="font-bold text-rose-900 bg-white/90 px-2 py-0.5 rounded-md border border-rose-200/80">
                        {selectedDistrict.id === 'dhaka' ? '1 Day (Inside Dhaka)' : '3 Days (Outside Dhaka)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Full Delivery Address <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    placeholder="House number, Road, Sector/Ward, Area, Thana/Police Station..."
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-rose-700 focus:outline-hidden transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Order Note / Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Call before delivery, Leave at security"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-rose-700 focus:outline-hidden transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Payment Method - Cash Only */}
            <div className="pt-2 border-t border-stone-100">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-900 mb-2">
                3. Payment Method
              </div>

              <div className="p-3.5 rounded-xl border-2 border-emerald-600 bg-emerald-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    ৳
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 block flex items-center gap-2">
                      <span>Cash on Delivery</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                        Cash Only
                      </span>
                    </span>
                    <span className="text-[11px] text-stone-600 leading-tight block mt-0.5">
                      Pay cash to the delivery agent upon receiving your package at your doorstep
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Column (5 cols) */}
          <div className="lg:col-span-5 bg-stone-50 p-5 sm:p-7 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-rose-800" />
                  <span>Order Summary ({cartItemCount} items)</span>
                </h3>
              </div>

              {/* Item thumbnails */}
              <div className="mt-3 max-h-56 overflow-y-auto divide-y divide-stone-200/60 pr-1">
                {cart.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center gap-3">
                    <img
                      src={item.product.images[0]}
                      alt=""
                      className="w-12 h-14 rounded-lg object-cover bg-white border border-stone-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-semibold text-stone-900 truncate">
                        {item.product.name}
                      </h5>
                      <p className="text-[11px] text-stone-500">
                        {item.size} • {item.color} • Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-stone-900">
                        ৳{(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="mt-4 pt-3 border-t border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-stone-900">৳{cartSubtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-stone-600">
                  <div className="flex flex-col">
                    <span>Delivery Charge</span>
                    <span className="text-[10px] text-rose-800 font-semibold">
                      {selectedDistrict.name} ({selectedDistrict.id === 'dhaka' ? 'Inside Dhaka • 1 Day' : 'Outside Dhaka • 3 Days'})
                    </span>
                  </div>
                  <span className="font-bold text-rose-900">৳{deliveryCharge}</span>
                </div>

                <div className="pt-3 border-t border-stone-200/90 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-stone-950">Grand Total</span>
                  <span className="text-xl font-extrabold text-rose-900">
                    ৳{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button & Reassurance */}
            <div className="space-y-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                id="place-order-submit-btn"
                className="w-full py-3.5 px-4 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Placing Order...</span>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Place Order (৳{grandTotal.toLocaleString()})</span>
                  </>
                )}
              </button>

              <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-center">
                <p className="text-[11px] text-stone-700 font-medium">
                  Need assistance with your order? Contact us directly:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-1">
                  <a
                    href="https://wa.me/8801929600998"
                    target="_blank"
                    rel="noopener noreferrer"
                    id="checkout-whatsapp-link"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-[#25D366] text-[#25D366]" />
                    <span>WhatsApp: 01929600998</span>
                  </a>
                  <span className="text-stone-300 hidden sm:inline">•</span>
                  <a
                    href="tel:01929600998"
                    id="checkout-helpline-link"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-900 hover:text-rose-950 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-rose-700" />
                    <span>01929600998</span>
                  </a>
                  <span className="text-stone-300 hidden sm:inline">•</span>
                  <a
                    href="mailto:friendsapparelcare@gmail.com"
                    id="checkout-email-link"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-900 hover:text-rose-950 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-rose-700" />
                    <span>friendsapparelcare@gmail.com</span>
                  </a>
                </div>
              </div>

              <div className="text-center text-[11px] text-stone-500 space-y-1">
                <p className="flex items-center justify-center gap-1 text-emerald-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>No upfront payment required for Cash on Delivery</span>
                </p>
                <p>
                  Estimated delivery: Dhaka (1–2 days) • Outside Dhaka (2–4 days)
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
