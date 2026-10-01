import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  initDbAndSeed,
  getDistrictsFromDb,
  updateDistrictChargeInDb,
  batchUpdateDistrictsInDb,
  resetDistrictsInDb,
  getCategoriesFromDb,
  createCategoryInDb,
  updateCategoryInDb,
  deleteCategoryInDb,
  getProductsFromDb,
  getProductByIdFromDb,
  createProductInDb,
  updateProductInDb,
  deleteProductInDb,
  getOrdersFromDb,
  createOrderInDb,
  updateOrderStatusInDb,
  getDashboardStatsFromDb,
  registerUser,
  loginUser,
  syncFirebaseUser,
  getAllUsersFromDb,
  deleteUserFromDb,
  trackOrdersInDb,
} from './src/db/dbService.ts';
import {
  getVapidPublicKey,
  addPushSubscription,
  removePushSubscription,
  getSubscriptionsCount,
  broadcastPushNotification,
} from './src/services/serverPushService.ts';

const PORT = 3000;

async function startServer() {
  // Initialize and seed PostgreSQL tables
  await initDbAndSeed();

  const app = express();
  app.use(express.json());

  // Serve static assets from public directory (favicons, logos, images)
  app.use(express.static(path.join(process.cwd(), 'public')));

  // CORS headers
  app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // CUSTOMER AUTHENTICATION ENDPOINTS (PostgreSQL + Firebase)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name, phone } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      const user = await registerUser(email, password, name, phone);
      res.status(201).json({ success: true, user, message: 'Account registered successfully' });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(400).json({ error: err.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      const user = await loginUser(email, password);
      res.json({ success: true, user, message: 'Logged in successfully' });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(401).json({ error: err.message || 'Invalid email or password' });
    }
  });

  app.post('/api/auth/firebase-sync', async (req, res) => {
    try {
      const { uid, email, name } = req.body;
      if (!uid || !email) {
        return res.status(400).json({ error: 'UID and email required' });
      }
      const user = await syncFirebaseUser(uid, email, name);
      res.json({ success: true, user });
    } catch (err: any) {
      console.error('Firebase sync error:', err);
      res.status(500).json({ error: 'Failed to sync user' });
    }
  });

  // Admin authentication endpoint
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === 'admin61') {
      return res.json({
        success: true,
        token: 'fa-admin-session-authenticated',
        message: 'Admin authentication successful',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid admin password. Please use admin61.',
    });
  });

  // ACCOUNTS MANAGEMENT ENDPOINTS (Admin Console)
  app.get('/api/users', async (req, res) => {
    try {
      const usersList = await getAllUsersFromDb();
      res.json(usersList);
    } catch (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.delete('/api/users/:uid', async (req, res) => {
    try {
      const { uid } = req.params;
      const success = await deleteUserFromDb(uid);
      if (!success) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ success: true, message: 'Account deleted successfully' });
    } catch (err) {
      console.error('Error deleting user:', err);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // DISTRICTS ENDPOINTS (Single Source of Truth for delivery charges)
  app.get('/api/districts', async (req, res) => {
    try {
      const districts = await getDistrictsFromDb();
      res.json(districts);
    } catch (err) {
      console.error('Error fetching districts:', err);
      res.status(500).json({ error: 'Failed to fetch districts' });
    }
  });

  app.put('/api/districts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { charge } = req.body;
      const numCharge = Number(charge);
      if (isNaN(numCharge) || numCharge < 0) {
        return res.status(400).json({ error: 'Charge must be a positive number' });
      }
      const updated = await updateDistrictChargeInDb(id, numCharge);
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating district:', err);
      res.status(500).json({ error: err.message || 'Failed to update district' });
    }
  });

  app.post('/api/districts/batch-update', async (req, res) => {
    try {
      const { updates } = req.body;
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: 'Updates must be an array' });
      }
      const districts = await batchUpdateDistrictsInDb(updates);
      res.json({ success: true, districts });
    } catch (err) {
      console.error('Error batch updating districts:', err);
      res.status(500).json({ error: 'Failed to batch update districts' });
    }
  });

  app.post('/api/districts/reset', async (req, res) => {
    try {
      const districts = await resetDistrictsInDb();
      res.json({ success: true, districts });
    } catch (err) {
      console.error('Error resetting districts:', err);
      res.status(500).json({ error: 'Failed to reset districts' });
    }
  });

  // CATEGORIES ENDPOINTS
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await getCategoriesFromDb();
      res.json(categories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  app.post('/api/categories', async (req, res) => {
    try {
      const newCategory = await createCategoryInDb(req.body);
      res.status(201).json(newCategory);
    } catch (err) {
      console.error('Error creating category:', err);
      res.status(500).json({ error: 'Failed to create category' });
    }
  });

  app.put('/api/categories/:id', async (req, res) => {
    try {
      const id = decodeURIComponent(req.params.id);
      const updated = await updateCategoryInDb(id, req.body);
      res.json(updated);
    } catch (err) {
      console.error('Error updating category:', err);
      res.status(500).json({ error: 'Failed to update category' });
    }
  });

  app.delete('/api/categories/:id', async (req, res) => {
    try {
      const id = decodeURIComponent(req.params.id);
      await deleteCategoryInDb(id);
      res.json({ success: true, message: 'Category deleted' });
    } catch (err) {
      console.error('Error deleting category:', err);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  // PRODUCTS ENDPOINTS
  app.get('/api/products', async (req, res) => {
    try {
      const { category, search, featured, sort } = req.query;
      const products = await getProductsFromDb({
        category: category as string,
        search: search as string,
        featured: featured as string,
        sort: sort as string,
      });
      res.json(products);
    } catch (err) {
      console.error('Error fetching products:', err);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await getProductByIdFromDb(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (err) {
      console.error('Error fetching product:', err);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const { name, price, categoryId } = req.body;
      if (!name || !price || !categoryId) {
        return res.status(400).json({ error: 'Name, price, and category are required' });
      }
      const newProduct = await createProductInDb(req.body);
      res.status(201).json(newProduct);
    } catch (err) {
      console.error('Error creating product:', err);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    try {
      const updated = await updateProductInDb(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      console.error('Error updating product:', err);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      await deleteProductInDb(req.params.id);
      res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
      console.error('Error deleting product:', err);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // ORDERS ENDPOINTS
  app.get('/api/orders', async (req, res) => {
    try {
      const userUid = req.query.userUid as string | undefined;
      const orders = await getOrdersFromDb(userUid);
      res.json(orders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // Track Order endpoint (by Order number, Phone number, or ID)
  app.get('/api/orders/track', async (req, res) => {
    try {
      const query = (req.query.query as string || '').trim();
      if (!query) {
        return res.status(400).json({ error: 'Order number or phone number is required' });
      }
      const matchedOrders = await trackOrdersInDb(query);
      res.json(matchedOrders);
    } catch (err) {
      console.error('Error tracking orders:', err);
      res.status(500).json({ error: 'Failed to track order' });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const { customerName, customerPhone, customerAddress, districtId, items, userUid } = req.body;
      if (!customerName || !customerPhone || !customerAddress || !districtId || !items || !items.length) {
        return res.status(400).json({ error: 'All customer and order details are required' });
      }
      const newOrder = await createOrderInDb(req.body, userUid);
      
      // Trigger background push notification to all subscribed admin devices (even if app is closed!)
      broadcastPushNotification({
        title: 'নতুন অর্ডার এসেছে! 🛍️',
        body: `অর্ডার #${newOrder.orderNumber} - ${newOrder.customerName} (${newOrder.total}৳)`,
        url: '/#admin',
        tag: `order-${newOrder.orderNumber}`,
      }).catch(err => console.warn('[Push] Background push error on order create:', err));

      res.status(201).json(newOrder);
    } catch (err: any) {
      console.error('Error creating order:', err);
      res.status(500).json({ error: err?.message || 'Failed to create order' });
    }
  });

  app.patch('/api/orders/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, cancellationReason } = req.body;
      if (status === 'Cancelled' && (!cancellationReason || !cancellationReason.trim())) {
        return res.status(400).json({ error: 'Order cancellation requires a reason' });
      }
      const updated = await updateOrderStatusInDb(id, status, cancellationReason ? cancellationReason.trim() : undefined);
      
      // Trigger background push notification if cancelled
      if (status === 'Cancelled') {
        broadcastPushNotification({
          title: 'অর্ডার বাতিল করা হয়েছে! ⚠️',
          body: `অর্ডার #${updated.orderNumber || id} বাতিল করা হয়েছে${cancellationReason ? ': ' + cancellationReason : ''}`,
          url: '/#admin',
          tag: `cancel-${updated.orderNumber || id}`,
        }).catch(err => console.warn('[Push] Background push error on order cancel:', err));
      }

      res.json(updated);
    } catch (err: any) {
      console.error('Error updating order status:', err);
      res.status(500).json({ error: err?.message || 'Failed to update order status' });
    }
  });

  // WEB PUSH NOTIFICATION ENDPOINTS (Works even when browser / shortcut app is closed)
  app.get('/api/push/vapid-public-key', (req, res) => {
    res.json({ publicKey: getVapidPublicKey() });
  });

  app.post('/api/push/subscribe', (req, res) => {
    try {
      const success = addPushSubscription(req.body);
      res.json({ success, totalSubscriptions: getSubscriptionsCount() });
    } catch (err: any) {
      console.error('Push subscription error:', err);
      res.status(500).json({ error: err.message || 'Failed to save subscription' });
    }
  });

  app.post('/api/push/unsubscribe', (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) return res.status(400).json({ error: 'Endpoint required' });
      const removed = removePushSubscription(endpoint);
      res.json({ success: removed, remainingSubscriptions: getSubscriptionsCount() });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to remove subscription' });
    }
  });

  app.get('/api/push/status', (req, res) => {
    res.json({
      enabled: true,
      activeSubscribers: getSubscriptionsCount(),
    });
  });

  app.post('/api/push/test', async (req, res) => {
    try {
      const result = await broadcastPushNotification({
        title: 'Friends Apparel টেস্ট নোটিফিকেশন 🛍️',
        body: 'অভিনন্দন! আপনার ডিভাইসে ব্যাকগ্রাউন্ড নোটিফিকেশন সক্রিয় রয়েছে (অ্যাপ বন্ধ থাকলেও পাবেন)।',
        url: '/#admin',
        tag: 'test-push-' + Date.now(),
      });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to send test push' });
    }
  });

  // Cross-trigger for orders created directly through Firestore/Client SDK
  app.post('/api/push/notify-order', async (req, res) => {
    try {
      const { orderNumber, customerName, total } = req.body;
      const result = await broadcastPushNotification({
        title: 'নতুন অর্ডার এসেছে! 🛍️',
        body: `অর্ডার #${orderNumber || 'New'} - ${customerName || 'Customer'} (${total || 0}৳)`,
        url: '/#admin',
        tag: `order-${orderNumber || Date.now()}`,
      });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Cross-trigger for orders cancelled directly through Firestore/Client SDK
  app.post('/api/push/notify-cancel', async (req, res) => {
    try {
      const { orderNumber, id, reason } = req.body;
      const num = orderNumber || id || 'Order';
      const result = await broadcastPushNotification({
        title: 'অর্ডার বাতিল করা হয়েছে! ⚠️',
        body: `অর্ডার #${num} বাতিল করা হয়েছে${reason ? ': ' + reason : ''}`,
        url: '/#admin',
        tag: `cancel-${num}`,
      });
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // STATS ENDPOINT FOR ADMIN DASHBOARD
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await getDashboardStatsFromDb();
      res.json(stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      if (req.method !== 'GET' || req.originalUrl.startsWith('/api')) return next();
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Friends Apparel PostgreSQL server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
