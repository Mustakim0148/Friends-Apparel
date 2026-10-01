import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Phone,
  User,
  Calendar,
  ShieldCheck,
  RotateCcw,
  ShoppingCart,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { Order, OrderStatus } from '../types';

export const OrderTrackerModal: React.FC = () => {
  const {
    isOrderTrackerOpen,
    setIsOrderTrackerOpen,
    trackingOrderQuery,
    setTrackingOrderQuery,
    currentUser,
    showToast,
  } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedOrders, setSearchedOrders] = useState<Order[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isLoadingUserOrders, setIsLoadingUserOrders] = useState(false);

  // Customer Cancellation State
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [customerCancelReason, setCustomerCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Initialize search input with trackingOrderQuery if provided
  useEffect(() => {
    if (isOrderTrackerOpen) {
      if (trackingOrderQuery) {
        setSearchQuery(trackingOrderQuery);
        handleTrackOrder(trackingOrderQuery);
      } else if (currentUser) {
        loadUserOrders();
      }
    } else {
      setSearchedOrders(null);
      setSearchError(null);
      setCancellingOrderId(null);
    }
  }, [isOrderTrackerOpen, trackingOrderQuery, currentUser]);

  const loadUserOrders = async () => {
    if (!currentUser) return;
    setIsLoadingUserOrders(true);
    try {
      const data = await api.getOrders(currentUser.uid);
      setUserOrders(data);
    } catch (err) {
      console.error('Failed to load user orders', err);
    } finally {
      setIsLoadingUserOrders(false);
    }
  };

  const handleTrackOrder = async (queryToUse?: string) => {
    const rawQuery = (queryToUse || searchQuery).trim();
    if (!rawQuery) {
      setSearchError('Please enter an Order ID (e.g. FA-12345) or phone number.');
      return;
    }

    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const query = rawQuery.replace(/[০-৯]/g, d => String(banglaDigits.indexOf(d))).trim();

    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await api.trackOrder(query);
      if (results.length === 0) {
        setSearchError(`No orders found for "${query}". Please verify your information and try again.`);
        setSearchedOrders([]);
      } else {
        setSearchedOrders(results);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Failed to track order. Please try again.');
      setSearchedOrders([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Customer self-cancellation for Pending orders
  const handleCustomerCancel = async (orderId: string) => {
    if (!customerCancelReason.trim()) {
      showToast('Please select or provide a reason for cancellation.');
      return;
    }

    setIsCancelling(true);
    try {
      const updated = await api.updateOrderStatus(orderId, 'Cancelled', customerCancelReason.trim());
      setSearchedOrders(prev => prev ? prev.map(o => o.id === orderId ? updated : o) : [updated]);
      setUserOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      setCancellingOrderId(null);
      setCustomerCancelReason('');
      showToast('Your order has been cancelled successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel order.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isOrderTrackerOpen) return null;

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Shipped':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Processing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return 0;
      case 'Processing':
        return 1;
      case 'Shipped':
        return 2;
      case 'Delivered':
        return 3;
      case 'Cancelled':
        return -1;
      default:
        return 0;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-rose-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-rose-100 bg-rose-50/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-800 text-white flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                Track Your Order
              </h2>
              <p className="text-xs text-stone-500">
                Check live order status, shipment tracking, and delivery details
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsOrderTrackerOpen(false);
              setTrackingOrderQuery('');
            }}
            id="close-order-tracker-modal"
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-6 border-b border-stone-100 bg-white shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleTrackOrder();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Enter Order ID (e.g. FA-72941) or Mobile Number..."
                className="w-full pl-9.5 pr-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:border-rose-700 focus:bg-white transition-all text-stone-900"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              id="track-order-search-btn"
              className="px-5 py-2.5 bg-rose-800 hover:bg-rose-900 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isSearching ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Track Order</span>
                </>
              )}
            </button>
          </form>

          {searchError && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{searchError}</span>
            </div>
          )}
        </div>

        {/* Content Area (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 divide-y divide-stone-100">
          {/* Active Search Results */}
          {searchedOrders && searchedOrders.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Search Results ({searchedOrders.length})
                </span>
                <span className="text-xs text-rose-800 font-medium">Cash on Delivery (COD)</span>
              </div>

              {searchedOrders.map(order => {
                const step = getStepIndex(order.status);
                const isCancelled = order.status === 'Cancelled';

                return (
                  <div
                    key={order.id}
                    className="border border-stone-200 rounded-2xl p-4 sm:p-5 bg-white shadow-xs space-y-4"
                  >
                    {/* Order Top Meta */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-base text-stone-900">
                            {order.orderNumber}
                          </span>
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status === 'Pending' && 'Pending'}
                            {order.status === 'Processing' && 'Processing'}
                            {order.status === 'Shipped' && 'Shipped'}
                            {order.status === 'Delivered' && 'Delivered'}
                            {order.status === 'Cancelled' && 'Cancelled'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {new Date(order.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-stone-400 block">Total Payable Amount</span>
                        <span className="text-lg font-extrabold text-rose-900">
                          ৳{order.total.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Prominent Cancellation Reason Banner if Cancelled */}
                    {isCancelled ? (
                      <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                          <span>This Order Has Been Cancelled</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs space-y-1">
                          <span className="text-xs font-extrabold text-rose-950 block">
                            Cancellation Reason:
                          </span>
                          <p className="text-sm font-semibold text-rose-900 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                            "{order.cancellationReason || 'No specific reason provided'}"
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-600 pt-1">
                          <span>For any inquiries or to place a new order, please reach out to us:</span>
                          <div className="flex items-center gap-3">
                            <a href="tel:01929600998" className="text-rose-900 font-bold underline hover:text-rose-950">
                              01929600998
                            </a>
                            <span>•</span>
                            <a href="mailto:friendsapparelcare@gmail.com" className="text-rose-900 font-bold underline hover:text-rose-950">
                              friendsapparelcare@gmail.com
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Visual Delivery Progress Tracker */
                      <div className="py-2">
                        <div className="relative flex items-center justify-between">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-stone-200 w-full z-0" />
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-rose-800 transition-all z-0"
                            style={{ width: `${(step / 3) * 100}%` }}
                          />

                          {[
                            { label: 'Order Placed', sub: 'Confirmed', idx: 0 },
                            { label: 'Processing', sub: 'Packaging', idx: 1 },
                            { label: 'Shipped', sub: 'On the Way', idx: 2 },
                            { label: 'Delivered', sub: 'Completed', idx: 3 },
                          ].map(s => {
                            const isDone = step >= s.idx;
                            const isCurrent = step === s.idx;
                            return (
                              <div key={s.idx} className="relative z-10 flex flex-col items-center">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                    isDone
                                      ? 'bg-rose-800 text-white shadow-xs'
                                      : 'bg-stone-100 text-stone-400 border border-stone-300'
                                  } ${isCurrent ? 'ring-4 ring-rose-200' : ''}`}
                                >
                                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.idx + 1}
                                </div>
                                <span
                                  className={`text-[11px] font-semibold mt-1 text-center whitespace-nowrap ${
                                    isDone ? 'text-stone-900' : 'text-stone-400'
                                  }`}
                                >
                                  {s.label}
                                </span>
                                <span className="text-[9px] text-stone-500">{s.sub}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Customer & Delivery Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-200/60">
                      <div>
                        <span className="text-stone-400 block font-normal">Customer Name & Phone:</span>
                        <div className="font-semibold text-stone-800 flex items-center gap-1.5 mt-0.5">
                          <User className="w-3.5 h-3.5 text-stone-500" />
                          <span>{order.customerName}</span>
                        </div>
                        <div className="text-stone-600 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-stone-500" />
                          <span>{order.customerPhone}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-stone-400 block font-normal">Delivery Address & District:</span>
                        <div className="font-semibold text-stone-800 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                          <span>{order.districtName} (Delivery Fee: ৳{order.deliveryCharge})</span>
                        </div>
                        <p className="text-stone-600 mt-0.5 truncate" title={order.customerAddress}>
                          {order.customerAddress}
                        </p>
                      </div>
                    </div>

                    {/* Ordered Items List */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-stone-700 block">
                        Ordered Items ({order.items.length}):
                      </span>
                      <div className="divide-y divide-stone-100 max-h-40 overflow-y-auto">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-2 flex items-center justify-between text-xs gap-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={item.productImage}
                                alt=""
                                className="w-9 h-11 rounded object-cover bg-stone-100 border border-stone-200"
                              />
                              <div>
                                <h4 className="font-semibold text-stone-900 line-clamp-1">
                                  {item.productName}
                                </h4>
                                <span className="text-[11px] text-stone-500">
                                  {item.size} • {item.color} • Qty: {item.quantity}
                                </span>
                              </div>
                            </div>
                            <span className="font-bold text-stone-900 shrink-0">
                              ৳{(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Totals & Payment Summary */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                      <div className="flex items-center gap-1 text-emerald-700 font-medium">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Cash on Delivery</span>
                      </div>
                      <div className="space-x-2">
                        <span>Items: ৳{order.subtotal.toLocaleString()}</span>
                        <span>•</span>
                        <span>Delivery: ৳{order.deliveryCharge}</span>
                      </div>
                    </div>

                    {/* Customer Cancel Option for Pending Orders */}
                    {order.status === 'Pending' && (
                      <div className="pt-2 border-t border-stone-100">
                        {cancellingOrderId === order.id ? (
                          <div className="p-3 bg-stone-50 border border-rose-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-rose-900">
                                Reason for Order Cancellation:
                              </span>
                              <button
                                onClick={() => setCancellingOrderId(null)}
                                className="text-xs text-stone-400 hover:text-stone-700 cursor-pointer"
                              >
                                Close
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                'Ordered wrong item by mistake',
                                'Incorrect delivery address',
                                'Need a different size or color',
                                'Personal reason',
                              ].map(reason => (
                                <button
                                  key={reason}
                                  type="button"
                                  onClick={() => setCustomerCancelReason(reason)}
                                  className="text-[10px] px-2 py-0.5 rounded-full border border-stone-200 bg-white text-stone-700 hover:border-rose-300 cursor-pointer"
                                >
                                  {reason}
                                </button>
                              ))}
                            </div>
                            <textarea
                              rows={2}
                              value={customerCancelReason}
                              onChange={e => setCustomerCancelReason(e.target.value)}
                              placeholder="Please explain why you want to cancel..."
                              className="w-full text-xs p-2 bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:border-rose-700"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setCancellingOrderId(null)}
                                className="px-3 py-1 text-xs text-stone-600 hover:bg-stone-200 rounded-lg cursor-pointer"
                              >
                                Back
                              </button>
                              <button
                                onClick={() => handleCustomerCancel(order.id)}
                                disabled={isCancelling}
                                className="px-3 py-1 text-xs font-bold bg-rose-800 hover:bg-rose-900 text-white rounded-lg disabled:opacity-50 cursor-pointer"
                              >
                                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setCancellingOrderId(order.id);
                              setCustomerCancelReason('');
                            }}
                            className="text-xs text-rose-700 hover:text-rose-900 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <span>Need to cancel this order?</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Logged-in Customer's Recent Orders section */}
          {currentUser && (
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-rose-800" />
                  <span>Recent Orders in Your Account</span>
                </span>
                <span className="text-[11px] text-stone-500">
                  {userOrders.length} order{userOrders.length === 1 ? '' : 's'} found
                </span>
              </div>

              {isLoadingUserOrders ? (
                <div className="text-center py-6 text-xs text-stone-400">
                  Loading order history...
                </div>
              ) : userOrders.length === 0 ? (
                <div className="text-center py-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-xs text-stone-500">
                  You haven't placed any orders yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {userOrders.map(o => (
                    <div
                      key={o.id}
                      onClick={() => {
                        setSearchQuery(o.orderNumber);
                        handleTrackOrder(o.orderNumber);
                      }}
                      className="p-3 rounded-xl border border-stone-200 hover:border-rose-400 bg-stone-50/50 hover:bg-rose-50/30 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">
                          <ShoppingCart className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-stone-900 group-hover:text-rose-900">
                              {o.orderNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(
                                o.status
                              )}`}
                            >
                              {o.status}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-500">
                            {new Date(o.createdAt).toLocaleDateString()} • {o.items.length} item{o.items.length === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-extrabold text-stone-900 block">
                          ৳{o.total.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-rose-700 font-semibold group-hover:underline">
                          View details →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Help & Support note */}
          <div className="pt-4 text-center text-xs text-stone-500 space-y-1">
            <p className="font-medium text-stone-700">Need assistance with your delivery or order?</p>
            <p className="text-rose-900 font-bold">
              Helpline: <a href="tel:01929600998" className="underline hover:text-rose-950">01929600998</a> • Support: <a href="mailto:friendsapparelcare@gmail.com" className="underline hover:text-rose-950">friendsapparelcare@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
