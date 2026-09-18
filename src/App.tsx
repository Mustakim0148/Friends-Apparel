import React, { useEffect } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Header } from './components/Header';
import { CategoryNav } from './components/CategoryNav';
import { HomePage } from './components/HomePage';
import { ProductCatalog } from './components/ProductCatalog';
import { AdminPanel } from './components/AdminPanel';
import { CartDrawer } from './components/CartDrawer';
import { ProductDetailPage } from './components/ProductDetailPage';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { AuthModal } from './components/AuthModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { Footer } from './components/Footer';
import { CheckCircle2, MessageCircle, Phone } from 'lucide-react';

const ShopApp: React.FC = () => {
  const { activeView, setActiveView, toastMessage } = useShop();

  // Handle URL hash or path for direct admin navigation (e.g. #admin or /admin)
  useEffect(() => {
    // Ensure favicon is active in browser tab
    const existingIcon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (existingIcon) {
      existingIcon.href = '/favicon.ico?v=2';
    }

    const handleHash = () => {
      if (window.location.hash === '#admin' || window.location.pathname.includes('/admin')) {
        setActiveView('admin');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [setActiveView]);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-rose-100 selection:text-rose-900 font-sans antialiased overflow-x-hidden w-full">
      {/* Top Header */}
      <Header />

      {/* Category Navigation Bar (shown on storefront pages) */}
      {activeView !== 'admin' && <CategoryNav />}

      {/* Main View Router */}
      <main className="flex-1 overflow-x-hidden">
        {activeView === 'admin' && <AdminPanel />}
        {activeView === 'catalog' && <ProductCatalog />}
        {activeView === 'home' && <HomePage />}
        {activeView === 'product' && <ProductDetailPage />}
      </main>

      {/* Footer */}
      {activeView !== 'admin' && <Footer />}

      {/* Modals & Drawers */}
      <CartDrawer />
      <CheckoutModal />
      <OrderConfirmationModal />
      <OrderTrackerModal />
      <AuthModal />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce max-w-[90vw]">
          <div className="bg-stone-900/95 backdrop-blur-md text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Floating Quick Support Buttons (WhatsApp + Call) */}
      {activeView !== 'admin' && (
        <div className="fixed bottom-4 right-3 sm:bottom-5 sm:right-5 z-30 flex flex-col items-end gap-2">
          {/* Direct Call Button */}
          <a
            href="tel:01929600998"
            id="floating-call-btn"
            className="group relative flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-full bg-rose-800 hover:bg-rose-900 text-white shadow-lg transition-all hover:scale-105 cursor-pointer text-xs font-bold"
            title="Call Support: 01929600998"
          >
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            <span className="hidden sm:inline">01929600998</span>
          </a>

          {/* WhatsApp Button */}
          <a
            href="https://wa.me/8801929600998"
            target="_blank"
            rel="noopener noreferrer"
            id="floating-whatsapp-btn"
            className="group flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-lg transition-all hover:scale-105 cursor-pointer text-xs font-bold"
            title="Chat on WhatsApp: +8801929600998"
            aria-label="WhatsApp Support +8801929600998"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-[#25D366] shrink-0" />
            <span className="font-bold text-white tracking-wide text-xs">WhatsApp</span>
          </a>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ShopProvider>
      <ShopApp />
    </ShopProvider>
  );
}
