import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Package,
  FolderTree,
  ShoppingBag,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  Search,
  RotateCcw,
  Save,
  LogOut,
  AlertCircle,
  DollarSign,
  ArrowLeft,
  ChevronDown,
  Eye,
  EyeOff,
  Check,
  Users,
  UserCheck,
  X,
  RefreshCw,
  Radio,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { Product, Category, District, Order, OrderStatus, User } from '../types';

export const AdminPanel: React.FC = () => {
  const {
    isAdminLoggedIn,
    setIsAdminLoggedIn,
    adminLogout,
    setActiveView,
    districts,
    reloadDistricts,
    categories,
    reloadCategories,
    products,
    reloadProducts,
    showToast,
  } = useShop();

  // Login form state
  const [password, setPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin active sub-tab
  const [adminTab, setAdminTab] = useState<'dashboard' | 'orders' | 'products' | 'categories' | 'districts' | 'accounts'>('dashboard');

  // Accounts state
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [deletingUserUid, setDeletingUserUid] = useState<string | null>(null);

  // Cancellation modal state
  const [cancellationModalOrder, setCancellationModalOrder] = useState<Order | null>(null);
  const [cancellationReasonInput, setCancellationReasonInput] = useState('');
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');

  // District management state
  const [districtSearch, setDistrictSearch] = useState('');
  const [districtDivisionFilter, setDistrictDivisionFilter] = useState('all');
  const [districtEdits, setDistrictEdits] = useState<{ [id: string]: number }>({});
  const [isSavingDistricts, setIsSavingDistricts] = useState(false);

  // Product modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    categoryId: 'sarees',
    subcategory: '',
    imagesText: '',
    sizesText: 'S, M, L, XL',
    colorsText: 'Red: #be123c, Green: #047857',
    stock: '15',
    isFeatured: false,
    fabric: '',
    care: '',
  });

  // Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
  });

  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const initialLoadRef = useRef(true);

  // Play audio chime when a new live order arrives
  const playNewOrderSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  };

  // Load orders
  const loadOrders = async () => {
    setIsSyncingLive(true);
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setIsSyncingLive(false);
    }
  };

  // Load user accounts
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await api.getUsers();
      setUsersList(data);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!isAdminLoggedIn) return;

    // 1. Initial loads
    loadOrders();
    loadUsers();

    // 2. Real-time Live Response subscription across ALL devices
    const unsubscribe = api.subscribeToOrders((updatedOrders) => {
      setOrders((prev) => {
        // If not first load, check if new orders arrived from customer devices
        if (!initialLoadRef.current && updatedOrders.length > prev.length) {
          const newest = updatedOrders[0];
          playNewOrderSound();
          showToast(`🔔 New Live Order! ${newest.orderNumber} from ${newest.customerName} (৳${newest.total})`);
        }
        initialLoadRef.current = false;
        return updatedOrders;
      });
    });

    // 3. User account polling every 8 seconds for multi-device account sync
    const userInterval = setInterval(() => {
      loadUsers();
    }, 8000);

    return () => {
      unsubscribe();
      clearInterval(userInterval);
    };
  }, [isAdminLoggedIn]);

  // Sync districtEdits with loaded districts
  useEffect(() => {
    const edits: { [id: string]: number } = {};
    for (const d of districts) {
      edits[d.id] = d.charge;
    }
    setDistrictEdits(edits);
  }, [districts]);

  // Handle Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await api.adminLogin(password);
      if (res.success && res.token) {
        localStorage.setItem('fa_admin_token', res.token);
        setIsAdminLoggedIn(true);
        showToast('Welcome back, Admin!');
        loadOrders();
        loadUsers();
      } else {
        setLoginError(res.message || 'Invalid password. Please check and try again.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Failed to authenticate');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus, cancellationReason?: string) => {
    try {
      const updated = await api.updateOrderStatus(orderId, newStatus, cancellationReason);
      setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
      showToast(`Order status updated to "${newStatus}"`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status');
    }
  };

  // Order status selection interceptor
  const handleOrderSelectStatus = (order: Order, newStatus: OrderStatus) => {
    if (newStatus === 'Cancelled') {
      setCancellationModalOrder(order);
      setCancellationReasonInput(order.cancellationReason || '');
    } else {
      handleUpdateOrderStatus(order.id, newStatus);
    }
  };

  // Confirm order cancellation with reason
  const handleConfirmCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellationModalOrder) return;

    if (!cancellationReasonInput.trim()) {
      showToast('Please provide a reason for cancellation');
      return;
    }

    setIsSubmittingCancellation(true);
    try {
      await handleUpdateOrderStatus(cancellationModalOrder.id, 'Cancelled', cancellationReasonInput.trim());
      setCancellationModalOrder(null);
      setCancellationReasonInput('');
      showToast('Order cancelled and reason recorded successfully');
    } finally {
      setIsSubmittingCancellation(false);
    }
  };

  // Delete User Account
  const handleDeleteUser = async (user: User) => {
    if (user.role === 'admin' || user.email === 'admin@friendsapparel.com') {
      showToast('Default Admin account cannot be deleted');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete user account "${user.name || user.email}"? This will permanently remove their profile.`
    );
    if (!confirmDelete) return;

    setDeletingUserUid(user.uid);
    try {
      await api.deleteUser(user.uid);
      setUsersList(prev => prev.filter(u => u.uid !== user.uid));
      showToast(`User account "${user.name || user.email}" has been deleted`);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user account');
    } finally {
      setDeletingUserUid(null);
    }
  };

  // District Delivery Charge Edits
  const handleDistrictChargeChange = (id: string, value: string) => {
    const num = Number(value);
    setDistrictEdits(prev => ({
      ...prev,
      [id]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSaveSingleDistrict = async (districtId: string) => {
    const newCharge = districtEdits[districtId];
    if (newCharge === undefined) return;

    try {
      await api.updateDistrictCharge(districtId, newCharge);
      await reloadDistricts();
      showToast(`Updated charge for district to ৳${newCharge}`);
    } catch (err: any) {
      showToast(err.message || 'Error updating charge');
    }
  };

  const handleSaveAllDistricts = async () => {
    setIsSavingDistricts(true);
    try {
      const updates = Object.entries(districtEdits).map(([id, charge]) => ({
        id,
        charge: Number(charge),
      }));
      await api.batchUpdateDistricts(updates);
      await reloadDistricts();
      showToast('All 64 district delivery charges saved successfully!');
    } catch (err: any) {
      showToast(err.message || 'Error saving charges');
    } finally {
      setIsSavingDistricts(false);
    }
  };

  const handleResetDistricts = async () => {
    if (!window.confirm('Reset all 64 districts to default rates? (Dhaka: ৳80, All others: ৳150)')) {
      return;
    }
    try {
      await api.resetDistricts();
      await reloadDistricts();
      showToast('Districts reset: Dhaka ৳80, others ৳150');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset districts');
    }
  };

  // Product Add / Edit
  const handleOpenProductModal = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setProductForm({
        name: prod.name,
        description: prod.description,
        price: prod.price.toString(),
        originalPrice: prod.originalPrice?.toString() || '',
        categoryId: prod.categoryId,
        subcategory: prod.subcategory || '',
        imagesText: prod.images.join('\n'),
        sizesText: prod.sizes.join(', '),
        colorsText: prod.colors.map(c => `${c.name}: ${c.hex}`).join(', '),
        stock: prod.stock.toString(),
        isFeatured: Boolean(prod.isFeatured),
        fabric: prod.fabric || '',
        care: prod.care || '',
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        categoryId: categories[0]?.id || 'sarees',
        subcategory: '',
        imagesText: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        sizesText: 'S, M, L, XL',
        colorsText: 'Ruby Red: #be123c, Royal Navy: #1e3a8a',
        stock: '15',
        isFeatured: false,
        fabric: '100% Combed Cotton',
        care: 'Machine wash delicate',
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const images = productForm.imagesText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const sizes = productForm.sizesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const colors = productForm.colorsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(pair => {
        const [name, hex] = pair.split(':').map(str => str.trim());
        return { name: name || 'Color', hex: hex || '#e11d48' };
      });

    const payload: Partial<Product> = {
      name: productForm.name,
      description: productForm.description,
      price: Number(productForm.price),
      originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
      categoryId: productForm.categoryId,
      subcategory: productForm.subcategory,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'],
      sizes: sizes.length > 0 ? sizes : ['Free Size'],
      colors: colors.length > 0 ? colors : [{ name: 'Standard', hex: '#e11d48' }],
      stock: Number(productForm.stock || 0),
      isFeatured: productForm.isFeatured,
      fabric: productForm.fabric,
      care: productForm.care,
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        showToast(`Product "${payload.name}" updated!`);
      } else {
        await api.createProduct(payload);
        showToast(`New product "${payload.name}" added!`);
      }
      setIsProductModalOpen(false);
      await reloadProducts();
      await reloadCategories();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) return;
    try {
      await api.deleteProduct(productId);
      await reloadProducts();
      await reloadCategories();
      showToast(`Product deleted`);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product');
    }
  };

  // Category Add / Edit / Delete
  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        image: cat.image || '',
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        slug: '',
        description: '',
        image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80',
      });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, categoryForm);
        showToast(`Category "${categoryForm.name}" updated!`);
      } else {
        await api.createCategory(categoryForm);
        showToast(`Category "${categoryForm.name}" created!`);
      }
      setIsCategoryModalOpen(false);
      await reloadCategories();
    } catch (err: any) {
      showToast(err.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!window.confirm(`Delete category "${catName}"?`)) return;
    try {
      await api.deleteCategory(catId);
      await reloadCategories();
      showToast(`Category deleted`);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category');
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const matchesStatus = orderFilterStatus === 'all' || o.status === orderFilterStatus;
    const matchesSearch =
      !orderSearch ||
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerPhone.includes(orderSearch) ||
      o.districtName.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filtered districts
  const filteredDistricts = districts.filter(d => {
    const matchesDivision = districtDivisionFilter === 'all' || d.division === districtDivisionFilter;
    const matchesSearch =
      !districtSearch ||
      d.name.toLowerCase().includes(districtSearch.toLowerCase()) ||
      d.bnName.includes(districtSearch);
    return matchesDivision && matchesSearch;
  });

  // Statistics
  const totalRevenue = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.total, 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
  const shippedOrdersCount = orders.filter(o => o.status === 'Shipped').length;
  const deliveredOrdersCount = orders.filter(o => o.status === 'Delivered').length;

  // If not logged in, show modern login card
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-rose-100 space-y-6">
          <div className="text-center space-y-2">
            <img
              src="https://files.catbox.moe/nqnijd.png"
              alt="Friends Apparel"
              className="h-14 mx-auto object-contain mb-2"
            />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Authentication</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              Friends Apparel Portal
            </h2>
            <p className="text-xs text-stone-500">
              Enter admin password to manage products, categories, orders, and 64 district delivery charges.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter admin password..."
                  autoComplete="current-password"
                  className="w-full pl-4 pr-11 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:border-rose-700 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                  tabIndex={-1}
                  title={showAdminPassword ? 'Hide password' : 'Show password'}
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              id="admin-login-submit"
              className="w-full py-3 bg-rose-800 hover:bg-rose-900 text-white font-bold text-sm rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLoggingIn ? 'Verifying...' : 'Login to Admin Panel'}</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => setActiveView('home')}
              className="text-xs text-stone-500 hover:text-stone-800 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Storefront</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen pb-16">
      {/* Admin Top Bar */}
      <div className="bg-stone-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://files.catbox.moe/nqnijd.png"
              alt="Friends Apparel Logo"
              className="h-8 w-auto object-contain bg-white/10 p-0.5 rounded"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-base sm:text-lg font-bold">Admin Console</h1>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>Live Response Active</span>
                </span>
              </div>
              <p className="text-[10px] text-stone-400">
                Friends Apparel • Dhaka ৳80 | 63 Districts ৳150 System • Real-Time Cloud Synced
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                loadOrders();
                loadUsers();
                showToast('Cloud database synchronized!');
              }}
              disabled={isSyncingLive}
              className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 border border-emerald-500/30"
              title="Click to manually refresh live orders and accounts from cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLive ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Sync Live</span>
            </button>

            <button
              onClick={() => setActiveView('home')}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>View Storefront</span>
            </button>

            <button
              onClick={adminLogout}
              className="p-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="bg-stone-950 border-t border-stone-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-1 sm:space-x-2 py-1.5 overflow-x-auto">
            <button
              onClick={() => setAdminTab('dashboard')}
              id="admin-tab-dashboard"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === 'dashboard' ? 'bg-rose-800 text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setAdminTab('orders')}
              id="admin-tab-orders"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === 'orders' ? 'bg-rose-800 text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Orders ({orders.length})</span>
              {pendingOrdersCount > 0 && (
                <span className="bg-amber-500 text-stone-950 px-1.5 py-0.2 rounded-full text-[10px]">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setAdminTab('districts')}
              id="admin-tab-districts"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === 'districts' ? 'bg-rose-800 text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>64 Districts Delivery Charges</span>
              <span className="text-[10px] bg-rose-600/30 text-rose-300 px-1.5 rounded font-mono">
                64
              </span>
            </button>

            <button
              onClick={() => setAdminTab('products')}
              id="admin-tab-products"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === 'products' ? 'bg-rose-800 text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Products ({products.length})</span>
            </button>

            <button
              onClick={() => setAdminTab('categories')}
              id="admin-tab-categories"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === 'categories' ? 'bg-rose-800 text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Categories ({categories.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Admin Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ==================== TAB 1: DASHBOARD ==================== */}
        {adminTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
                <div className="flex items-center justify-between text-stone-500 text-xs mb-2">
                  <span>Total Sales Revenue</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-stone-900">
                  ৳{totalRevenue.toLocaleString()}
                </div>
                <p className="text-[11px] text-stone-400 mt-1">Excludes cancelled orders</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
                <div className="flex items-center justify-between text-stone-500 text-xs mb-2">
                  <span>Total Orders</span>
                  <ShoppingBag className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-stone-900">
                  {orders.length}
                </div>
                <p className="text-[11px] text-amber-700 font-semibold mt-1">
                  {pendingOrdersCount} Pending fulfillment
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
                <div className="flex items-center justify-between text-stone-500 text-xs mb-2">
                  <span>Active Catalog</span>
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-stone-900">
                  {products.length} Products
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Across {categories.length} categories
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
                <div className="flex items-center justify-between text-stone-500 text-xs mb-2">
                  <span>Districts Configured</span>
                  <MapPin className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-stone-900">
                  64 Districts
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                  Dhaka: ৳80 | Others: ৳150
                </p>
              </div>
            </div>

            {/* Quick Actions & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders Overview */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base font-bold text-stone-900">
                    Recent Customer Orders
                  </h3>
                  <button
                    onClick={() => setAdminTab('orders')}
                    className="text-xs font-bold text-rose-800 hover:underline"
                  >
                    View All Orders →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-400 font-medium">
                        <th className="pb-2">Order #</th>
                        <th className="pb-2">Customer</th>
                        <th className="pb-2">District</th>
                        <th className="pb-2">Total</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id} className="py-2.5">
                          <td className="py-2.5 font-mono font-bold text-stone-900">{o.orderNumber}</td>
                          <td className="py-2.5">{o.customerName}</td>
                          <td className="py-2.5 text-stone-600">{o.districtName}</td>
                          <td className="py-2.5 font-bold">৳{o.total.toLocaleString()}</td>
                          <td className="py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                o.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-900'
                                  : o.status === 'Delivered'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : o.status === 'Cancelled'
                                  ? 'bg-rose-100 text-rose-900'
                                  : 'bg-blue-100 text-blue-900'
                              }`}
                            >
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Delivery Charge System Spotlight */}
              <div className="bg-gradient-to-br from-rose-900 to-rose-950 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-bold mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>Single Source of Truth</span>
                  </div>
                  <h3 className="font-serif text-lg font-bold">
                    64 Districts Delivery Rate Engine
                  </h3>
                  <p className="text-xs text-rose-100/80 mt-2 leading-relaxed">
                    Friends Apparel uses a dedicated live database table for all 64 Bangladesh districts. Any price adjustments you make here reflect instantaneously on customer checkouts!
                  </p>
                  <div className="mt-4 p-3 rounded-xl bg-white/10 text-xs space-y-1">
                    <p>• <strong>Dhaka Division:</strong> Default ৳80</p>
                    <p>• <strong>All other 63 Districts:</strong> Default ৳150</p>
                  </div>
                </div>

                <button
                  onClick={() => setAdminTab('districts')}
                  className="mt-6 w-full py-2.5 px-4 rounded-xl bg-white text-rose-950 hover:bg-rose-50 font-bold text-xs transition-colors text-center cursor-pointer"
                >
                  Manage District Charges →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: ORDERS MANAGEMENT ==================== */}
        {adminTab === 'orders' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    placeholder="Search by name, phone, order #, district..."
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {['all', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(st => (
                  <button
                    key={st}
                    onClick={() => setOrderFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      orderFilterStatus === st
                        ? 'bg-rose-800 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {st === 'all' ? 'All Orders' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200">
                    <tr>
                      <th className="p-3.5">Order Details</th>
                      <th className="p-3.5">Customer & Delivery</th>
                      <th className="p-3.5">Items</th>
                      <th className="p-3.5">Delivery Fee</th>
                      <th className="p-3.5">Total Amount</th>
                      <th className="p-3.5">Status Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-stone-400">
                          No matching orders found.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                          {/* Order Details */}
                          <td className="p-3.5 align-top">
                            <span className="font-mono font-bold text-sm text-stone-900 block">
                              {order.orderNumber}
                            </span>
                            <span className="text-[11px] text-stone-500 block mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="inline-block mt-1 uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                              {order.paymentMethod.toUpperCase()}
                            </span>
                          </td>

                          {/* Customer & Address */}
                          <td className="p-3.5 align-top">
                            <span className="font-semibold text-stone-900 block">{order.customerName}</span>
                            <span className="text-stone-600 block">{order.customerPhone}</span>
                            <span className="text-stone-500 text-[11px] block mt-1 max-w-xs line-clamp-2">
                              {order.customerAddress}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-rose-800 font-semibold mt-1">
                              <MapPin className="w-3 h-3" />
                              <span>{order.districtName}</span>
                            </span>
                            {order.notes && (
                              <p className="text-[10px] text-amber-700 bg-amber-50 p-1 rounded mt-1">
                                Note: {order.notes}
                              </p>
                            )}
                          </td>

                          {/* Items */}
                          <td className="p-3.5 align-top">
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <img src={item.productImage} alt="" className="w-6 h-8 object-cover rounded bg-stone-100" />
                                  <div className="text-[11px]">
                                    <span className="font-medium text-stone-900 truncate block max-w-36">
                                      {item.productName}
                                    </span>
                                    <span className="text-stone-500">
                                      {item.size} • Qty: {item.quantity}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Delivery fee */}
                          <td className="p-3.5 align-top font-semibold text-stone-700">
                            ৳{order.deliveryCharge}
                          </td>

                          {/* Total */}
                          <td className="p-3.5 align-top">
                            <span className="font-extrabold text-sm text-stone-900">
                              ৳{order.total.toLocaleString()}
                            </span>
                          </td>

                          {/* Status Dropdown */}
                          <td className="p-3.5 align-top">
                            <select
                              value={order.status}
                              onChange={e => handleOrderSelectStatus(order, e.target.value as OrderStatus)}
                              className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-hidden ${
                                order.status === 'Pending'
                                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                                  : order.status === 'Processing'
                                  ? 'bg-blue-50 border-blue-300 text-blue-900'
                                  : order.status === 'Shipped'
                                  ? 'bg-purple-50 border-purple-300 text-purple-900'
                                  : order.status === 'Delivered'
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                  : 'bg-rose-50 border-rose-300 text-rose-900'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>

                            {order.status === 'Cancelled' && (
                              <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-left max-w-[220px]">
                                <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-rose-800 mb-0.5">
                                  <span>Cancellation Reason:</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCancellationModalOrder(order);
                                      setCancellationReasonInput(order.cancellationReason || '');
                                    }}
                                    className="text-rose-700 hover:text-rose-950 underline text-[10px] cursor-pointer font-bold"
                                  >
                                    Edit
                                  </button>
                                </div>
                                <p className="text-[11px] text-stone-700 font-medium break-words leading-tight">
                                  {order.cancellationReason || 'No reason specified'}
                                </p>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: 64 DISTRICTS DELIVERY CHARGE MANAGER ==================== */}
        {adminTab === 'districts' && (
          <div className="space-y-4">
            {/* Districts Top Action Header */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-700" />
                  <h2 className="font-serif text-lg font-bold text-stone-900">
                    District Delivery Charges (All 64 Districts)
                  </h2>
                </div>
                <p className="text-xs text-stone-500 mt-1 max-w-xl">
                  Defaults: <strong>Dhaka = ৳80</strong>, <strong>All other 63 districts = ৳150</strong>.
                  Changes are persisted to the database and will reflect immediately on the storefront checkout page.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleResetDistricts}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Reset to Dhaka ৳80 and others ৳150"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Defaults</span>
                </button>

                <button
                  onClick={handleSaveAllDistricts}
                  disabled={isSavingDistricts}
                  className="px-4 py-2 rounded-xl bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingDistricts ? 'Saving...' : 'Save All Changes'}</span>
                </button>
              </div>
            </div>

            {/* Filter & Search */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={districtSearch}
                  onChange={e => setDistrictSearch(e.target.value)}
                  placeholder="Search district name (e.g. Sylhet, Bogra, Dhaka)..."
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Division selector */}
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs font-semibold text-stone-500 shrink-0">Division:</span>
                {['all', 'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh'].map(div => (
                  <button
                    key={div}
                    onClick={() => setDistrictDivisionFilter(div)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      districtDivisionFilter === div
                        ? 'bg-rose-800 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {div}
                  </button>
                ))}
              </div>
            </div>

            {/* Districts Grid Table */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200">
                    <tr>
                      <th className="p-3.5">#</th>
                      <th className="p-3.5">District Name</th>
                      <th className="p-3.5">Division</th>
                      <th className="p-3.5">Delivery Charge (৳)</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredDistricts.map((d, index) => {
                      const currentCharge = districtEdits[d.id] ?? d.charge;
                      const hasChanged = currentCharge !== d.charge;

                      return (
                        <tr
                          key={d.id}
                          className={`hover:bg-rose-50/30 transition-colors ${
                            d.id === 'dhaka' ? 'bg-amber-50/40 font-semibold' : ''
                          }`}
                        >
                          <td className="p-3.5 text-stone-400">{index + 1}</td>
                          <td className="p-3.5 font-bold text-stone-900">
                            {d.name}
                            {d.id === 'dhaka' && (
                              <span className="ml-2 text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-extrabold">
                                Inside Dhaka (৳80 default)
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-stone-500">{d.division}</td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-stone-500 font-bold">৳</span>
                              <input
                                type="number"
                                min="0"
                                max="1000"
                                value={currentCharge}
                                onChange={e => handleDistrictChargeChange(d.id, e.target.value)}
                                className={`w-24 px-2.5 py-1.5 rounded-lg border text-xs font-bold focus:outline-hidden ${
                                  hasChanged
                                    ? 'border-rose-600 bg-rose-50 text-rose-950 ring-1 ring-rose-300'
                                    : 'border-stone-200 bg-stone-50'
                                }`}
                              />
                            </div>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleSaveSingleDistrict(d.id)}
                              disabled={!hasChanged}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                hasChanged
                                  ? 'bg-rose-800 text-white hover:bg-rose-900 shadow-xs cursor-pointer'
                                  : 'bg-stone-100 text-stone-400 cursor-default'
                              }`}
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: PRODUCTS MANAGEMENT ==================== */}
        {adminTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-stone-900">
                Manage Products ({products.length})
              </h2>
              <button
                onClick={() => handleOpenProductModal()}
                id="admin-add-product-btn"
                className="px-4 py-2 rounded-xl bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200">
                    <tr>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Price</th>
                      <th className="p-3.5">Stock</th>
                      <th className="p-3.5">Sizes</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {products.map(prod => (
                      <tr key={prod.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.images[0]}
                              alt=""
                              className="w-10 h-12 object-cover rounded-lg bg-stone-100 border border-stone-200 shrink-0"
                            />
                            <div>
                              <span className="font-bold text-stone-900 block line-clamp-1">
                                {prod.name}
                              </span>
                              <span className="text-[11px] text-stone-500">
                                {prod.subcategory || 'Standard'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 uppercase font-semibold text-stone-600">
                          {prod.categoryId}
                        </td>
                        <td className="p-3.5 font-bold text-stone-900">
                          ৳{prod.price.toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              prod.stock > 0
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-rose-100 text-rose-900'
                            }`}
                          >
                            {prod.stock > 0 ? `${prod.stock} in stock` : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="p-3.5 text-stone-600">
                          {prod.sizes.join(', ')}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenProductModal(prod)}
                              className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: CATEGORIES MANAGEMENT ==================== */}
        {adminTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg font-bold text-stone-900">
                  Manage Categories ({categories.length})
                </h2>
                <p className="text-xs text-stone-500">
                  Add, edit, or remove women's clothing categories. Changes update the storefront navigation immediately.
                </p>
              </div>

              <button
                onClick={() => handleOpenCategoryModal()}
                id="admin-add-category-btn"
                className="px-4 py-2 rounded-xl bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-xs flex items-center gap-3.5"
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-16 h-16 rounded-xl object-cover bg-stone-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-stone-900 truncate">{cat.name}</h3>
                    <p className="text-[11px] text-stone-500 line-clamp-1">{cat.description}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded">
                      {cat.itemCount || 0} products
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleOpenCategoryModal(cat)}
                      className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ==================== MODAL: ADD / EDIT PRODUCT ==================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-rose-100 my-8 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {editingProduct ? 'Edit Product' : 'Add New Women\'s Apparel Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Dhakai Jamdani Saree, Kashmiri Kurti..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Category *</label>
                  <select
                    value={productForm.categoryId}
                    onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl capitalize"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Subcategory / Tag</label>
                  <input
                    type="text"
                    value={productForm.subcategory}
                    onChange={e => setProductForm({ ...productForm, subcategory: e.target.value })}
                    placeholder="e.g. Silk, 3-Piece, Dubai Abaya..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Price (৳) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="e.g. 2850"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.stock}
                    onChange={e => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Detailed product features, design, and silhouette..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Sizes (Comma separated)</label>
                  <input
                    type="text"
                    value={productForm.sizesText}
                    onChange={e => setProductForm({ ...productForm, sizesText: e.target.value })}
                    placeholder="S, M, L, XL or Free Size"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Colors (Name: #Hex, ...)</label>
                  <input
                    type="text"
                    value={productForm.colorsText}
                    onChange={e => setProductForm({ ...productForm, colorsText: e.target.value })}
                    placeholder="Crimson: #be123c, Green: #047857"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Image URLs (One per line)</label>
                <textarea
                  rows={2}
                  value={productForm.imagesText}
                  onChange={e => setProductForm({ ...productForm, imagesText: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Fabric Details</label>
                  <input
                    type="text"
                    value={productForm.fabric}
                    onChange={e => setProductForm({ ...productForm, fabric: e.target.value })}
                    placeholder="e.g. 100% Combed Tangail Cotton"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Care Instructions</label>
                  <input
                    type="text"
                    value={productForm.care}
                    onChange={e => setProductForm({ ...productForm, care: e.target.value })}
                    placeholder="e.g. Dry clean only"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="prod-featured-check"
                  checked={productForm.isFeatured}
                  onChange={e => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                  className="rounded text-rose-800 focus:ring-rose-800"
                />
                <label htmlFor="prod-featured-check" className="font-semibold text-stone-800 cursor-pointer">
                  Feature this product on homepage
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD / EDIT CATEGORY ==================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Festive Co-ords, Winter Shawls..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">URL Slug</label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={e => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  placeholder="e.g. festive-co-ords (optional)"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description</label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Short description for category..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category Image URL</label>
                <input
                  type="url"
                  value={categoryForm.image}
                  onChange={e => setCategoryForm({ ...categoryForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ==================== MODAL: ORDER CANCELLATION REASON ==================== */}
      {cancellationModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3 text-rose-800">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700 font-bold shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900 leading-tight">
                    Order Cancellation Reason
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Order: #{cancellationModalOrder.orderNumber} • {cancellationModalOrder.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCancellationModalOrder(null);
                  setCancellationReasonInput('');
                }}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancellation} className="space-y-4 pt-4 text-xs">
              {/* Order Brief Box */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-stone-700">
                  <span className="font-semibold">Customer Phone:</span>
                  <span className="font-mono font-bold text-stone-900">{cancellationModalOrder.customerPhone}</span>
                </div>
                <div className="flex items-center justify-between text-stone-700">
                  <span className="font-semibold">Delivery Address:</span>
                  <span className="text-right truncate max-w-[240px] text-stone-800 font-medium">
                    {cancellationModalOrder.customerAddress}, {cancellationModalOrder.districtName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-700 border-t border-stone-200/80 pt-1.5">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="font-extrabold text-rose-900 text-sm">৳{cancellationModalOrder.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Preset Quick Reasons */}
              <div>
                <label className="block font-bold text-stone-700 mb-1.5">
                  Select Cancellation Reason (Quick Presets):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Product Out of Stock',
                    'Customer unreachable by phone',
                    'Cancelled upon customer request',
                    'Fake or duplicate order',
                    'Delivery address unserviceable / out of delivery zone',
                    'Customer refused delivery',
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCancellationReasonInput(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        cancellationReasonInput === preset
                          ? 'bg-rose-800 text-white border-rose-800 font-semibold shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-rose-300 hover:bg-rose-50/50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Text Area */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Cancellation Reason (Shown to customer) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancellationReasonInput}
                  onChange={e => setCancellationReasonInput(e.target.value)}
                  placeholder="Explain clearly why this order is being cancelled..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-rose-700 text-xs"
                />
              </div>

              {/* Customer notification notice */}
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Visible to customer:</span>
                </p>
                <p className="text-amber-800">
                  When the customer checks or tracks their order, this reason will be clearly displayed to them.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setCancellationModalOrder(null);
                    setCancellationReasonInput('');
                  }}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold cursor-pointer"
                >
                  Cancel (Keep Order)
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancellation || !cancellationReasonInput.trim()}
                  className="px-5 py-2 rounded-xl bg-rose-800 hover:bg-rose-900 disabled:opacity-50 text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  {isSubmittingCancellation ? 'Cancelling...' : 'Confirm Order Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
