import React, { useState } from 'react';
import { Search, ShoppingCart, Heart, ShieldCheck, X, User as UserIcon, LogOut, Truck, Package } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const Header: React.FC = () => {
  const {
    cartItemCount,
    cartSubtotal,
    setIsCartOpen,
    wishlist,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    activeView,
    setActiveView,
    currentUser,
    setIsAuthModalOpen,
    setAuthModalTab,
    customerLogout,
    openOrderTracker,
  } = useShop();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    if (activeView !== 'catalog') {
      setActiveView('catalog');
    }
  };

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    if (activeView !== 'catalog') {
      setActiveView('catalog');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      {/* Main Navigation Bar - Clean, Minimalist & Elegant */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between gap-2 sm:gap-6">
          {/* Logo & Brand Name */}
          <button
            onClick={() => {
              setActiveView('home');
              setSelectedCategory('all');
              setSearchQuery('');
              setLocalSearch('');
            }}
            id="brand-logo-button"
            className="flex items-center gap-2 sm:gap-3 shrink-0 text-left group focus:outline-hidden cursor-pointer"
          >
            <img
              src="/logo.png"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('catbox.moe')) {
                  target.src = 'https://files.catbox.moe/nqnijd.png';
                }
              }}
              alt="Friends Apparel"
              className="h-8 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div>
              <span className="font-serif text-base sm:text-2xl font-bold tracking-tight text-stone-900 group-hover:text-rose-900 transition-colors">
                Friends Apparel
              </span>
            </div>
          </button>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xl items-center border border-stone-200 hover:border-rose-300 focus-within:border-rose-700 rounded-full bg-stone-50 transition-all overflow-hidden shadow-2xs"
          >
            {/* Category selector inside search */}
            <select
              value={selectedCategory}
              onChange={handleCategorySelect}
              className="bg-stone-100 text-stone-700 text-xs font-medium py-2.5 px-3 border-r border-stone-200 focus:outline-hidden cursor-pointer hover:bg-stone-200/70"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                placeholder="Search sarees, kurtis, abayas, dresses..."
                className="w-full bg-transparent py-2 px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalSearch('');
                    setSearchQuery('');
                  }}
                  className="p-1 mr-1 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              id="search-submit-btn"
              className="bg-rose-800 hover:bg-rose-900 text-white px-5 py-2.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </form>

          {/* Action Controls with Login/Register placed in the far-right corner */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Wishlist Button */}
            <button
              onClick={() => {
                setActiveView('catalog');
              }}
              title="Wishlist"
              id="nav-wishlist-button"
              className="relative p-1.5 sm:p-2 text-stone-700 hover:text-rose-700 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
            >
              <Heart className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Track Order Button */}
            <button
              onClick={() => openOrderTracker()}
              id="header-track-order-button"
              title="Track Order"
              className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 text-stone-700 hover:text-rose-800 hover:bg-rose-50 rounded-full border border-stone-200/80 transition-colors cursor-pointer text-xs font-semibold"
            >
              <Truck className="w-4 h-4 text-rose-700 shrink-0" />
              <span className="hidden sm:inline">Track</span>
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              id="nav-cart-button"
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100/80 text-rose-900 border border-rose-200 p-1.5 sm:px-3.5 sm:py-1.5 rounded-full transition-all cursor-pointer shadow-2xs group"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-4.5 h-4.5 text-rose-700 transition-transform group-hover:scale-110" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-xs font-bold text-stone-900">৳{cartSubtotal.toLocaleString()}</span>
            </button>

            {/* Admin Panel Quick Link */}
            <button
              onClick={() => setActiveView('admin')}
              id="header-admin-link"
              title="Admin Panel"
              className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${
                activeView === 'admin'
                  ? 'bg-rose-800 text-white'
                  : 'text-stone-400 hover:text-rose-800 hover:bg-rose-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Divider */}
            <div className="hidden sm:block h-5 w-px bg-stone-200 mx-0.5 sm:mx-1" />

            {/* Far-Right Corner: Login / Register or Customer Account */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(prev => !prev)}
                  id="user-menu-button"
                  className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-3 sm:py-1.5 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-800 hover:text-rose-900 border border-stone-200 transition-colors text-xs font-semibold cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-700 text-white flex items-center justify-center text-[10px] font-bold uppercase">
                    {(currentUser.name || currentUser.email)[0]}
                  </div>
                  <span className="hidden sm:inline-block max-w-[100px] truncate">
                    {currentUser.name || currentUser.email.split('@')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="font-bold text-stone-900 truncate">{currentUser.name || 'Customer'}</p>
                      <p className="text-stone-500 text-[11px] truncate">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        openOrderTracker();
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-stone-700 hover:bg-rose-50 hover:text-rose-900 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-rose-700" />
                      <span>My Orders & History</span>
                    </button>

                    <button
                      onClick={() => {
                        customerLogout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer border-t border-stone-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center border border-stone-200 hover:border-rose-300 rounded-full bg-stone-50 transition-all p-0.5 shadow-2xs">
                <button
                  onClick={() => {
                    setAuthModalTab('login');
                    setIsAuthModalOpen(true);
                  }}
                  id="header-login-btn"
                  className="p-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold text-stone-700 hover:text-white hover:bg-rose-800 transition-all cursor-pointer flex items-center gap-1"
                  title="Login"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Login</span>
                </button>
                <span className="text-stone-300 text-xs select-none hidden sm:inline">/</span>
                <button
                  onClick={() => {
                    setAuthModalTab('register');
                    setIsAuthModalOpen(true);
                  }}
                  id="header-register-btn"
                  className="hidden sm:inline px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-rose-900 hover:text-white hover:bg-rose-800 transition-all cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Input */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-2.5 flex md:hidden items-center border border-stone-200 rounded-full bg-stone-50 overflow-hidden shadow-2xs"
        >
          <input
            type="text"
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            placeholder="Search sarees, kurtis, abayas..."
            className="w-full bg-transparent py-2 px-3 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden"
          />
          <button
            type="submit"
            className="bg-rose-800 text-white px-3.5 py-2 text-xs font-medium flex items-center gap-1"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </header>
  );
};
