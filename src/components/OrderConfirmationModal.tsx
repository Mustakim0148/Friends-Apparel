import React from 'react';
import { CheckCircle2, PackageCheck, Printer, ArrowRight, Truck, MapPin, Phone, Mail, Calendar, ShieldCheck, MessageCircle, X } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const OrderConfirmationModal: React.FC = () => {
  const { currentOrder, setCurrentOrder, setActiveView, openOrderTracker } = useShop();

  if (!currentOrder) return null;

  const handleClose = () => {
    setCurrentOrder(null);
  };

  const handleContinueShopping = () => {
    setCurrentOrder(null);
    setActiveView('home');
  };

  const handleTrackOrder = () => {
    const orderNum = currentOrder.orderNumber;
    setCurrentOrder(null);
    openOrderTracker(orderNum);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={handleClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-rose-100 my-8 p-6 sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          id="close-order-confirmation-btn"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-stone-100 hover:bg-rose-100 text-stone-500 hover:text-rose-900 flex items-center justify-center transition-colors cursor-pointer z-20 border border-stone-200 hover:border-rose-200"
          title="বন্ধ করুন (Close)"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Header */}
        <div className="text-center space-y-2 pb-6 border-b border-stone-100">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            Order Confirmed
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Thank You For Your Order!
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
            We have received your order and will contact you via phone before dispatching.
          </p>

          <div className="pt-2">
            <span className="text-xs text-stone-500">Order Reference Number:</span>
            <div className="font-mono text-xl font-extrabold text-rose-900 tracking-wider">
              {currentOrder.orderNumber}
            </div>
          </div>
        </div>

        {/* Order Status Progress */}
        <div className="py-5 border-b border-stone-100">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-2">
            <span>Order Status: <strong className="text-rose-800 uppercase">{currentOrder.status}</strong></span>
            <span className="text-stone-400">Payment: Cash on Delivery</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-medium pt-1">
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-rose-800" />
              <span className="text-rose-900 font-bold">Placed</span>
            </div>
            <div className="space-y-1">
              <div className={`h-1.5 rounded-full ${['Processing', 'Shipped', 'Delivered'].includes(currentOrder.status) ? 'bg-rose-800' : 'bg-stone-200'}`} />
              <span className={['Processing', 'Shipped', 'Delivered'].includes(currentOrder.status) ? 'text-rose-900 font-bold' : 'text-stone-400'}>
                Processing
              </span>
            </div>
            <div className="space-y-1">
              <div className={`h-1.5 rounded-full ${['Shipped', 'Delivered'].includes(currentOrder.status) ? 'bg-rose-800' : 'bg-stone-200'}`} />
              <span className={['Shipped', 'Delivered'].includes(currentOrder.status) ? 'text-rose-900 font-bold' : 'text-stone-400'}>
                Shipped
              </span>
            </div>
            <div className="space-y-1">
              <div className={`h-1.5 rounded-full ${currentOrder.status === 'Delivered' ? 'bg-rose-800' : 'bg-stone-200'}`} />
              <span className={currentOrder.status === 'Delivered' ? 'text-rose-900 font-bold' : 'text-stone-400'}>
                Delivered
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Details */}
        <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-b border-stone-100">
          <div className="space-y-1.5">
            <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-700" />
              <span>Delivery Address</span>
            </h4>
            <p className="text-stone-800 font-medium">{currentOrder.customerName}</p>
            <p className="text-stone-600 leading-relaxed">{currentOrder.customerAddress}</p>
            <p className="text-rose-900 font-semibold">
              District: {currentOrder.districtName} (Delivery: ৳{currentOrder.deliveryCharge})
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-rose-700" />
              <span>Contact & Timeline</span>
            </h4>
            <p className="text-stone-800 font-medium">{currentOrder.customerPhone}</p>
            <p className="text-stone-600 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-stone-400" />
              <span>{new Date(currentOrder.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </p>
            <p className="text-emerald-700 font-medium">
              Estimated: {currentOrder.districtId === 'dhaka' ? '1–2 Business Days' : '2–4 Business Days'}
            </p>
          </div>
        </div>

        {/* Items list */}
        <div className="py-4 max-h-48 overflow-y-auto divide-y divide-stone-100">
          {currentOrder.items.map((item, idx) => (
            <div key={idx} className="py-2 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <img src={item.productImage} alt="" className="w-10 h-12 rounded-md object-cover bg-stone-100" />
                <div>
                  <h5 className="font-semibold text-stone-900">{item.productName}</h5>
                  <span className="text-[11px] text-stone-500">
                    {item.size} • {item.color} • Qty: {item.quantity}
                  </span>
                </div>
              </div>
              <span className="font-bold text-stone-900">
                ৳{(item.price * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="pt-3 pb-6 border-t border-stone-100 space-y-1.5 text-xs">
          <div className="flex justify-between text-stone-600">
            <span>Items Subtotal:</span>
            <span>৳{currentOrder.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Delivery Fee ({currentOrder.districtName}):</span>
            <span>৳{currentOrder.deliveryCharge}</span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-stone-200 text-sm font-bold text-stone-900">
            <span>Total Payable upon Delivery:</span>
            <span className="text-lg font-extrabold text-rose-900">৳{currentOrder.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Support Hotline & Email */}
        <div className="bg-rose-50/80 border border-rose-200/70 p-3 rounded-xl text-center text-xs space-y-1.5 mb-2">
          <p className="text-stone-600">For any inquiries or changes regarding your order, please contact us:</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://wa.me/8801929600998"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-emerald-800 hover:text-emerald-950 text-xs"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-[#25D366] text-[#25D366]" />
              <span>WhatsApp: 01929600998</span>
            </a>
            <span className="text-stone-300 hidden sm:inline">•</span>
            <a href="tel:01929600998" className="inline-flex items-center gap-1.5 font-bold text-rose-900 hover:text-rose-950 text-xs">
              <Phone className="w-3.5 h-3.5 text-rose-700" />
              <span>01929600998</span>
            </a>
            <span className="text-stone-300 hidden sm:inline">•</span>
            <a href="mailto:friendsapparelcare@gmail.com" className="inline-flex items-center gap-1.5 font-bold text-rose-900 hover:text-rose-950 text-xs">
              <Mail className="w-3.5 h-3.5 text-rose-700" />
              <span>friendsapparelcare@gmail.com</span>
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={handleTrackOrder}
            id="track-new-order-btn"
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
          >
            <Truck className="w-4 h-4" />
            <span>Track Order</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>

          <button
            onClick={handleContinueShopping}
            className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
