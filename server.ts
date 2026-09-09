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

const PORT = 3000;

async function startServer() {
  // Initialize and seed PostgreSQL tables
  await initDbAndSeed();

  const app = express();
  app.use(express.json());

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
      const updated = await updateCategoryInDb(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      console.error('Error updating category:', err);
      res.status(500).json({ error: 'Failed to update category' });
    }
  });

  app.delete('/api/categories/:id', async (req, res) => {
    try {
      await deleteCategoryInDb(req.params.id);
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
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating order status:', err);
      res.status(500).json({ error: err?.message || 'Failed to update order status' });
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
