import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, Category, District, CartItem, Order, User, HeroSlide } from '../types';
import { api } from '../services/api';
import { auth, googleAuthProvider } from '../lib/firebase';
import {
  registerCustomerInCloud,
  loginCustomerFromCloud,
  subscribeToLiveProducts,
  subscribeToLiveCategories,
  subscribeToLiveHeroSlides,
  seedCatalogToCloudIfEmpty,
  seedHeroSlidesIfEmpty,
} from '../services/firestoreService';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../data/initialProducts';
import { INITIAL_HERO_SLIDES } from '../data/initialHeroSlides';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

interface LocalUserRecord {
  user: User;
  password?: string;
}

function getLocalUsers(): LocalUserRecord[] {
  try {
    const saved = localStorage.getItem('fa_local_users');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveLocalUserRecord(user: User, password?: string) {
  try {
    const records = getLocalUsers();
    const cleanEmail = user.email.toLowerCase().trim();
    const existingIndex = records.findIndex(r => r.user.email.toLowerCase().trim() === cleanEmail);
    const newRecord: LocalUserRecord = { user, password };
    if (existingIndex >= 0) {
      records[existingIndex] = { ...records[existingIndex], user, ...(password ? { password } : {}) };
    } else {
      records.push(newRecord);
    }
    localStorage.setItem('fa_local_users', JSON.stringify(records));
  } catch {}
}

interface ShopContextType {
  // Products & Categories
  products: Product[];
  categories: Category[];
  isLoadingProducts: boolean;
  reloadProducts: () => Promise<void>;
  reloadCategories: () => Promise<void>;

  // Hero Banner Slides
  heroSlides: HeroSlide[];
  isLoadingHeroSlides: boolean;
  reloadHeroSlides: () => Promise<void>;

  // Districts
  districts: District[];
  isLoadingDistricts: boolean;
  reloadDistricts: () => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, size: string, color: string, quantity?: number) => void;
  updateCartQuantity: (index: number, quantity: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartItemCount: number;

  // Modals & Navigation
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  isOrderTrackerOpen: boolean;
  setIsOrderTrackerOpen: (open: boolean) => void;
  trackingOrderQuery: string;
  setTrackingOrderQuery: (query: string) => void;
  openOrderTracker: (query?: string) => void;
  activeView: 'home' | 'catalog' | 'admin' | 'product';
  setActiveView: (view: 'home' | 'catalog' | 'admin' | 'product') => void;
  openProductDetail: (product: Product) => void;

  // Filters & Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  selectedSize: string;
  setSelectedSize: (size: string) => void;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;

  // Toast
  toast: string | null;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Customer Authentication (SQL + Firebase)
  currentUser: User | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalTab: 'login' | 'register';
  setAuthModalTab: (tab: 'login' | 'register') => void;
  loginCustomer: (email: string, pass: string) => Promise<void>;
  registerCustomer: (email: string, pass: string, name?: string, phone?: string) => Promise<void>;
  googleSignIn: () => Promise<void>;
  customerLogout: () => void;

  // Admin session
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (logged: boolean) => void;
  adminLogout: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(INITIAL_HERO_SLIDES);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(true);
  const [isLoadingHeroSlides, setIsLoadingHeroSlides] = useState(false);

  // Customer User state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('fa_customer_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  // Cart state with localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('fa_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Admin auth state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fa_admin_token') === 'fa-admin-session-authenticated';
    } catch {
      return false;
    }
  });

  // View & Modals
  const [activeView, setActiveView] = useState<'home' | 'catalog' | 'admin' | 'product'>('home');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [trackingOrderQuery, setTrackingOrderQuery] = useState('');
  const [quickViewProduct, setQuickViewProductState] = useState<Product | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const openProductDetail = useCallback((product: Product) => {
    setQuickViewProductState(product);
    setActiveView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const setQuickViewProduct = useCallback((product: Product | null) => {
    setQuickViewProductState(product);
    if (product) {
      setActiveView('product');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const openOrderTracker = useCallback((query?: string) => {
    if (query) {
      setTrackingOrderQuery(query);
    }
    setIsOrderTrackerOpen(true);
  }, []);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [selectedSize, setSelectedSize] = useState('all');

  // Toast Notification
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('fa_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Customer user session save
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('fa_customer_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('fa_customer_user');
    }
  }, [currentUser]);

  // Load districts
  const reloadDistricts = useCallback(async () => {
    setIsLoadingDistricts(true);
    try {
      const data = await api.getDistricts();
      setDistricts(data);
    } catch (err) {
      console.error('Failed to load districts:', err);
    } finally {
      setIsLoadingDistricts(false);
    }
  }, []);

  // Load categories
  const reloadCategories = useCallback(async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  // Load products
  const reloadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Load hero slides
  const reloadHeroSlides = useCallback(async () => {
    setIsLoadingHeroSlides(true);
    try {
      const data = await api.getHeroSlides();
      if (data && data.length > 0) {
        setHeroSlides(data);
      }
    } catch (err) {
      console.error('Failed to load hero slides:', err);
    } finally {
      setIsLoadingHeroSlides(false);
    }
  }, []);

  // Initial load & Live Cloud Subscriptions for Products & Categories
  useEffect(() => {
    reloadDistricts();
    reloadCategories();
    reloadProducts();
    reloadHeroSlides();

    // Ensure Cloud Firestore has categories, products and hero slides seeded for universal access
    seedCatalogToCloudIfEmpty(INITIAL_CATEGORIES, INITIAL_PRODUCTS);
    seedHeroSlidesIfEmpty(INITIAL_HERO_SLIDES);

    // Live Real-Time Listener: Automatically syncs new products to ALL visitors across ALL devices
    const unsubscribeProducts = subscribeToLiveProducts((liveProds) => {
      if (liveProds && liveProds.length > 0) {
        setProducts(liveProds);
        setIsLoadingProducts(false);
        try {
          localStorage.setItem('fa_catalog_products', JSON.stringify(liveProds));
        } catch {}
      }
    });

    // Live Real-Time Listener: Automatically syncs new categories to ALL visitors across ALL devices
    const unsubscribeCategories = subscribeToLiveCategories((liveCats) => {
      if (liveCats && liveCats.length > 0) {
        setCategories(liveCats);
        try {
          localStorage.setItem('fa_catalog_categories', JSON.stringify(liveCats));
        } catch {}
      }
    });

    // Live Real-Time Listener: Automatically syncs hero slider changes to ALL visitors across ALL devices
    const unsubscribeHeroSlides = subscribeToLiveHeroSlides((liveSlides) => {
      if (liveSlides && liveSlides.length > 0) {
        setHeroSlides(liveSlides);
        setIsLoadingHeroSlides(false);
        try {
          localStorage.setItem('fa_hero_slides', JSON.stringify(liveSlides));
        } catch {}
      }
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeHeroSlides();
    };
  }, [reloadDistricts, reloadCategories, reloadProducts, reloadHeroSlides]);

  // Auth operations
  const loginCustomer = useCallback(async (email: string, pass: string) => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !pass) {
      throw new Error('Please provide both email and password.');
    }

    // 1. First, authenticate against Cloud Firestore (Allows login from ANY device, phone, laptop, or Netlify)
    try {
      const cloudUser = await loginCustomerFromCloud(cleanEmail, pass);
      if (cloudUser) {
        saveLocalUserRecord(cloudUser, pass);
        setCurrentUser(cloudUser);
        setIsAuthModalOpen(false);
        showToast(`Welcome back, ${cloudUser.name || cloudUser.email}!`);
        return;
      }
    } catch (cloudErr: any) {
      // If the error was incorrect password, throw immediately
      if (cloudErr?.message && cloudErr.message.toLowerCase().includes('incorrect password')) {
        throw cloudErr;
      }
    }

    // 2. Check local storage accounts (instant login if offline)
    const localUsers = getLocalUsers();
    const matchedLocal = localUsers.find(r => r.user.email.toLowerCase().trim() === cleanEmail);
    if (matchedLocal && matchedLocal.password === pass) {
      setCurrentUser(matchedLocal.user);
      setIsAuthModalOpen(false);
      showToast(`Welcome back, ${matchedLocal.user.name || matchedLocal.user.email}!`);
      return;
    }

    // 3. Try Firebase Auth (Client-side directly to Google Firebase)
    let firebaseUser: User | null = null;
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      if (cred.user) {
        firebaseUser = {
          id: cred.user.uid as any,
          uid: cred.user.uid,
          email: cred.user.email || cleanEmail,
          name: cred.user.displayName || matchedLocal?.user.name || cleanEmail.split('@')[0],
          phone: matchedLocal?.user.phone || '',
          role: 'customer',
        };
      }
    } catch (firebaseErr: any) {
      const code = firebaseErr?.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        // Will check backend API and local password before erroring
      }
    }

    if (firebaseUser) {
      try {
        await api.firebaseSync({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.name,
        });
      } catch {}
      saveLocalUserRecord(firebaseUser, pass);
      setCurrentUser(firebaseUser);
      setIsAuthModalOpen(false);
      showToast(`Welcome back, ${firebaseUser.name || firebaseUser.email}!`);
      return;
    }

    // 4. Fallback: Try Backend API (/api/auth/login)
    try {
      const res = await api.login({ email: cleanEmail, password: pass });
      if (res?.user) {
        saveLocalUserRecord(res.user, pass);
        setCurrentUser(res.user);
        setIsAuthModalOpen(false);
        showToast(`Welcome back, ${res.user.name || res.user.email}!`);
        return;
      }
    } catch (apiErr: any) {
      if (apiErr.message && !apiErr.message.includes('non-JSON') && !apiErr.message.includes('unavailable')) {
        throw apiErr;
      }
    }

    if (matchedLocal) {
      throw new Error('Incorrect password. Please check your password and try again.');
    }

    throw new Error('No account found with this email or password incorrect. Please register an account.');
  }, [showToast]);

  const registerCustomer = useCallback(async (email: string, pass: string, name?: string, phone?: string) => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !pass) {
      throw new Error('Please provide both email and password.');
    }
    if (pass.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // 1. Immediately register in Cloud Firestore (Enables login from ANY device, phone, or computer)
    try {
      const cloudUser = await registerCustomerInCloud(cleanEmail, pass, name, phone);
      saveLocalUserRecord(cloudUser, pass);
      setCurrentUser(cloudUser);
      setIsAuthModalOpen(false);
      showToast('Registration successful! Welcome to Friends Apparel.');

      // Also register in Firebase Auth and local/api in the background
      try {
        await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      } catch {}
      try {
        await api.register({ email: cleanEmail, password: pass, name, phone });
      } catch {}

      return;
    } catch (cloudErr: any) {
      if (cloudErr?.message && cloudErr.message.toLowerCase().includes('already exists')) {
        throw cloudErr;
      }
      console.warn('Cloud registration error, proceeding with fallbacks:', cloudErr);
    }

    let createdUser: User | null = null;

    // 2. Fallback: Firebase Authentication (Client-side)
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (cred.user) {
        if (name?.trim()) {
          try {
            await updateProfile(cred.user, { displayName: name.trim() });
          } catch {}
        }
        createdUser = {
          id: cred.user.uid as any,
          uid: cred.user.uid,
          email: cred.user.email || cleanEmail,
          name: name?.trim() || cred.user.displayName || cleanEmail.split('@')[0],
          phone: phone?.trim() || '',
          role: 'customer',
          createdAt: new Date().toISOString(),
        };
      }
    } catch (firebaseErr: any) {
      const code = firebaseErr?.code;
      if (code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please sign in instead.');
      } else if (code === 'auth/weak-password') {
        throw new Error('Password must be at least 6 characters long.');
      } else if (code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }
    }

    // If Firebase Auth succeeded:
    if (createdUser) {
      try {
        await api.firebaseSync({
          uid: createdUser.uid,
          email: createdUser.email,
          name: createdUser.name,
        });
      } catch {}
      saveLocalUserRecord(createdUser, pass);
      setCurrentUser(createdUser);
      setIsAuthModalOpen(false);
      showToast('Registration successful! Welcome to Friends Apparel.');
      return;
    }

    // 3. Fallback: Try backend API (/api/auth/register)
    try {
      const res = await api.register({ email: cleanEmail, password: pass, name, phone });
      if (res?.user) {
        saveLocalUserRecord(res.user, pass);
        setCurrentUser(res.user);
        setIsAuthModalOpen(false);
        showToast('Registration successful! Welcome to Friends Apparel.');
        return;
      }
    } catch (apiErr: any) {
      if (apiErr.message && !apiErr.message.includes('non-JSON') && !apiErr.message.includes('unavailable')) {
        throw apiErr;
      }
    }

    // 4. Fallback: Local customer account storage
    const localUsers = getLocalUsers();
    const existing = localUsers.find(r => r.user.email.toLowerCase().trim() === cleanEmail);
    if (existing) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    const localUser: User = {
      id: ('usr-' + Date.now()) as any,
      uid: 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      email: cleanEmail,
      name: name?.trim() || cleanEmail.split('@')[0],
      phone: phone?.trim() || '',
      role: 'customer',
      createdAt: new Date().toISOString(),
    };

    saveLocalUserRecord(localUser, pass);
    setCurrentUser(localUser);
    setIsAuthModalOpen(false);
    showToast('Registration successful! Welcome to Friends Apparel.');
  }, [showToast]);

  const googleSignIn = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      let userData: User = {
        id: user.uid as any,
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || 'Customer',
        role: 'customer',
      };
      try {
        const res = await api.firebaseSync({
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || '',
        });
        if (res?.user) {
          userData = res.user;
        }
      } catch {}
      saveLocalUserRecord(userData);
      setCurrentUser(userData);
      setIsAuthModalOpen(false);
      showToast(`Signed in as ${user.displayName || user.email}`);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      showToast(err.message || 'Google sign-in failed');
    }
  }, [showToast]);

  const customerLogout = useCallback(() => {
    setCurrentUser(null);
    try {
      firebaseSignOut(auth);
    } catch (e) {
      console.error(e);
    }
    showToast('You have been logged out.');
  }, [showToast]);

  // Cart operations
  const addToCart = useCallback((product: Product, size: string, color: string, quantity = 1) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && item.size === size && item.color === color
      );
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantity;
        return next;
      }
      return [...prev, { product, size, color, quantity }];
    });
    showToast(`Added "${product.name}" to cart`);
  }, [showToast]);

  const updateCartQuantity = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    setCart(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index].quantity = quantity;
      }
      return next;
    });
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
    showToast('Item removed from cart');
  }, [showToast]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Wishlist inert stub
  const wishlist: string[] = [];
  const toggleWishlist = useCallback((_productId: string) => {}, []);

  const adminLogout = useCallback(() => {
    localStorage.removeItem('fa_admin_token');
    setIsAdminLoggedIn(false);
    showToast('Admin logged out');
  }, [showToast]);

  return (
    <ShopContext.Provider
      value={{
        products,
        categories,
        isLoadingProducts,
        reloadProducts,
        reloadCategories,
        heroSlides,
        isLoadingHeroSlides,
        reloadHeroSlides,
        districts,
        isLoadingDistricts,
        reloadDistricts,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartItemCount,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isOrderTrackerOpen,
        setIsOrderTrackerOpen,
        trackingOrderQuery,
        setTrackingOrderQuery,
        openOrderTracker,
        quickViewProduct,
        setQuickViewProduct,
        openProductDetail,
        currentOrder,
        setCurrentOrder,
        activeView,
        setActiveView,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        sortBy,
        setSortBy,
        selectedSize,
        setSelectedSize,
        wishlist,
        toggleWishlist,
        toast,
        toastMessage: toast,
        showToast,
        currentUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        loginCustomer,
        registerCustomer,
        googleSignIn,
        customerLogout,
        isAdminLoggedIn,
        setIsAdminLoggedIn,
        adminLogout,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within a ShopProvider');
  return context;
};
