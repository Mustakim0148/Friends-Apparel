import { District, Category, Product, Order, DashboardStats, User } from '../types';
import { INITIAL_DISTRICTS } from '../data/bangladeshDistricts';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../data/initialProducts';
import {
  saveOrderToCloud,
  getOrdersFromCloud,
  updateOrderStatusInCloud,
  subscribeToLiveOrders,
  getUsersFromCloud,
  deleteUserFromCloud,
  registerCustomerInCloud,
  loginCustomerFromCloud,
} from './firestoreService';

/**
 * Helper to safely fetch JSON from the server.
 * On static hosts (like Netlify SPA), 404s or non-existent /api routes return index.html.
 * This helper prevents "Unexpected token '<', <DOCTYPE... is not valid JSON" crashes.
 */
async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new Error(`API returned non-JSON response (${contentType || 'text/html'}). Backend might be unavailable on static hosting.`);
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

// Local Storage Helpers for Netlify / Static hosting fallbacks
function getLocalDistricts(): District[] {
  try {
    const saved = localStorage.getItem('fa_districts');
    if (saved) return JSON.parse(saved);
  } catch {}
  return INITIAL_DISTRICTS;
}

function saveLocalDistricts(districts: District[]) {
  try {
    localStorage.setItem('fa_districts', JSON.stringify(districts));
  } catch {}
}

