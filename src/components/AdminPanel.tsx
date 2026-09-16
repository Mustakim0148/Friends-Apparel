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
  CloudUpload,
  Sliders,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Tag,
  Percent,
  Loader2,
  Printer,
  Copy,
  Phone,
  MessageCircle,
  FileText,
  Truck,
  Calendar,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { Product, Category, District, Order, OrderStatus, User, HeroSlide } from '../types';

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
    heroSlides,
    reloadHeroSlides,
    showToast,
  } = useShop();

  // Login form state
  const [password, setPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin active sub-tab
  const [adminTab, setAdminTab] = useState<'dashboard' | 'orders' | 'products' | 'categories' | 'slider' | 'districts' | 'accounts'>('dashboard');

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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCopiedCourier, setIsCopiedCourier] = useState(false);

  // District management state
  const [districtSearch, setDistrictSearch] = useState('');
  const [districtDivisionFilter, setDistrictDivisionFilter] = useState('all');
  const [districtEdits, setDistrictEdits] = useState<{ [id: string]: number }>({});
  const [isSavingDistricts, setIsSavingDistricts] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Product modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    hasDiscount: false,
    originalPrice: '',
    categoryId: 'sarees',
    subcategory: '',
    imagesText: '',
    sizesText: 'S, M, L, XL',
    colorsText: 'Red: #be123c, Green: #047857',
    stock: '15',
    isFeatured: true,
    fabric: '',
    care: '',
  });

  // Quick Price & Discount Modal state
  const [quickPriceModalProduct, setQuickPriceModalProduct] = useState<Product | null>(null);
  const [quickPrice, setQuickPrice] = useState('');
  const [quickHasDiscount, setQuickHasDiscount] = useState(false);
  const [quickOriginalPrice, setQuickOriginalPrice] = useState('');
  const [isSavingQuickPrice, setIsSavingQuickPrice] = useState(false);

  // Explicitly toggle discount on/off in Main Product Modal
  const handleToggleProductDiscount = (enable: boolean) => {
    if (enable) {
      const sell = parseFloat(productForm.price) || 0;
      const suggestedOrig = productForm.originalPrice && parseFloat(productForm.originalPrice) > sell
        ? productForm.originalPrice
        : sell > 0 ? (Math.round(sell * 1.25)).toString() : '';
      setProductForm(prev => ({
        ...prev,
        hasDiscount: true,
        originalPrice: suggestedOrig,
      }));
    } else {
      setProductForm(prev => ({
        ...prev,
        hasDiscount: false,
        originalPrice: '',
      }));
    }
  };

  // Computed discount info for Main Product Modal
  const modalSelling = parseFloat(productForm.price) || 0;
  const modalOriginal = parseFloat(productForm.originalPrice) || 0;
  const modalHasDiscount = Boolean(productForm.hasDiscount && modalOriginal > modalSelling && modalSelling > 0);
  const modalSaveAmount = modalHasDiscount ? modalOriginal - modalSelling : 0;
  const modalDiscountPercent = modalHasDiscount && modalOriginal > 0
    ? Math.round(((modalOriginal - modalSelling) / modalOriginal) * 100)
    : 0;

  const modalDiscountInfo = {
    hasDiscount: modalHasDiscount,
    saveAmount: modalSaveAmount,
    percent: modalDiscountPercent,
  };

  const applyPercentDiscountToForm = (percent: number) => {
    const orig = parseFloat(productForm.originalPrice) || 0;
    const sell = parseFloat(productForm.price) || 0;
    if (orig > 0) {
      const discount = Math.round(orig * (percent / 100));
      const newSell = Math.max(1, orig - discount);
      setProductForm(prev => ({ ...prev, hasDiscount: true, price: newSell.toString() }));
    } else if (sell > 0) {
      const newOrig = Math.round(sell / (1 - percent / 100));
      setProductForm(prev => ({ ...prev, hasDiscount: true, originalPrice: newOrig.toString() }));
    }
  };

  const applyFixedDiscountToForm = (amount: number) => {
    const orig = parseFloat(productForm.originalPrice) || 0;
    const sell = parseFloat(productForm.price) || 0;
    if (orig > 0) {
      const newSell = Math.max(1, orig - amount);
      setProductForm(prev => ({ ...prev, hasDiscount: true, price: newSell.toString() }));
    } else if (sell > 0) {
      setProductForm(prev => ({ ...prev, hasDiscount: true, originalPrice: (sell + amount).toString() }));
    }
  };

  // Computed discount info for Quick Price Modal
  const quickSelling = parseFloat(quickPrice) || 0;
  const quickOrig = parseFloat(quickOriginalPrice) || 0;
  const quickHasValidDiscount = Boolean(quickHasDiscount && quickOrig > quickSelling && quickSelling > 0);
  const quickSaveAmount = quickHasValidDiscount ? quickOrig - quickSelling : 0;
  const quickDiscountPercent = quickHasValidDiscount && quickOrig > 0
    ? Math.round(((quickOrig - quickSelling) / quickOrig) * 100)
    : 0;

  const applyQuickPercentDiscount = (percent: number) => {
    const orig = parseFloat(quickOriginalPrice) || 0;
    const sell = parseFloat(quickPrice) || 0;
    if (orig > 0) {
      const discount = Math.round(orig * (percent / 100));
      const newSell = Math.max(1, orig - discount);
      setQuickHasDiscount(true);
      setQuickPrice(newSell.toString());
    } else if (sell > 0) {
      const newOrig = Math.round(sell / (1 - percent / 100));
      setQuickHasDiscount(true);
      setQuickOriginalPrice(newOrig.toString());
    }
  };

  const applyQuickFixedDiscount = (amount: number) => {
    const orig = parseFloat(quickOriginalPrice) || 0;
    const sell = parseFloat(quickPrice) || 0;
    if (orig > 0) {
      const newSell = Math.max(1, orig - amount);
      setQuickHasDiscount(true);
      setQuickPrice(newSell.toString());
    } else if (sell > 0) {
      setQuickHasDiscount(true);
      setQuickOriginalPrice((sell + amount).toString());
    }
  };

  // Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
  });
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  // Hero Slider Modal state
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [slideForm, setSlideForm] = useState({
    title: '',
    subtitle: '',
    category: 'all',
    image: '',
    cta: 'Shop Now',
    order: 1,
    isActive: true,
  });
  const [deletingSlideId, setDeletingSlideId] = useState<string | null>(null);

  // In-App Confirmation Modal state (prevents iframe window.confirm blocking)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmStyle?: 'danger' | 'warning' | 'primary';
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [isConfirmProcessing, setIsConfirmProcessing] = useState(false);

  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const initialLoadRef = useRef(true);
  const prevOrdersCountRef = useRef(0);

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
      prevOrdersCountRef.current = data.length;
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
      // Check if new orders arrived from customer devices outside state updater
      if (!initialLoadRef.current && updatedOrders.length > prevOrdersCountRef.current) {
        const newest = updatedOrders[0];
        playNewOrderSound();
        showToast(`🔔 New Live Order! ${newest.orderNumber} from ${newest.customerName} (৳${newest.total})`);
      }
      initialLoadRef.current = false;
      prevOrdersCountRef.current = updatedOrders.length;
      setOrders(updatedOrders);
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
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated);
      }
      showToast(`Order status updated to "${newStatus}"`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status');
    }
  };

  const handleCopyCourierInfo = (order: Order) => {
    const itemsSummary = order.items.map(i => `${i.productName} (${i.size}, Qty: ${i.quantity})`).join(', ');
    const courierText = `Customer: ${order.customerName}\nPhone: ${order.customerPhone}\nAddress: ${order.customerAddress}\nDistrict: ${order.districtName}\nCash to Collect: ৳${order.total}\nOrder Invoice: #${order.orderNumber}\nItems: ${itemsSummary}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(courierText);
    }
    setIsCopiedCourier(true);
    showToast('✓ Courier delivery info copied to clipboard!');
    setTimeout(() => setIsCopiedCourier(false), 2500);
  };

  const handlePrintOrder = () => {
    window.print();
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
  const handleDeleteUser = (user: User) => {
    if (user.role === 'admin' || user.email === 'admin@friendsapparel.com') {
      showToast('Default Admin account cannot be deleted');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Delete User Account',
      message: `Are you sure you want to delete user account "${user.name || user.email}"? This will permanently remove their profile.`,
      confirmText: 'Delete User',
      confirmStyle: 'danger',
      onConfirm: async () => {
        setIsConfirmProcessing(true);
        setDeletingUserUid(user.uid);
        try {
          await api.deleteUser(user.uid);
          setUsersList(prev => prev.filter(u => u.uid !== user.uid));
          showToast(`User account "${user.name || user.email}" has been deleted`);
        } catch (err: any) {
          showToast(err.message || 'Failed to delete user account');
        } finally {
          setDeletingUserUid(null);
          setIsConfirmProcessing(false);
          setConfirmModal(null);
        }
      },
    });
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

  const handleResetDistricts = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Delivery Charges',
      message: 'Reset all 64 districts to default rates? (Dhaka: ৳80, All other districts: ৳150)',
      confirmText: 'Reset Rates',
      confirmStyle: 'warning',
      onConfirm: async () => {
        setIsConfirmProcessing(true);
        try {
          await api.resetDistricts();
          await reloadDistricts();
          setDistrictEdits({});
          showToast('Districts reset: Dhaka ৳80, others ৳150');
        } catch (err: any) {
          showToast(err.message || 'Failed to reset districts');
        } finally {
          setIsConfirmProcessing(false);
          setConfirmModal(null);
        }
      },
    });
  };

  // Quick Price & Discount Management
  const handleOpenQuickPriceModal = (prod: Product) => {
    setQuickPriceModalProduct(prod);
    setQuickPrice(prod.price.toString());
    const hasDisc = Boolean(prod.originalPrice && prod.originalPrice > prod.price);
    setQuickHasDiscount(hasDisc);
    setQuickOriginalPrice(hasDisc && prod.originalPrice ? prod.originalPrice.toString() : '');
  };

  const handleSaveQuickPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPriceModalProduct || isSavingQuickPrice) return;
    const numPrice = Number(quickPrice);
    if (!numPrice || numPrice <= 0) {
      showToast('Please enter a valid selling price (greater than 0)');
      return;
    }

    let numOrig: number | null = null;
    if (quickHasDiscount) {
      const parsed = parseFloat(quickOriginalPrice);
      if (isNaN(parsed) || parsed <= numPrice) {
        showToast('Regular price must be higher than selling price to offer a discount (or switch off the discount toggle).');
        return;
      }
      numOrig = parsed;
    }

    setIsSavingQuickPrice(true);
    try {
      await api.updateProduct(quickPriceModalProduct.id, {
        price: numPrice,
        originalPrice: numOrig,
      });
      showToast(`Pricing updated: ৳${numPrice.toLocaleString()}${numOrig ? ` (Regular ৳${numOrig.toLocaleString()}, Save ৳${(numOrig - numPrice).toLocaleString()})` : ' (Regular price, no discount)'} uploaded live!`);
      setQuickPriceModalProduct(null);
      await reloadProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to update pricing');
    } finally {
      setIsSavingQuickPrice(false);
    }
  };

  // Product Add / Edit
  const handleOpenProductModal = (prod?: Product) => {
    if (prod) {
      const hasDisc = Boolean(prod.originalPrice && prod.originalPrice > prod.price);
      setEditingProduct(prod);
      setProductForm({
        name: prod.name,
        description: prod.description,
        price: prod.price.toString(),
        hasDiscount: hasDisc,
        originalPrice: hasDisc && prod.originalPrice ? prod.originalPrice.toString() : '',
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
        hasDiscount: false,
        originalPrice: '',
        categoryId: categories[0]?.id || 'sarees',
        subcategory: '',
        imagesText: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        sizesText: 'S, M, L, XL',
        colorsText: 'Ruby Red: #be123c, Royal Navy: #1e3a8a',
        stock: '15',
        isFeatured: true,
        fabric: '100% Combed Cotton',
        care: 'Machine wash delicate',
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingProduct) return;

    const trimmedName = productForm.name.trim();
    if (!trimmedName) {
      showToast('Please enter a product name');
      return;
    }

    const priceNum = parseFloat(productForm.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('Please enter a valid selling price (greater than 0)');
      return;
    }

    let origPriceNum: number | null = null;
    if (productForm.hasDiscount) {
      const parsedOrig = parseFloat(productForm.originalPrice);
      if (isNaN(parsedOrig) || parsedOrig <= priceNum) {
        showToast('Regular / Original price must be higher than selling price to offer a discount (or switch off discount).');
        return;
      }
      origPriceNum = parsedOrig;
    }

    setIsSavingProduct(true);

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
      name: trimmedName,
      description: productForm.description.trim(),
      price: priceNum,
      originalPrice: origPriceNum, // Strictly null if discount is off
      categoryId: productForm.categoryId || categories[0]?.id || 'sarees',
      subcategory: productForm.subcategory.trim(),
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'],
      sizes: sizes.length > 0 ? sizes : ['Free Size'],
      colors: colors.length > 0 ? colors : [{ name: 'Standard', hex: '#e11d48' }],
      stock: Math.max(0, parseInt(productForm.stock) || 0),
      isFeatured: Boolean(productForm.isFeatured),
      isNewArrival: editingProduct?.isNewArrival ?? true,
      fabric: productForm.fabric.trim(),
      care: productForm.care.trim(),
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        showToast(`✓ Product "${payload.name}" updated & published live!`);
      } else {
        await api.createProduct(payload);
        showToast(`✓ Product "${payload.name}" added & published live!`);
      }
      setIsProductModalOpen(false);
      await reloadProducts();
      await reloadCategories();
    } catch (err: any) {
      console.error('Error saving product:', err);
      showToast(err.message || 'Failed to save product');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleToggleProductFeatured = async (prod: Product) => {
    try {
      const nextFeatured = !prod.isFeatured;
      await api.updateProduct(prod.id, { isFeatured: nextFeatured });
      showToast(nextFeatured ? `✓ "${prod.name}" marked as Featured on Home!` : `"${prod.name}" removed from Featured`);
      await reloadProducts();
    } catch (err: any) {
      showToast('Failed to update featured status');
    }
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Product',
      message: `Are you sure you want to delete "${productName}"? This will permanently remove the item from inventory.`,
      confirmText: 'Delete Product',
      confirmStyle: 'danger',
      onConfirm: async () => {
        setIsConfirmProcessing(true);
        try {
          await api.deleteProduct(productId);
          await reloadProducts();
          await reloadCategories();
          showToast(`Product "${productName}" deleted successfully`);
        } catch (err: any) {
          showToast(err.message || 'Failed to delete product');
        } finally {
          setIsConfirmProcessing(false);
          setConfirmModal(null);
        }
      },
    });
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
        showToast(`Category "${categoryForm.name}" updated & uploaded live to website!`);
      } else {
        await api.createCategory(categoryForm);
        showToast(`Category "${categoryForm.name}" created & uploaded live to website for all customers!`);
      }
      setIsCategoryModalOpen(false);
      await reloadCategories();
    } catch (err: any) {
      showToast(err.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Category: "${catName}"`,
      message: `Are you sure you want to delete "${catName}"? Products in this category will remain safe in inventory and become uncategorized.`,
      confirmText: 'Delete Category',
      confirmStyle: 'danger',
      onConfirm: async () => {
        setIsConfirmProcessing(true);
        setDeletingCategoryId(catId);
        try {
          await api.deleteCategory(catId);
          await reloadCategories();
          await reloadProducts();
          showToast(`Category "${catName}" deleted successfully`);
        } catch (err: any) {
          showToast(err.message || 'Failed to delete category');
        } finally {
          setDeletingCategoryId(null);
          setIsConfirmProcessing(false);
          setConfirmModal(null);
        }
      },
    });
  };

  // Hero Slider Add / Edit / Delete
  const handleOpenSlideModal = (slide?: HeroSlide) => {
    if (slide) {
      setEditingSlide(slide);
      setSlideForm({
        title: slide.title,
        subtitle: slide.subtitle || '',
        category: slide.category || 'all',
        image: slide.image || '',
        cta: slide.cta || 'Shop Now',
        order: slide.order ?? (heroSlides.indexOf(slide) + 1),
        isActive: slide.isActive !== false,
      });
    } else {
      setEditingSlide(null);
      setSlideForm({
        title: '',
        subtitle: '',
        category: 'all',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
        cta: 'Shop Now',
        order: heroSlides.length + 1,
        isActive: true,
      });
    }
    setIsSlideModalOpen(true);
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSlide) {
        await api.updateHeroSlide(editingSlide.id, {
          title: slideForm.title,
          subtitle: slideForm.subtitle,
          category: slideForm.category,
          image: slideForm.image,
          cta: slideForm.cta,
          order: Number(slideForm.order) || 1,
          isActive: slideForm.isActive,
        });
        showToast(`Slide "${slideForm.title}" updated & uploaded live!`);
      } else {
        await api.createHeroSlide({
          title: slideForm.title,
          subtitle: slideForm.subtitle,
          category: slideForm.category,
          image: slideForm.image,
          cta: slideForm.cta,
          order: Number(slideForm.order) || 1,
          isActive: slideForm.isActive,
        });
        showToast(`Slide "${slideForm.title}" created & uploaded live!`);
      }
      setIsSlideModalOpen(false);
      await reloadHeroSlides();
    } catch (err: any) {
      showToast(err.message || 'Failed to save slide');
    }
  };

  const handleDeleteSlide = (slideId: string, slideTitle: string) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Slide: "${slideTitle}"`,
      message: `Are you sure you want to remove this slide from the home page banner?`,
      confirmText: 'Delete Slide',
      confirmStyle: 'danger',
      onConfirm: async () => {
        setIsConfirmProcessing(true);
        setDeletingSlideId(slideId);
        try {
          await api.deleteHeroSlide(slideId);
          await reloadHeroSlides();
          showToast(`Slide "${slideTitle}" deleted successfully`);
        } catch (err: any) {
          showToast(err.message || 'Failed to delete slide');
        } finally {
          setDeletingSlideId(null);
          setIsConfirmProcessing(false);
          setConfirmModal(null);
        }
      },
    });
  };

  const handleToggleSlideActive = async (slide: HeroSlide) => {
    try {
      const updatedStatus = !(slide.isActive !== false);
      await api.updateHeroSlide(slide.id, { isActive: updatedStatus });
      await reloadHeroSlides();
      showToast(`Slide "${slide.title}" is now ${updatedStatus ? 'Active' : 'Hidden'}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update slide status');
    }
  };

  const handleForceSyncCatalog = async () => {
    setIsSyncingCloud(true);
    try {
      const result = await api.syncCatalogToCloud();
      await reloadProducts();
      await reloadCategories();
      showToast(`Synced ${result.productsCount} products and ${result.categoriesCount} categories live to website! Visible on all devices now.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to sync to cloud');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const matchesStatus = orderFilterStatus === 'all' || o.status === orderFilterStatus;
    const q = orderSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.customerPhone && o.customerPhone.includes(q)) ||
      (o.districtName && o.districtName.toLowerCase().includes(q)) ||
      (o.customerAddress && o.customerAddress.toLowerCase().includes(q)) ||
      (o.items && o.items.some(i => i.productName && i.productName.toLowerCase().includes(q)));
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
                  <span>Auto-Upload Live</span>
                </span>
              </div>
              <p className="text-[10px] text-stone-400">
                Friends Apparel • Instant Cloud Auto-Publish (No manual sync needed) • Dhaka ৳80 | 63 Districts ৳150
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={async () => {
                await reloadProducts();
                await reloadCategories();
                loadOrders();
                loadUsers();
                showToast('Website database refreshed!');
              }}
              disabled={isSyncingLive}
              className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 border border-emerald-500/30"
              title="Click to refresh live store data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLive ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh Data</span>
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

            <button
              onClick={() => setAdminTab('slider')}
              id="admin-tab-slider"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === 'slider' ? 'bg-rose-800 text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Home Slider ({heroSlides.length})</span>
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
                        <tr
                          key={o.id}
                          onClick={() => {
                            setSelectedOrder(o);
                            setAdminTab('orders');
                          }}
                          className="py-2.5 hover:bg-rose-50/60 cursor-pointer transition-colors group"
                          title="Click to view full order details"
                        >
                          <td className="py-2.5 font-mono font-bold text-rose-800 group-hover:underline">{o.orderNumber}</td>
                          <td className="py-2.5 font-medium text-stone-900">{o.customerName}</td>
                          <td className="py-2.5 text-stone-600">{o.districtName}</td>
                          <td className="py-2.5 font-bold text-stone-900">৳{o.total.toLocaleString()}</td>
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
          selectedOrder ? (
            /* ==================== ORDER DETAILS FULL PAGE VIEW ==================== */
            <div className="space-y-6">
              {/* Top Navigation & Action Header */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Orders List</span>
                  </button>
                  <div className="h-6 w-px bg-stone-200 hidden sm:block" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-mono text-lg sm:text-xl font-extrabold text-stone-900">
                        {selectedOrder.orderNumber}
                      </h2>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          selectedOrder.status === 'Pending'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : selectedOrder.status === 'Processing'
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : selectedOrder.status === 'Shipped'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : selectedOrder.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : 'bg-rose-100 text-rose-900 border border-rose-200'
                        }`}
                      >
                        {selectedOrder.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>
                        Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleCopyCourierInfo(selectedOrder)}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copy formatted details for Steadfast / Pathao / RedX parcel booking"
                  >
                    {isCopiedCourier ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-stone-600" />
                    )}
                    <span>{isCopiedCourier ? 'Copied!' : 'Copy Courier Slip'}</span>
                  </button>

                  <a
                    href={`https://wa.me/88${selectedOrder.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hello ${selectedOrder.customerName}, this is Friends Apparel regarding your order #${selectedOrder.orderNumber} (Total: ৳${selectedOrder.total.toLocaleString()}).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${selectedOrder.customerPhone}`}
                    className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>

                  <button
                    type="button"
                    onClick={handlePrintOrder}
                    className="px-3.5 py-2 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Invoice</span>
                  </button>
                </div>
              </div>

              {/* Status Management Workflow Bar (Non-print) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs print:hidden space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-stone-900">
                      Order Fulfillment Status
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Update order progress. Changes sync instantly with customer order tracking.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500 font-medium">Status:</span>
                    <select
                      value={selectedOrder.status}
                      onChange={e => handleOrderSelectStatus(selectedOrder, e.target.value as OrderStatus)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer focus:outline-hidden ${
                        selectedOrder.status === 'Pending'
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : selectedOrder.status === 'Processing'
                          ? 'bg-blue-50 border-blue-300 text-blue-900'
                          : selectedOrder.status === 'Shipped'
                          ? 'bg-purple-50 border-purple-300 text-purple-900'
                          : selectedOrder.status === 'Delivered'
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
                  </div>
                </div>

                {/* Progress Pipeline */}
                {selectedOrder.status !== 'Cancelled' ? (
                  <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                    {[
                      { status: 'Pending', label: '1. Placed', icon: Clock },
                      { status: 'Processing', label: '2. Packaging', icon: Package },
                      { status: 'Shipped', label: '3. In Transit', icon: Truck },
                      { status: 'Delivered', label: '4. Delivered', icon: CheckCircle2 },
                    ].map((step, idx) => {
                      const statusHierarchy = ['Pending', 'Processing', 'Shipped', 'Delivered'];
                      const currentIdx = statusHierarchy.indexOf(selectedOrder.status);
                      const isComplete = currentIdx >= idx;
                      const isCurrent = selectedOrder.status === step.status;
                      const StepIcon = step.icon;

                      return (
                        <div
                          key={step.status}
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, step.status as OrderStatus)}
                          className={`p-2 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-200'
                              : isComplete
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-stone-50 border-stone-200 text-stone-400 hover:bg-stone-100'
                          }`}
                        >
                          <div className="flex items-center justify-center mb-1">
                            <StepIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${isCurrent ? 'text-rose-700' : isComplete ? 'text-emerald-600' : 'text-stone-400'}`} />
                          </div>
                          <span className="text-[11px] sm:text-xs font-bold block">{step.label}</span>
                          <span className="text-[9px] font-medium block opacity-80">
                            {isCurrent ? 'Current' : isComplete ? 'Completed' : 'Click to Set'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-rose-700 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-rose-950 block">This order was Cancelled</span>
                        <span className="text-[11px] text-rose-800 block">
                          Reason: {selectedOrder.cancellationReason || 'No reason provided'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Pending')}
                      className="px-3 py-1.5 bg-white border border-rose-300 text-rose-900 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      Re-activate Order
                    </button>
                  </div>
                )}
              </div>

              {/* Printable Invoice Header (Hidden on screen, Visible when printing) */}
              <div className="hidden print:block mb-6 pb-4 border-b-2 border-stone-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-serif font-bold text-stone-900">Friends Apparel</h1>
                    <p className="text-xs text-stone-600">Exclusive Women's Clothing • friendsapparel.com</p>
                    <p className="text-xs text-stone-600">Hotline: 01929600998 • Dhaka, Bangladesh</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold font-mono text-stone-900">INVOICE</h2>
                    <p className="text-xs font-bold font-mono">#{selectedOrder.orderNumber}</p>
                    <p className="text-xs text-stone-500">Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs font-bold text-stone-700 uppercase">Payment: {selectedOrder.paymentMethod}</p>
                  </div>
                </div>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Order Items & Financials */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Order Items Table Card */}
                  <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden print:border-none print:shadow-none">
                    <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-rose-800" />
                        <h3 className="font-serif text-base font-bold text-stone-900">
                          Ordered Items ({selectedOrder.items.reduce((sum, i) => sum + i.quantity, 0)})
                        </h3>
                      </div>
                      <span className="text-xs font-semibold text-stone-500">
                        {selectedOrder.items.length} Product{selectedOrder.items.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200">
                          <tr>
                            <th className="p-3.5">Product</th>
                            <th className="p-3.5">Size & Color</th>
                            <th className="p-3.5 text-center">Qty</th>
                            <th className="p-3.5 text-right">Unit Price</th>
                            <th className="p-3.5 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {selectedOrder.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-stone-50/50">
                              <td className="p-3.5">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={item.productImage}
                                    alt={item.productName}
                                    className="w-12 h-16 object-cover rounded-lg border border-stone-200 bg-stone-50 shrink-0"
                                  />
                                  <div>
                                    <span className="font-bold text-stone-900 block text-xs sm:text-sm">
                                      {item.productName}
                                    </span>
                                    <span className="text-[11px] text-stone-500 block">
                                      Product ID: {item.productId}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3.5">
                                <div className="space-y-1">
                                  <div className="inline-block px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-bold text-[10px]">
                                    Size: {item.size}
                                  </div>
                                  {item.color && (
                                    <div className="text-[11px] text-stone-600 font-medium">
                                      Color: {item.color}
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="p-3.5 text-center font-bold text-stone-800">
                                × {item.quantity}
                              </td>

                              <td className="p-3.5 text-right font-medium text-stone-600">
                                ৳{item.price.toLocaleString()}
                              </td>

                              <td className="p-3.5 text-right font-bold text-stone-900">
                                ৳{(item.price * item.quantity).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Order Financial Calculation */}
                    <div className="p-4 sm:p-5 bg-stone-50/70 border-t border-stone-100">
                      <div className="max-w-xs ml-auto space-y-2 text-xs">
                        <div className="flex justify-between text-stone-600">
                          <span>Items Subtotal:</span>
                          <span className="font-semibold text-stone-800">
                            ৳{selectedOrder.subtotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-stone-600">
                          <span>Delivery Charge ({selectedOrder.districtName}):</span>
                          <span className="font-semibold text-stone-800">
                            ৳{selectedOrder.deliveryCharge}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-stone-200 flex justify-between text-sm sm:text-base font-extrabold text-stone-900">
                          <span>Total Amount to Collect:</span>
                          <span className="text-rose-900">
                            ৳{selectedOrder.total.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[10px] text-right text-stone-500 font-medium">
                          Payment Method: {selectedOrder.paymentMethod.toUpperCase()} (Cash on Delivery)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Order Notes */}
                  {selectedOrder.notes && (
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs">
                      <h4 className="font-bold text-xs sm:text-sm text-stone-900 mb-1 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-600" />
                        <span>Customer Instructions / Notes</span>
                      </h4>
                      <p className="text-xs text-stone-700 bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl leading-relaxed whitespace-pre-wrap">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  )}

                  {/* Cancellation Reason (If Cancelled) */}
                  {selectedOrder.status === 'Cancelled' && (
                    <div className="bg-rose-50/70 border border-rose-200 p-4 sm:p-5 rounded-2xl">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-xs sm:text-sm text-rose-900 flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-rose-700" />
                          <span>Cancellation Reason</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setCancellationModalOrder(selectedOrder);
                            setCancellationReasonInput(selectedOrder.cancellationReason || '');
                          }}
                          className="text-xs font-bold text-rose-800 hover:text-rose-950 underline cursor-pointer"
                        >
                          Edit Reason
                        </button>
                      </div>
                      <p className="text-xs text-rose-950 font-medium">
                        {selectedOrder.cancellationReason || 'No reason provided'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: Customer & Delivery Info */}
                <div className="space-y-6">
                  {/* Customer Details Card */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-rose-800" />
                        <h3 className="font-serif text-base font-bold text-stone-900">
                          Customer Details
                        </h3>
                      </div>
                      {selectedOrder.userUid ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Registered User
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                          Guest Order
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[11px] text-stone-400 font-medium block">Customer Name</span>
                        <span className="text-sm font-bold text-stone-900 block mt-0.5">
                          {selectedOrder.customerName}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-stone-400 font-medium block">Phone Number</span>
                        <div className="flex items-center justify-between mt-0.5">
                          <a
                            href={`tel:${selectedOrder.customerPhone}`}
                            className="font-mono text-sm font-bold text-rose-800 hover:underline"
                          >
                            {selectedOrder.customerPhone}
                          </a>
                          <a
                            href={`tel:${selectedOrder.customerPhone}`}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 transition-colors"
                            title="Call customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] text-stone-400 font-medium block">Delivery Address</span>
                        <p className="text-xs text-stone-800 font-medium mt-0.5 leading-relaxed bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                          {selectedOrder.customerAddress}
                        </p>
                      </div>

                      <div>
                        <span className="text-[11px] text-stone-400 font-medium block">District / Region</span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-700" />
                          <span>{selectedOrder.districtName}</span>
                          <span className="text-[11px] font-normal text-stone-500">
                            (Delivery: ৳{selectedOrder.deliveryCharge})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Courier Slip Quick Copy Card */}
                  <div className="bg-stone-900 text-white p-5 rounded-2xl shadow-sm space-y-3 print:hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-amber-400" />
                        <h4 className="font-bold text-xs uppercase tracking-wider text-amber-300">
                          Courier Booking Slip
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCourierInfo(selectedOrder)}
                        className="text-xs font-bold text-rose-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {isCopiedCourier ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopiedCourier ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="bg-white/10 p-3 rounded-xl text-xs font-mono space-y-1 text-stone-200">
                      <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                      <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
                      <p><strong>Address:</strong> {selectedOrder.customerAddress}</p>
                      <p><strong>District:</strong> {selectedOrder.districtName}</p>
                      <p className="text-amber-300 font-bold">
                        <strong>Amount:</strong> ৳{selectedOrder.total}
                      </p>
                      <p><strong>Invoice:</strong> #{selectedOrder.orderNumber}</p>
                    </div>

                    <p className="text-[10px] text-stone-400">
                      Click copy to paste into Steadfast, Pathao, or RedX merchant parcel booking.
                    </p>
                  </div>
                </div>
              </div>

              {/* Print Footer Notice (Hidden on screen) */}
              <div className="hidden print:block mt-8 pt-4 border-t border-stone-300 text-center text-xs text-stone-600">
                <p>Thank you for shopping with Friends Apparel! Quality fashion for every occasion.</p>
                <p>For any exchange or questions, please WhatsApp/Call: 01929600998 within 48 hours of delivery.</p>
              </div>
            </div>
          ) : (
            /* ==================== ORDERS LIST TABLE VIEW ==================== */
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
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-stone-400">
                            No matching orders found.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map(order => (
                          <tr
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className="hover:bg-stone-50/80 transition-colors cursor-pointer group"
                            title="Click to view full order details"
                          >
                            {/* Order Details */}
                            <td className="p-3.5 align-top">
                              <span className="font-mono font-bold text-sm text-stone-900 group-hover:text-rose-800 group-hover:underline block">
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
                                <p className="text-[10px] text-amber-700 bg-amber-50 p-1 rounded mt-1 line-clamp-1">
                                  Note: {order.notes}
                                </p>
                              )}
                            </td>

                            {/* Items */}
                            <td className="p-3.5 align-top">
                              <div className="space-y-1">
                                {order.items.slice(0, 2).map((item, idx) => (
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
                                {order.items.length > 2 && (
                                  <span className="text-[10px] text-stone-400 font-medium block">
                                    +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                                  </span>
                                )}
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
                            <td className="p-3.5 align-top" onClick={e => e.stopPropagation()}>
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
                                      onClick={e => {
                                        e.stopPropagation();
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

                            {/* Action Button */}
                            <td className="p-3.5 align-top text-center" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 font-bold text-xs transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-lg font-bold text-stone-900">
                    Manage Products ({products.length})
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Multi-Device Live Sync
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Any product added or edited here uploads directly to the live website and appears on all devices instantly.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleForceSyncCatalog}
                  disabled={isSyncingCloud}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Upload all catalog items to cloud for all visitors"
                >
                  <CloudUpload className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-bounce text-rose-600' : 'text-stone-500'}`} />
                  <span>{isSyncingCloud ? 'Syncing...' : 'Sync All to Website'}</span>
                </button>

                <button
                  onClick={() => handleOpenProductModal()}
                  id="admin-add-product-btn"
                  className="px-4 py-2 rounded-xl bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200">
                    <tr>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Price & Discounts</th>
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
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-[11px] text-stone-500">
                                  {prod.subcategory || 'Standard'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductFeatured(prod)}
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                    prod.isFeatured
                                      ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                                      : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                                  }`}
                                  title={prod.isFeatured ? 'Click to remove from Home Featured' : 'Click to feature on Home page'}
                                >
                                  {prod.isFeatured ? '★ Featured' : '+ Feature'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 uppercase font-semibold text-stone-600">
                          {prod.categoryId}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-extrabold text-stone-900 text-sm">
                                ৳{prod.price.toLocaleString()}
                              </div>
                              {prod.originalPrice && prod.originalPrice > prod.price ? (
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className="text-[11px] text-stone-400 line-through font-medium">
                                    ৳{prod.originalPrice.toLocaleString()}
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/70">
                                    Save ৳{(prod.originalPrice - prod.price).toLocaleString()}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-stone-400 font-medium">Regular Price</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenQuickPriceModal(prod)}
                              className="ml-auto px-2 py-1 rounded-lg bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-800 text-[10px] font-bold transition-colors border border-stone-200/70 flex items-center gap-1 shrink-0 cursor-pointer"
                              title="Quickly edit ৳ Price, Regular Price & Save Discount"
                            >
                              <Tag className="w-3 h-3 text-rose-700" />
                              <span>৳ Edit</span>
                            </button>
                          </div>
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
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-lg font-bold text-stone-900">
                    Manage Categories ({categories.length})
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Website Sync
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Add, edit, or remove women's clothing categories. Changes upload live so all visitors on every device see updated categories immediately.
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
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenCategoryModal(cat)}
                      className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer transition-colors"
                      title={`Edit ${cat.name}`}
                      id={`edit-category-btn-${cat.id}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={deletingCategoryId === cat.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.id, cat.name);
                      }}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors disabled:opacity-50"
                      title={`Delete ${cat.name}`}
                      id={`delete-category-btn-${cat.id}`}
                    >
                      {deletingCategoryId === cat.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 6: HERO SLIDER MANAGEMENT ==================== */}
        {adminTab === 'slider' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-lg font-bold text-stone-900">
                    Manage Home Banner Slider ({heroSlides.length})
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Cloud Sync
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Control the slides, titles, background images, and call-to-action buttons shown on the home page. Any updates appear instantly across all devices.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveView('home')}
                  className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-stone-500" />
                  <span>View Homepage</span>
                </button>
                <button
                  onClick={() => handleOpenSlideModal()}
                  id="admin-add-slide-btn"
                  className="px-4 py-2 rounded-xl bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Slide</span>
                </button>
              </div>
            </div>

            {heroSlides.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
                <ImageIcon className="w-12 h-12 text-stone-300 mx-auto" />
                <h3 className="font-bold text-sm text-stone-700">No slides configured</h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  Click "Add New Slide" to create the first banner slide for your storefront.
                </p>
                <button
                  onClick={() => handleOpenSlideModal()}
                  className="px-4 py-2 rounded-xl bg-rose-800 text-white text-xs font-bold cursor-pointer"
                >
                  Create Slide
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {heroSlides.map((slide, idx) => {
                  const targetCat = categories.find(c => c.id === slide.category);
                  const isLive = slide.isActive !== false;
                  return (
                    <div
                      key={slide.id}
                      className={`bg-white rounded-2xl border transition-all p-4 shadow-xs flex flex-col justify-between ${
                        isLive ? 'border-stone-200/90' : 'border-stone-200 opacity-60 bg-stone-50/70'
                      }`}
                    >
                      <div>
                        {/* Slide Preview Card */}
                        <div className="relative h-44 rounded-xl overflow-hidden bg-stone-900 mb-3 border border-stone-100">
                          <img
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                              Slide #{idx + 1}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isLive
                                  ? 'bg-emerald-500/90 text-white border-emerald-400/50'
                                  : 'bg-stone-600/90 text-stone-200 border-stone-500/50'
                              }`}
                            >
                              {isLive ? 'Active on Home' : 'Hidden'}
                            </span>
                          </div>

                          <div className="absolute bottom-2.5 left-3 right-3 text-white">
                            <h3 className="font-serif font-bold text-base line-clamp-1 drop-shadow-sm">
                              {slide.title}
                            </h3>
                            {slide.subtitle && (
                              <p className="text-[11px] text-stone-200 line-clamp-1 drop-shadow-xs">
                                {slide.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Slide Details */}
                        <div className="space-y-1.5 text-xs text-stone-600">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-stone-400">Target Category:</span>
                            <span className="font-semibold text-stone-800">
                              {slide.category === 'all' ? 'All Collection' : (targetCat?.name || slide.category)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-stone-400">Button Label:</span>
                            <span className="font-semibold text-stone-800">
                              {slide.cta || 'Shop Now'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-stone-400">Display Order:</span>
                            <span className="font-mono font-semibold text-stone-800">
                              {slide.order ?? (idx + 1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => handleToggleSlideActive(slide)}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                            isLive
                              ? 'bg-stone-50 text-stone-700 hover:bg-stone-100 border-stone-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                          }`}
                        >
                          {isLive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{isLive ? 'Hide from Store' : 'Show on Store'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenSlideModal(slide)}
                            className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            id={`edit-slide-btn-${slide.id}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            disabled={deletingSlideId === slide.id}
                            onClick={() => handleDeleteSlide(slide.id, slide.title)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors disabled:opacity-50"
                            title={`Delete slide`}
                            id={`delete-slide-btn-${slide.id}`}
                          >
                            {deletingSlideId === slide.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span><strong>Instant Live Upload:</strong> Saving this product immediately publishes it to the cloud database so all visitors see it live instantly without manual sync.</span>
              </div>
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

              {/* Price & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1 flex items-center justify-between">
                    <span>Selling Price (৳) *</span>
                    <span className="text-[10px] text-rose-700 font-bold">Customer pays this</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-500">৳</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={productForm.price}
                      onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="1450"
                      className="w-full pl-7 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-extrabold text-stone-900 text-sm focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                    />
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1 block">e.g. 1450</span>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.stock}
                    onChange={e => setProductForm({ ...productForm, stock: e.target.value })}
                    placeholder="e.g. 15"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">Available quantity</span>
                </div>
              </div>

              {/* ================= Discount Option & Management Card ================= */}
              <div className="p-4 bg-stone-50/90 rounded-2xl border border-stone-200/90 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    {/* Visual toggle switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={productForm.hasDiscount}
                      onClick={() => handleToggleProductDiscount(!productForm.hasDiscount)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        productForm.hasDiscount ? 'bg-rose-800' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          productForm.hasDiscount ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleProductDiscount(!productForm.hasDiscount)}
                      className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer hover:text-rose-900 text-left"
                    >
                      <Tag className="w-4 h-4 text-rose-800 shrink-0" />
                      <span>Apply Discount / Sale Offer</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleProductDiscount(!productForm.hasDiscount)}
                    className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                      productForm.hasDiscount
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                        : 'bg-stone-200/80 text-stone-600 border-stone-300 hover:bg-stone-300'
                    }`}
                  >
                    {productForm.hasDiscount ? '✓ Discount Active (Click to turn off)' : '✕ No Discount (Click to turn on)'}
                  </button>
                </div>

                <p className="text-[11px] text-stone-500">
                  {productForm.hasDiscount
                    ? 'Discount option enabled: Enter the regular price below to show a strikethrough price and customer savings.'
                    : 'Discount option not selected: Product will be sold at regular selling price without any discount.'}
                </p>

                {productForm.hasDiscount && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-200/70">
                      {/* Regular / Original Price */}
                      <div>
                        <label className="block font-semibold text-stone-800 mb-1 flex items-center justify-between">
                          <span>Regular / Original Price (৳) *</span>
                          <span className="text-[10px] text-stone-400">Strikethrough</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">৳</span>
                          <input
                            type="number"
                            min="0"
                            value={productForm.originalPrice}
                            onChange={e => setProductForm({ ...productForm, originalPrice: e.target.value })}
                            placeholder="1800"
                            className="w-full pl-7 pr-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-stone-700 text-sm focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                          />
                        </div>
                        <span className="text-[10px] text-stone-400 mt-1 block">e.g. 1800 (higher than selling price)</span>
                      </div>

                      {/* Discount / Save Amount */}
                      <div>
                        <label className="block font-semibold text-stone-800 mb-1 flex items-center justify-between">
                          <span>Customer Savings (Save ৳)</span>
                          <span className="text-[10px] text-emerald-700 font-bold">Discount</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-emerald-700">৳</span>
                          <input
                            type="number"
                            min="0"
                            value={modalDiscountInfo.saveAmount > 0 ? modalDiscountInfo.saveAmount : ''}
                            onChange={e => {
                              const val = Number(e.target.value) || 0;
                              const orig = Number(productForm.originalPrice) || 0;
                              if (orig > 0) {
                                const newSelling = Math.max(0, orig - val);
                                setProductForm(prev => ({ ...prev, price: newSelling > 0 ? newSelling.toString() : '' }));
                              } else {
                                const curPrice = Number(productForm.price) || 0;
                                if (curPrice > 0 && val > 0) {
                                  setProductForm(prev => ({ ...prev, originalPrice: (curPrice + val).toString() }));
                                }
                              }
                            }}
                            placeholder="350"
                            className="w-full pl-7 pr-3 py-2 bg-white border border-emerald-300 rounded-xl font-extrabold text-emerald-800 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                          />
                        </div>
                        <span className="text-[10px] text-emerald-700 mt-1 block">e.g. Save ৳350</span>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="pt-2 border-t border-stone-200/70 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[11px] font-semibold text-stone-500 mr-1 flex items-center gap-1">
                        <Percent className="w-3 h-3 text-rose-700" />
                        Quick Presets:
                      </span>
                      {[10, 15, 20, 25, 30].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => applyPercentDiscountToForm(pct)}
                          className="px-2 py-0.5 rounded-lg bg-white border border-stone-200 hover:border-rose-400 hover:bg-rose-50 text-stone-700 hover:text-rose-800 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          {pct}% OFF
                        </button>
                      ))}
                      {[200, 350, 500].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => applyFixedDiscountToForm(amt)}
                          className="px-2 py-0.5 rounded-lg bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-800 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Save ৳{amt}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setProductForm(prev => ({ ...prev, hasDiscount: false, originalPrice: '' }))}
                        className="ml-auto px-2.5 py-0.5 rounded-lg bg-stone-200/80 hover:bg-stone-300 text-stone-700 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Remove Discount
                      </button>
                    </div>
                  </>
                )}

                {/* Live Customer Preview Card */}
                <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-xs flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-stone-400 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-stone-500" />
                      Storefront Live Preview
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xl font-black text-stone-900">
                        ৳{productForm.price ? Number(productForm.price).toLocaleString() : '0'}
                      </span>
                      {modalDiscountInfo.hasDiscount ? (
                        <>
                          <span className="text-sm text-stone-400 line-through font-medium">
                            ৳{Number(productForm.originalPrice).toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            Save ৳{modalDiscountInfo.saveAmount.toLocaleString()} ({modalDiscountInfo.percent}% OFF)
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-stone-500 font-medium">
                          (Regular Price • No discount)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className={`text-[11px] px-2 py-1 rounded-lg border block font-medium ${modalDiscountInfo.hasDiscount ? 'text-emerald-800 bg-emerald-50 border-emerald-200' : 'text-stone-500 bg-stone-50 border-stone-200/60'}`}>
                      {modalDiscountInfo.hasDiscount ? '🏷️ Discount Offer Active' : '🏷️ Regular Price'}
                    </span>
                  </div>
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

              {/* Home Page Display & Featured Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={productForm.isFeatured}
                    onChange={e => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-rose-800 rounded border-stone-300 focus:ring-rose-800 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-stone-900">
                    Feature / Highlight on Storefront Home Page
                  </span>
                </label>
                <span className="text-[11px] font-medium text-stone-500 hidden sm:inline">
                  {productForm.isFeatured ? '✓ Prioritized on Home' : 'Standard Catalog'}
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  disabled={isSavingProduct}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-6 py-2.5 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-sm transition-all"
                >
                  {isSavingProduct ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving & Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Product</span>
                    </>
                  )}
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
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span><strong>Instant Live Upload:</strong> Saving this category immediately publishes it to the cloud database so all visitors see it live instantly without manual sync.</span>
              </div>
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

              <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-stone-100">
                {editingCategory ? (
                  <button
                    type="button"
                    onClick={() => {
                      const toDelete = editingCategory;
                      setIsCategoryModalOpen(false);
                      handleDeleteCategory(toDelete.id, toDelete.name);
                    }}
                    className="px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                    id="admin-category-modal-delete-btn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Category</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    Save Category
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD / EDIT HERO SLIDE ==================== */}
      {isSlideModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 my-8 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-rose-800" />
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  {editingSlide ? 'Edit Home Banner Slide' : 'Add New Home Banner Slide'}
                </h3>
              </div>
              <button
                onClick={() => setIsSlideModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="space-y-4 pt-4 text-xs">
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span><strong>Instant Live Upload:</strong> This slide will appear immediately on the home page slider across all devices and browsers.</span>
              </div>

              {/* Title */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Slide Title / Headline *</label>
                <input
                  type="text"
                  required
                  value={slideForm.title}
                  onChange={e => setSlideForm({ ...slideForm, title: e.target.value })}
                  placeholder="e.g. Exclusive Eid Collection 2026, Royal Silk Sarees..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Subtitle / Description</label>
                <textarea
                  rows={2}
                  value={slideForm.subtitle}
                  onChange={e => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                  placeholder="e.g. Handcrafted Jamdani, Organza & Festive Lawn Sets crafted for elegance..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl resize-none"
                />
              </div>

              {/* Target Category & CTA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Target Category</label>
                  <select
                    value={slideForm.category}
                    onChange={e => setSlideForm({ ...slideForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl capitalize"
                  >
                    <option value="all">All Collection</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Button Text (CTA)</label>
                  <input
                    type="text"
                    value={slideForm.cta}
                    onChange={e => setSlideForm({ ...slideForm, cta: e.target.value })}
                    placeholder="e.g. Shop Now, Explore Collection..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Display Order & Active Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Display Order (1, 2, 3...)</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={slideForm.order}
                    onChange={e => setSlideForm({ ...slideForm, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Status</label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slideForm.isActive}
                      onChange={e => setSlideForm({ ...slideForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-rose-800 rounded border-stone-300 focus:ring-rose-500"
                    />
                    <span className="font-medium text-stone-800">Show on storefront</span>
                  </label>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Banner Image URL *</label>
                <input
                  type="url"
                  required
                  value={slideForm.image}
                  onChange={e => setSlideForm({ ...slideForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl"
                />

                {/* Image Live Preview */}
                {slideForm.image && (
                  <div className="mt-2.5 relative h-28 rounded-xl overflow-hidden bg-stone-900 border border-stone-200">
                    <img
                      src={slideForm.image}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={e => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2 text-white">
                      <span className="text-[10px] opacity-90">Live banner preview</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-stone-100">
                {editingSlide ? (
                  <button
                    type="button"
                    onClick={() => {
                      const toDelete = editingSlide;
                      setIsSlideModalOpen(false);
                      handleDeleteSlide(toDelete.id, toDelete.title);
                    }}
                    className="px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                    id="admin-slide-modal-delete-btn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Slide</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSlideModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    {editingSlide ? 'Save Changes' : 'Create Slide'}
                  </button>
                </div>
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

      {/* ==================== MODAL: QUICK PRICE & DISCOUNT MANAGER ==================== */}
      {quickPriceModalProduct && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setQuickPriceModalProduct(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900">
                    Manage ৳ Price & Save Discount
                  </h3>
                  <p className="text-[11px] text-stone-500 truncate max-w-xs">
                    {quickPriceModalProduct.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickPriceModalProduct(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPrice} className="space-y-4 pt-3 text-xs">
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200/70">
                <img
                  src={quickPriceModalProduct.images[0]}
                  alt=""
                  className="w-12 h-14 object-cover rounded-xl border border-stone-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-stone-900 text-xs truncate">
                    {quickPriceModalProduct.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                    <span>Category: <strong className="capitalize text-stone-700">{quickPriceModalProduct.categoryId}</strong></span>
                    <span>•</span>
                    <span>Stock: <strong className="text-stone-700">{quickPriceModalProduct.stock} pcs</strong></span>
                  </div>
                </div>
              </div>

              {/* Selling Price */}
              <div>
                <label className="block font-semibold text-stone-800 mb-1 flex items-center justify-between">
                  <span>Selling Price (৳) *</span>
                  <span className="text-[10px] text-rose-700 font-bold">Customer pays this</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-500">৳</span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quickPrice}
                    onChange={e => setQuickPrice(e.target.value)}
                    placeholder="1450"
                    className="w-full pl-7 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-extrabold text-stone-900 text-sm focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                  />
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">e.g. 1450</span>
              </div>

              {/* Discount Option Toggle */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={quickHasDiscount}
                      onClick={() => {
                        if (!quickHasDiscount) {
                          const sell = parseFloat(quickPrice) || 0;
                          const suggested = quickOriginalPrice && parseFloat(quickOriginalPrice) > sell
                            ? quickOriginalPrice
                            : sell > 0 ? (Math.round(sell * 1.25)).toString() : '';
                          setQuickHasDiscount(true);
                          setQuickOriginalPrice(suggested);
                        } else {
                          setQuickHasDiscount(false);
                          setQuickOriginalPrice('');
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        quickHasDiscount ? 'bg-rose-800' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          quickHasDiscount ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!quickHasDiscount) {
                          const sell = parseFloat(quickPrice) || 0;
                          const suggested = quickOriginalPrice && parseFloat(quickOriginalPrice) > sell
                            ? quickOriginalPrice
                            : sell > 0 ? (Math.round(sell * 1.25)).toString() : '';
                          setQuickHasDiscount(true);
                          setQuickOriginalPrice(suggested);
                        } else {
                          setQuickHasDiscount(false);
                          setQuickOriginalPrice('');
                        }
                      }}
                      className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer hover:text-rose-900 text-left"
                    >
                      <Tag className="w-4 h-4 text-rose-800 shrink-0" />
                      <span>Apply Discount / Sale Offer</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!quickHasDiscount) {
                        const sell = parseFloat(quickPrice) || 0;
                        const suggested = quickOriginalPrice && parseFloat(quickOriginalPrice) > sell
                          ? quickOriginalPrice
                          : sell > 0 ? (Math.round(sell * 1.25)).toString() : '';
                        setQuickHasDiscount(true);
                        setQuickOriginalPrice(suggested);
                      } else {
                        setQuickHasDiscount(false);
                        setQuickOriginalPrice('');
                      }
                    }}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      quickHasDiscount
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                        : 'bg-stone-200/80 text-stone-600 border-stone-300 hover:bg-stone-300'
                    }`}
                  >
                    {quickHasDiscount ? '✓ Discount Active (Turn off)' : '✕ No Discount (Turn on)'}
                  </button>
                </div>

                {quickHasDiscount && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-200/70">
                      <div>
                        <label className="block font-semibold text-stone-800 mb-1 flex items-center justify-between">
                          <span>Regular Price (৳) *</span>
                          <span className="text-[10px] text-stone-400">Strikethrough</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">৳</span>
                          <input
                            type="number"
                            min="0"
                            value={quickOriginalPrice}
                            onChange={e => setQuickOriginalPrice(e.target.value)}
                            placeholder="1800"
                            className="w-full pl-7 pr-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-stone-700 text-sm focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                          />
                        </div>
                        <span className="text-[10px] text-stone-400 mt-1 block">e.g. 1800 (higher than selling price)</span>
                      </div>

                      <div>
                        <label className="block font-semibold text-stone-800 mb-1 flex items-center justify-between">
                          <span>Customer Savings (Save ৳)</span>
                          <span className="text-[10px] text-emerald-700 font-bold">Discount</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-emerald-700">৳</span>
                          <input
                            type="number"
                            min="0"
                            value={quickSaveAmount > 0 ? quickSaveAmount : ''}
                            onChange={e => {
                              const val = Number(e.target.value) || 0;
                              const orig = Number(quickOriginalPrice) || 0;
                              if (orig > 0) {
                                const newSelling = Math.max(0, orig - val);
                                setQuickPrice(newSelling > 0 ? newSelling.toString() : '');
                              } else {
                                const cur = Number(quickPrice) || 0;
                                if (cur > 0 && val > 0) {
                                  setQuickOriginalPrice((cur + val).toString());
                                }
                              }
                            }}
                            placeholder="350"
                            className="w-full pl-7 pr-3 py-2 bg-white border border-emerald-300 rounded-xl font-extrabold text-emerald-800 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                          />
                        </div>
                        <span className="text-[10px] text-emerald-700 mt-1 block">e.g. Save ৳350</span>
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="pt-2 border-t border-stone-200/70 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-stone-500 mr-1 flex items-center gap-1">
                        <Percent className="w-3 h-3 text-rose-700" />
                        Quick Presets:
                      </span>
                      {[10, 15, 20, 25, 30].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => applyQuickPercentDiscount(pct)}
                          className="px-2 py-0.5 rounded-lg bg-white border border-stone-200 hover:border-rose-400 hover:bg-rose-50 text-stone-700 hover:text-rose-800 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          {pct}% OFF
                        </button>
                      ))}
                      {[200, 350, 500].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => applyQuickFixedDiscount(amt)}
                          className="px-2 py-0.5 rounded-lg bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-800 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Save ৳{amt}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setQuickHasDiscount(false);
                          setQuickOriginalPrice('');
                        }}
                        className="ml-auto px-2.5 py-0.5 rounded-lg bg-stone-200/80 hover:bg-stone-300 text-stone-700 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Remove Discount
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Customer View Live Preview */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-stone-400 flex items-center gap-1">
                    <Eye className="w-3 h-3 text-stone-500" />
                    Storefront Live Preview:
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-stone-900">
                      ৳{quickPrice ? Number(quickPrice).toLocaleString() : '0'}
                    </span>
                    {quickHasValidDiscount ? (
                      <>
                        <span className="text-sm text-stone-400 line-through font-medium">
                          ৳{Number(quickOriginalPrice).toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          Save ৳{quickSaveAmount.toLocaleString()} ({quickDiscountPercent}% OFF)
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-stone-500 font-medium">
                        (Regular Price • No discount)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setQuickPriceModalProduct(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuickPrice}
                  className="px-5 py-2 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingQuickPrice ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save & Upload Live (৳)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== GLOBAL IN-APP CONFIRMATION MODAL ==================== */}
      {confirmModal?.isOpen && (
        <div 
          className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => {
            if (!isConfirmProcessing) setConfirmModal(null);
          }}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-scaleUp"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3.5 mb-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                confirmModal.confirmStyle === 'warning'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-rose-100 text-rose-700'
              }`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-base font-bold text-stone-900 leading-snug">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
              <button
                type="button"
                disabled={isConfirmProcessing}
                onClick={() => setConfirmModal(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-end items-center gap-2.5 pt-4 border-t border-stone-100">
              <button
                type="button"
                disabled={isConfirmProcessing}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
                id="confirm-modal-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isConfirmProcessing}
                onClick={() => confirmModal.onConfirm()}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-xs ${
                  confirmModal.confirmStyle === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-700 hover:bg-rose-800'
                }`}
                id="confirm-modal-action-btn"
              >
                {isConfirmProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{confirmModal.confirmText || 'Confirm'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