function getLocalOrders(): Order[] {
  try {
    const saved = localStorage.getItem('fa_orders');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveLocalOrder(order: Order) {
  try {
    const orders = getLocalOrders();
    const updated = [order, ...orders.filter(o => o.id !== order.id)];
    localStorage.setItem('fa_orders', JSON.stringify(updated));
  } catch {}
}

function getLocalProducts(): Product[] {
  try {
    const saved = localStorage.getItem('fa_products');
    if (saved) return JSON.parse(saved);
  } catch {}
  return INITIAL_PRODUCTS;
}

function saveLocalProducts(products: Product[]) {
  try {
    localStorage.setItem('fa_products', JSON.stringify(products));
  } catch {}
}

export const api = {
  // Districts (Single source of truth for delivery charges)
  async getDistricts(): Promise<District[]> {
    try {
      const data = await safeFetchJson<District[]>('/api/districts');
      saveLocalDistricts(data);
      return data;
    } catch {
      return getLocalDistricts();
    }
  },

  async updateDistrictCharge(id: string, charge: number): Promise<District> {
    try {
      const data = await safeFetchJson<District>(`/api/districts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charge }),
      });
      const districts = getLocalDistricts().map(d => d.id === id ? data : d);
      saveLocalDistricts(districts);
      return data;
    } catch {
      const districts = getLocalDistricts().map(d => d.id === id ? { ...d, charge } : d);
      saveLocalDistricts(districts);
      const updated = districts.find(d => d.id === id);
      if (!updated) throw new Error('District not found');
      return updated;
    }
  },

  async batchUpdateDistricts(updates: { id: string; charge: number }[]): Promise<{ success: boolean; districts: District[] }> {
    try {
      const data = await safeFetchJson<{ success: boolean; districts: District[] }>('/api/districts/batch-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      if (data.districts) saveLocalDistricts(data.districts);
      return data;
    } catch {
      let districts = getLocalDistricts();
      updates.forEach(u => {
        districts = districts.map(d => d.id === u.id ? { ...d, charge: u.charge } : d);
      });
      saveLocalDistricts(districts);
      return { success: true, districts };
    }
  },

  async resetDistricts(): Promise<{ success: boolean; districts: District[] }> {
    try {
      const data = await safeFetchJson<{ success: boolean; districts: District[] }>('/api/districts/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (data.districts) saveLocalDistricts(data.districts);
      return data;
    } catch {
      saveLocalDistricts(INITIAL_DISTRICTS);
      return { success: true, districts: INITIAL_DISTRICTS };
    }
  },

  // Products
  async getProducts(params?: { category?: string; search?: string; featured?: boolean; sort?: string }): Promise<Product[]> {
    try {
      const query = new URLSearchParams();
      if (params?.category) query.set('category', params.category);
      if (params?.search) query.set('search', params.search);
      if (params?.featured) query.set('featured', 'true');
      if (params?.sort) query.set('sort', params.sort);

      const data = await safeFetchJson<Product[]>(`/api/products?${query.toString()}`);
      if (data && data.length > 0) saveLocalProducts(data);
      return data;
    } catch {
      let prods = getLocalProducts();
      if (params?.category && params.category !== 'all') {
        prods = prods.filter(p => p.categoryId === params.category);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        prods = prods.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
      }
      if (params?.featured) {
        prods = prods.filter(p => p.isFeatured);
      }
      if (params?.sort) {
        if (params.sort === 'price-asc') prods.sort((a, b) => a.price - b.price);
        if (params.sort === 'price-desc') prods.sort((a, b) => b.price - a.price);
      }
      return prods;
    }
  },

  async getProduct(id: string): Promise<Product> {
    try {
      return await safeFetchJson<Product>(`/api/products/${id}`);
    } catch {
      const prod = getLocalProducts().find(p => p.id === id);
      if (!prod) throw new Error('Product not found');
      return prod;
    }
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    try {
      const created = await safeFetchJson<Product>('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      const prods = [created, ...getLocalProducts()];
      saveLocalProducts(prods);
      return created;
    } catch {
      const created: Product = {
        id: 'prod-' + Date.now(),
        name: product.name || 'New Item',
        slug: (product.name || 'item').toLowerCase().replace(/\s+/g, '-'),
        description: product.description || '',
        price: product.price || 0,
        categoryId: product.categoryId || 'sarees',
        images: product.images && product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'],
        sizes: product.sizes || ['Standard'],
        colors: product.colors || [{ name: 'Default', hex: '#BE185D' }],
        stock: product.stock ?? 10,
        rating: 5.0,
        reviewCount: 1,
        ...product,
      } as Product;
      const prods = [created, ...getLocalProducts()];
      saveLocalProducts(prods);
      return created;
    }
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    try {
      const updated = await safeFetchJson<Product>(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const prods = getLocalProducts().map(p => p.id === id ? updated : p);
      saveLocalProducts(prods);
      return updated;
    } catch {
      const prods = getLocalProducts().map(p => p.id === id ? { ...p, ...updates } : p);
      saveLocalProducts(prods);
      const updated = prods.find(p => p.id === id);
      if (!updated) throw new Error('Product not found');
      return updated;
    }
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    try {
      await safeFetchJson(`/api/products/${id}`, { method: 'DELETE' });
    } catch {}
    const prods = getLocalProducts().filter(p => p.id !== id);
    saveLocalProducts(prods);
    return { success: true };
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      return await safeFetchJson<Category[]>('/api/categories');
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  async createCategory(category: Partial<Category>): Promise<Category> {
    try {
      return await safeFetchJson<Category>('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });
    } catch {
      return {
        id: category.id || 'cat-' + Date.now(),
        name: category.name || 'New Category',
        slug: (category.name || 'cat').toLowerCase().replace(/\s+/g, '-'),
        description: category.description || '',
        image: category.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
        itemCount: 0,
      };
    }
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    try {
      return await safeFetchJson<Category>(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch {
      const cat = INITIAL_CATEGORIES.find(c => c.id === id) || { id, name: updates.name || '', slug: id, description: '', image: '' };
      return { ...cat, ...updates };
    }
  },

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    try {
      await safeFetchJson(`/api/categories/${id}`, { method: 'DELETE' });
    } catch {}
    return { success: true };
  },

  // Orders
  async getOrders(userUid?: string): Promise<Order[]> {
    const localOrders = getLocalOrders();
    try {
      // 1. Prioritize Cloud Firestore for global multi-device synchronization
      const cloudOrders = await getOrdersFromCloud(userUid);
      if (cloudOrders && cloudOrders.length > 0) {
        // Save to local cache for instant offline rendering
        cloudOrders.forEach(co => saveLocalOrder(co));
        return cloudOrders;
      }
    } catch (err) {
      console.warn('Cloud orders fetch fallback:', err);
    }

    try {
      // 2. Try backend API (/api/orders)
      const url = userUid ? `/api/orders?userUid=${encodeURIComponent(userUid)}` : '/api/orders';
      const remoteOrders = await safeFetchJson<Order[]>(url);
      const combined = [...remoteOrders];
      localOrders.forEach(lo => {
        if (!combined.some(ro => ro.id === lo.id || ro.orderNumber === lo.orderNumber)) {
          combined.push(lo);
        }
      });
      return userUid ? combined.filter(o => o.userUid === userUid) : combined;
    } catch {
      return userUid ? localOrders.filter(o => o.userUid === userUid) : localOrders;
    }
  },

  // Real-time live listener for orders
  subscribeToOrders(callback: (orders: Order[]) => void) {
    return subscribeToLiveOrders(callback);
  },

  async trackOrder(query: string): Promise<Order[]> {
    const cleanQuery = query.trim().toLowerCase();
    
    // Check cloud orders first
    try {
      const allCloud = await getOrdersFromCloud();
      const matched = allCloud.filter(o =>
        o.orderNumber.toLowerCase().includes(cleanQuery) ||
        o.customerPhone.includes(cleanQuery)
      );
      if (matched.length > 0) return matched;
    } catch {}

    const localMatches = getLocalOrders().filter(o =>
      o.orderNumber.toLowerCase().includes(cleanQuery) ||
      o.customerPhone.includes(cleanQuery)
    );

    try {
      const remoteMatches = await safeFetchJson<Order[]>(`/api/orders/track?query=${encodeURIComponent(query)}`);
      const all = [...remoteMatches];
      localMatches.forEach(lo => {
        if (!all.some(ro => ro.orderNumber === lo.orderNumber)) {
          all.push(lo);
        }
      });
      return all;
    } catch {
      return localMatches;
    }
  },

  async createOrder(orderData: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    districtId: string;
    items: {
      productId: string;
      productName: string;
      productImage: string;
      size: string;
      color: string;
      price: number;
      quantity: number;
    }[];
    paymentMethod: 'cod' | 'bkash' | 'nagad';
    notes?: string;
    userUid?: string;
  }): Promise<Order> {
    const districts = getLocalDistricts();
    const district = districts.find(d => d.id === orderData.districtId);
    const deliveryCharge = district ? district.charge : (orderData.districtId === 'dhaka' ? 80 : 150);
    const subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber: `FA-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerAddress: orderData.customerAddress,
      districtId: orderData.districtId,
      districtName: district?.name || orderData.districtId,
      deliveryCharge,
      items: orderData.items,
      subtotal,
      total: subtotal + deliveryCharge,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: 'pending',
      status: 'Pending',
      notes: orderData.notes,
      userUid: orderData.userUid,
    };

    // 1. Immediately save to Cloud Firestore (Visible across ALL devices worldwide in real-time)
    try {
      await saveOrderToCloud(newOrder);
    } catch (cloudErr) {
      console.warn('Failed to save order to cloud Firestore, proceeding to local/api fallback:', cloudErr);
    }

    // 2. Also send to backend Express API if running
    try {
      await safeFetchJson<Order>('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...orderData, id: newOrder.id, orderNumber: newOrder.orderNumber }),
      });
    } catch {}

    // 3. Save local copy
    saveLocalOrder(newOrder);
    return newOrder;
  },

  async updateOrderStatus(id: string, status: string, cancellationReason?: string): Promise<Order> {
    // 1. Update in Cloud Firestore
    try {
      await updateOrderStatusInCloud(id, status, cancellationReason);
    } catch (err) {
      console.warn('Cloud update failed, updating local/api:', err);
    }

    // 2. Update via backend API
    try {
      await safeFetchJson<Order>(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, cancellationReason }),
      });
    } catch {}

    // 3. Update local copy
    const orders = getLocalOrders();
    let matched = orders.find(o => o.id === id || o.orderNumber === id);
    if (matched) {
      matched = {
        ...matched,
        status: status as any,
        cancellationReason: cancellationReason || matched.cancellationReason,
      };
      saveLocalOrder(matched);
      return matched;
    }

    return {
      id,
      orderNumber: id,
      customerName: 'Customer',
      customerPhone: '',
      customerAddress: '',
      districtId: 'dhaka',
      districtName: 'Dhaka',
      deliveryCharge: 80,
      items: [],
      subtotal: 0,
      total: 0,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      status: status as any,
      cancellationReason,
      createdAt: new Date().toISOString(),
    };
  },

  // Stats
  async getStats(): Promise<DashboardStats> {
    try {
      return await safeFetchJson<DashboardStats>('/api/stats');
    } catch {
      const orders = getLocalOrders();
      const products = getLocalProducts();
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const pendingOrders = orders.filter(o => o.status === 'Pending').length;
      const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
      const outOfStockProducts = products.filter(p => p.stock <= 0).length;

      return {
        totalRevenue,
        totalOrders: orders.length,
        pendingOrders,
        deliveredOrders,
        totalProducts: products.length,
        outOfStockProducts,
      };
    }
  },

  // Admin login with password admin61
  async adminLogin(password: string): Promise<{ success: boolean; token?: string; message?: string }> {
    try {
      const res = await safeFetchJson<{ success: boolean; token?: string; message?: string }>('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      return res;
    } catch {
      // Fallback for Netlify / static preview
      if (password === 'admin61') {
        return { success: true, token: 'fa-admin-session-authenticated', message: 'Admin authenticated' };
      }
      return { success: false, message: 'Invalid admin password' };
    }
  },

  // Customer Authentication (PostgreSQL + Firebase + Local Fallback)
  async register(data: { email: string; password: string; name?: string; phone?: string }): Promise<{ success: boolean; user: any; message?: string }> {
    return await safeFetchJson('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async login(data: { email: string; password: string }): Promise<{ success: boolean; user: any; message?: string }> {
    return await safeFetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async firebaseSync(data: { uid: string; email: string; name?: string }): Promise<{ success: boolean; user: any }> {
    try {
      return await safeFetchJson('/api/auth/firebase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      return {
        success: true,
        user: {
          uid: data.uid,
          email: data.email,
          name: data.name,
          role: 'customer',
        },
      };
    }
  },

  // Accounts Management (Admin)
  async getUsers(): Promise<User[]> {
    try {
      // 1. Try Cloud Firestore first (Multi-device synced accounts)
      const cloudUsers = await getUsersFromCloud();
      if (cloudUsers && cloudUsers.length > 0) {
        return cloudUsers;
      }
    } catch (err) {
      console.warn('Could not fetch cloud users:', err);
    }

    try {
      // 2. Try PostgreSQL API
      return await safeFetchJson<User[]>('/api/users');
    } catch {
      const localUsers = JSON.parse(localStorage.getItem('fa_local_users') || '[]');
      return localUsers.map((item: any) => item.user);
    }
  },

  async deleteUser(uid: string): Promise<{ success: boolean; message?: string }> {
    // 1. Delete from Cloud Firestore
    try {
      await deleteUserFromCloud(uid);
    } catch (err) {
      console.warn('Failed cloud delete:', err);
    }

    // 2. Delete from PostgreSQL
    try {
      await safeFetchJson(`/api/users/${encodeURIComponent(uid)}`, {
        method: 'DELETE',
      });
    } catch {}

    // 3. Delete from Local Storage
    const localUsers = JSON.parse(localStorage.getItem('fa_local_users') || '[]');
    const filtered = localUsers.filter((item: any) => item.user?.uid !== uid);
    localStorage.setItem('fa_local_users', JSON.stringify(filtered));
    return { success: true };
  },
};
