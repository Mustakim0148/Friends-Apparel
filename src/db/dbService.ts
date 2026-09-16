import { db } from './index.ts';
import { users, categories, products, districts, orders } from './schema.ts';
import { eq, desc, ilike, or, sql } from 'drizzle-orm';
import { INITIAL_DISTRICTS } from '../data/bangladeshDistricts.ts';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../data/initialProducts.ts';
import { Product, Category, District, Order, DashboardStats, User } from '../types.ts';

// Initial sample orders
const SAMPLE_INITIAL_ORDERS = [
  {
    id: 'ord-101',
    orderNumber: 'FA-72941',
    customerName: 'Nusrat Jahan',
    customerPhone: '01712345678',
    customerAddress: 'House 42, Road 7, Sector 3, Uttara',
    districtId: 'dhaka',
    districtName: 'Dhaka',
    deliveryCharge: 80,
    items: JSON.stringify([
      {
        productId: 'prod-1',
        productName: 'Royal Crimson Dhakai Jamdani Saree',
        productImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        size: 'Free Size (5.5m + Blouse)',
        color: 'Royal Crimson',
        price: 4850,
        quantity: 1,
      },
    ]),
    subtotal: 4850,
    total: 4930,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    status: 'Processing',
    notes: 'Please call before arriving.',
  },
  {
    id: 'ord-102',
    orderNumber: 'FA-72940',
    customerName: 'Sadia Rahman',
    customerPhone: '01898765432',
    customerAddress: 'Nasirabad Housing Society, Road 4',
    districtId: 'chittagong',
    districtName: 'Chittagong',
    deliveryCharge: 150,
    items: JSON.stringify([
      {
        productId: 'prod-5',
        productName: 'Embroidered Kashmiri A-Line Kurti Set',
        productImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        size: 'M (38)',
        color: 'Dusty Rose',
        price: 2750,
        quantity: 1,
      },
    ]),
    subtotal: 2750,
    total: 2900,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    status: 'Shipped',
    notes: '',
  },
];

// Initialize database with seed data if tables are empty
export async function initDbAndSeed() {
  try {
    // 1. Seed districts if empty
    const existingDistricts = await db.select().from(districts).limit(1);
    if (existingDistricts.length === 0) {
      console.log('Seeding 64 Bangladesh districts into PostgreSQL...');
      for (const d of INITIAL_DISTRICTS) {
        await db.insert(districts).values({
          id: d.id,
          name: d.name,
          bnName: d.bnName,
          division: d.division,
          charge: d.charge,
        }).onConflictDoNothing();
      }
    }

    // 2. Seed categories if empty
    const existingCategories = await db.select().from(categories).limit(1);
    if (existingCategories.length === 0) {
      console.log('Seeding initial categories into PostgreSQL...');
      for (const c of INITIAL_CATEGORIES) {
        await db.insert(categories).values({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          image: c.image,
        }).onConflictDoNothing();
      }
    }

    // 3. Seed products if empty
    const existingProducts = await db.select().from(products).limit(1);
    if (existingProducts.length === 0) {
      console.log('Seeding initial products into PostgreSQL...');
      for (const p of INITIAL_PRODUCTS) {
        await db.insert(products).values({
          id: p.id,
          slug: p.slug,
          name: p.name,
          description: p.description,
          price: p.price,
          originalPrice: p.originalPrice || null,
          categoryId: p.categoryId,
          subcategory: p.subcategory || '',
          images: JSON.stringify(p.images),
          sizes: JSON.stringify(p.sizes),
          colors: JSON.stringify(p.colors),
          stock: p.stock ?? 10,
          isFeatured: Boolean(p.isFeatured),
          isNewArrival: Boolean(p.isNewArrival ?? true),
          rating: String(p.rating || '5.0'),
          reviewCount: p.reviewCount || 1,
          fabric: p.fabric || 'Cotton Blend',
          care: p.care || 'Dry clean or gentle wash',
        }).onConflictDoNothing();
      }
    }

    // 4. Seed initial sample orders if empty
    const existingOrders = await db.select().from(orders).limit(1);
    if (existingOrders.length === 0) {
      console.log('Seeding sample orders into PostgreSQL...');
      for (const ord of SAMPLE_INITIAL_ORDERS) {
        await db.insert(orders).values(ord).onConflictDoNothing();
      }
    }

    // 5. Seed default admin user in PostgreSQL
    await db.insert(users).values({
      uid: 'admin-fa-master',
      email: 'admin@friendsapparel.com',
      name: 'Friends Apparel Admin',
      phone: '01800-FRIENDS',
      password: 'admin61', // Matches official admin password
      role: 'admin',
    }).onConflictDoNothing();

    // 6. Ensure cancellation_reason column exists in PostgreSQL orders table
    try {
      await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason text;`);
    } catch {
      // Column might already exist
    }

    console.log('PostgreSQL database verification and seed complete.');
  } catch (error) {
    console.error('Database initialization warning:', error);
  }
}

// User Authentication Services
export async function registerUser(email: string, password: string, name?: string, phone?: string): Promise<User> {
  const cleanEmail = email.toLowerCase().trim();
  const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
  if (existing.length > 0) {
    throw new Error('An account with this email already exists');
  }

  const uid = 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const result = await db.insert(users).values({
    uid,
    email: cleanEmail,
    name: name?.trim() || cleanEmail.split('@')[0],
    phone: phone?.trim() || '',
    password: password,
    role: 'customer',
  }).returning();

  const u = result[0];
  return {
    id: u.id,
    uid: u.uid,
    email: u.email,
    name: u.name || undefined,
    phone: u.phone || undefined,
    role: (u.role as 'customer' | 'admin') || 'customer',
  };
}

export async function loginUser(email: string, password: string): Promise<User> {
  const cleanEmail = email.toLowerCase().trim();
  const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
  if (existing.length === 0) {
    throw new Error('No account found with this email');
  }
  const u = existing[0];
  if (u.password !== password) {
    throw new Error('Invalid email or password');
  }
  return {
    id: u.id,
    uid: u.uid,
    email: u.email,
    name: u.name || undefined,
    phone: u.phone || undefined,
    role: (u.role as 'customer' | 'admin') || 'customer',
  };
}

export async function syncFirebaseUser(uid: string, email: string, name?: string): Promise<User> {
  const cleanEmail = email.toLowerCase().trim();
  const result = await db.insert(users)
    .values({
      uid,
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      role: 'customer',
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: {
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0],
      },
    })
    .returning();

  const u = result[0];
  return {
    id: u.id,
    uid: u.uid,
    email: u.email,
    name: u.name || undefined,
    phone: u.phone || undefined,
    role: (u.role as 'customer' | 'admin') || 'customer',
  };
}

export async function getUserByUid(uid: string): Promise<User | null> {
  const list = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
  if (list.length === 0) return null;
  const u = list[0];
  return {
    id: u.id,
    uid: u.uid,
    email: u.email,
    name: u.name || undefined,
    phone: u.phone || undefined,
    role: (u.role as 'customer' | 'admin') || 'customer',
  };
}

export async function getAllUsersFromDb(): Promise<User[]> {
  try {
    const list = await db.select().from(users).orderBy(desc(users.createdAt));
    return list.map(u => ({
      id: u.id,
      uid: u.uid,
      email: u.email,
      name: u.name || undefined,
      phone: u.phone || undefined,
      role: (u.role as 'customer' | 'admin') || 'customer',
      createdAt: u.createdAt ? u.createdAt.toISOString() : undefined,
    }));
  } catch (err) {
    console.error('Error fetching all users from database:', err);
    return [];
  }
}

export async function deleteUserFromDb(uid: string): Promise<boolean> {
  const res = await db.delete(users).where(eq(users.uid, uid)).returning();
  return res.length > 0;
}

// Districts queries
export async function getDistrictsFromDb(): Promise<District[]> {
  const list = await db.select().from(districts);
  return list.map(d => ({
    id: d.id,
    name: d.name,
    bnName: d.bnName || d.name,
    division: d.division,
    charge: d.charge,
  }));
}

export async function updateDistrictChargeInDb(id: string, charge: number): Promise<District> {
  const updated = await db.update(districts)
    .set({ charge })
    .where(eq(districts.id, id))
    .returning();
  if (!updated[0]) throw new Error('District not found');
  const d = updated[0];
  return {
    id: d.id,
    name: d.name,
    bnName: d.bnName || d.name,
    division: d.division,
    charge: d.charge,
  };
}

export async function batchUpdateDistrictsInDb(updates: { id: string; charge: number }[]): Promise<District[]> {
  for (const item of updates) {
    if (typeof item.charge === 'number' && item.charge >= 0) {
      await db.update(districts)
        .set({ charge: item.charge })
        .where(eq(districts.id, item.id));
    }
  }
  return getDistrictsFromDb();
}

export async function resetDistrictsInDb(): Promise<District[]> {
  for (const d of INITIAL_DISTRICTS) {
    await db.update(districts)
      .set({ charge: d.id === 'dhaka' ? 80 : 150 })
      .where(eq(districts.id, d.id));
  }
  return getDistrictsFromDb();
}

// Categories queries
export async function getCategoriesFromDb(): Promise<Category[]> {
  const cats = await db.select().from(categories);
  const prods = await db.select({ categoryId: products.categoryId }).from(products);
  
  return cats.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || '',
    image: c.image || '',
    itemCount: prods.filter(p => p.categoryId === c.id).length,
  }));
}

export async function createCategoryInDb(catData: Partial<Category>): Promise<Category> {
  let cleanSlug = (catData.slug || catData.name || 'cat')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!cleanSlug || cleanSlug === '-') {
    cleanSlug = 'cat-' + Date.now().toString(36);
  }

  // Check if category already exists with this slug or id
  const existing = await db.select().from(categories).where(or(eq(categories.id, cleanSlug), eq(categories.slug, cleanSlug)));
  const id = existing.length > 0 ? `${cleanSlug}-${Math.floor(1000 + Math.random() * 9000)}` : cleanSlug;

  const result = await db.insert(categories).values({
    id,
    name: catData.name?.trim() || 'Unnamed Category',
    slug: id,
    description: catData.description || '',
    image: catData.image || 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80',
  }).returning();

  const c = result[0];
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || '',
    image: c.image || '',
    itemCount: 0,
  };
}

export async function updateCategoryInDb(id: string, catData: Partial<Category>): Promise<Category> {
  const cleanId = decodeURIComponent(id).trim();
  const result = await db.update(categories)
    .set({
      name: catData.name,
      description: catData.description,
      image: catData.image,
    })
    .where(or(eq(categories.id, cleanId), eq(categories.slug, cleanId)))
    .returning();

  const c = result[0];
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || '',
    image: c.image || '',
  };
}

export async function deleteCategoryInDb(id: string): Promise<boolean> {
  const cleanId = decodeURIComponent(id).trim();
  await db.delete(categories).where(or(eq(categories.id, cleanId), eq(categories.slug, cleanId)));
  return true;
}

// Products queries
export async function getProductsFromDb(query?: { category?: string; search?: string; featured?: string; sort?: string }): Promise<Product[]> {
  const list = await db.select().from(products).orderBy(desc(products.createdAt));
  
  let formatted: Product[] = list.map(p => {
    let images: string[] = [];
    let sizes: string[] = [];
    let colors: any[] = [];
    try { images = JSON.parse(p.images); } catch { images = []; }
    try { sizes = JSON.parse(p.sizes); } catch { sizes = []; }
    try { colors = JSON.parse(p.colors); } catch { colors = []; }

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description || '',
      price: p.price,
      originalPrice: p.originalPrice || undefined,
      categoryId: p.categoryId,
      subcategory: p.subcategory || undefined,
      images,
      sizes,
      colors,
      stock: p.stock,
      isFeatured: p.isFeatured,
      isNewArrival: p.isNewArrival,
      rating: parseFloat(p.rating) || 5.0,
      reviewCount: p.reviewCount,
      fabric: p.fabric || undefined,
      care: p.care || undefined,
    };
  });

  if (query?.category && query.category !== 'all') {
    formatted = formatted.filter(p => p.categoryId === query.category);
  }

  if (query?.search) {
    const q = query.search.toLowerCase().trim();
    formatted = formatted.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(q))
    );
  }

  if (query?.featured === 'true') {
    formatted = formatted.filter(p => p.isFeatured);
  }

  if (query?.sort === 'price-asc') {
    formatted.sort((a, b) => a.price - b.price);
  } else if (query?.sort === 'price-desc') {
    formatted.sort((a, b) => b.price - a.price);
  } else if (query?.sort === 'rating') {
    formatted.sort((a, b) => b.rating - a.rating);
  }

  return formatted;
}

export async function getProductByIdFromDb(idOrSlug: string): Promise<Product | null> {
  const list = await db.select().from(products).where(or(eq(products.id, idOrSlug), eq(products.slug, idOrSlug))).limit(1);
  if (list.length === 0) return null;
  const p = list[0];
  let images = [];
  let sizes = [];
  let colors = [];
  try { images = JSON.parse(p.images); } catch { images = []; }
  try { sizes = JSON.parse(p.sizes); } catch { sizes = []; }
  try { colors = JSON.parse(p.colors); } catch { colors = []; }

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description || '',
    price: p.price,
    originalPrice: p.originalPrice || undefined,
    categoryId: p.categoryId,
    subcategory: p.subcategory || undefined,
    images,
    sizes,
    colors,
    stock: p.stock,
    isFeatured: p.isFeatured,
    isNewArrival: p.isNewArrival,
    rating: parseFloat(p.rating) || 5.0,
    reviewCount: p.reviewCount,
    fabric: p.fabric || undefined,
    care: p.care || undefined,
  };
}

export async function createProductInDb(data: any): Promise<Product> {
  const id = 'prod-' + Date.now();
  const slug = (data.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);

  const images = Array.isArray(data.images) && data.images.length > 0 ? data.images : ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'];
  const sizes = Array.isArray(data.sizes) && data.sizes.length > 0 ? data.sizes : ['Free Size'];
  const colors = Array.isArray(data.colors) && data.colors.length > 0 ? data.colors : [{ name: 'Default', hex: '#e11d48' }];

  const res = await db.insert(products).values({
    id,
    slug,
    name: data.name,
    description: data.description || '',
    price: Number(data.price),
    originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
    categoryId: data.categoryId,
    subcategory: data.subcategory || '',
    images: JSON.stringify(images),
    sizes: JSON.stringify(sizes),
    colors: JSON.stringify(colors),
    stock: Number(data.stock ?? 10),
    isFeatured: Boolean(data.isFeatured),
    isNewArrival: Boolean(data.isNewArrival ?? true),
    rating: '5.0',
    reviewCount: 1,
    fabric: data.fabric || 'Cotton Blend',
    care: data.care || 'Gentle wash',
  }).returning();

  return getProductByIdFromDb(res[0].id) as Promise<Product>;
}

export async function updateProductInDb(id: string, data: any): Promise<Product> {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = Number(data.price);
  if (data.originalPrice !== undefined) {
    updateData.originalPrice = (data.originalPrice !== null && data.originalPrice !== '' && Number(data.originalPrice) > 0)
      ? Number(data.originalPrice)
      : null;
  }
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.subcategory !== undefined) updateData.subcategory = data.subcategory;
  if (data.stock !== undefined) updateData.stock = Number(data.stock);
  if (data.isFeatured !== undefined) updateData.isFeatured = Boolean(data.isFeatured);
  if (data.isNewArrival !== undefined) updateData.isNewArrival = Boolean(data.isNewArrival);
  if (data.fabric !== undefined) updateData.fabric = data.fabric;
  if (data.care !== undefined) updateData.care = data.care;
  if (data.images !== undefined) updateData.images = typeof data.images === 'string' ? data.images : JSON.stringify(data.images);
  if (data.sizes !== undefined) updateData.sizes = typeof data.sizes === 'string' ? data.sizes : JSON.stringify(data.sizes);
  if (data.colors !== undefined) updateData.colors = typeof data.colors === 'string' ? data.colors : JSON.stringify(data.colors);

  const existing = await getProductByIdFromDb(id);
  if (!existing) {
    return createProductInDb({ ...data, id });
  }

  await db.update(products).set(updateData).where(eq(products.id, id));
  const updated = await getProductByIdFromDb(id);
  return (updated || { ...existing, ...data }) as Product;
}

export async function deleteProductInDb(id: string): Promise<boolean> {
  await db.delete(products).where(eq(products.id, id));
  return true;
}

// Orders queries
export async function getOrdersFromDb(userUid?: string): Promise<Order[]> {
  let list;
  if (userUid) {
    list = await db.select().from(orders).where(eq(orders.userUid, userUid)).orderBy(desc(orders.createdAt));
  } else {
    list = await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  return list.map(o => {
    let items = [];
    try { items = JSON.parse(o.items); } catch { items = []; }

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt ? o.createdAt.toISOString() : new Date().toISOString(),
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerAddress: o.customerAddress,
      districtId: o.districtId,
      districtName: o.districtName,
      deliveryCharge: o.deliveryCharge,
      items,
      subtotal: o.subtotal,
      total: o.total,
      paymentMethod: o.paymentMethod as any,
      paymentStatus: o.paymentStatus as any,
      status: o.status as any,
      notes: o.notes || undefined,
      cancellationReason: o.cancellationReason || undefined,
      userUid: o.userUid || undefined,
    };
  });
}

export async function trackOrdersInDb(query: string): Promise<Order[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  const list = await db.select().from(orders).where(
    or(
      ilike(orders.orderNumber, `%${cleanQuery}%`),
      ilike(orders.customerPhone, `%${cleanQuery}%`),
      ilike(orders.id, `%${cleanQuery}%`)
    )
  ).orderBy(desc(orders.createdAt));

  return list.map(o => {
    let items = [];
    try { items = JSON.parse(o.items); } catch { items = []; }

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt ? o.createdAt.toISOString() : new Date().toISOString(),
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerAddress: o.customerAddress,
      districtId: o.districtId,
      districtName: o.districtName,
      deliveryCharge: o.deliveryCharge,
      items,
      subtotal: o.subtotal,
      total: o.total,
      paymentMethod: o.paymentMethod as any,
      paymentStatus: o.paymentStatus as any,
      status: o.status as any,
      notes: o.notes || undefined,
      cancellationReason: o.cancellationReason || undefined,
      userUid: o.userUid || undefined,
    };
  });
}

function normalizePhone(phone: string): string {
  if (!phone) return '';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return phone.replace(/[০-৯]/g, d => String(banglaDigits.indexOf(d))).trim();
}

export async function createOrderInDb(orderData: any, userUid?: string): Promise<Order> {
  const id = 'ord-' + Date.now();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const orderNumber = `FA-${randomSuffix}`;

  // Find district charge from db
  const districtList = await db.select().from(districts).where(eq(districts.id, orderData.districtId)).limit(1);
  const deliveryCharge = districtList[0] ? districtList[0].charge : (orderData.districtId === 'dhaka' ? 80 : 150);
  const districtName = districtList[0] ? districtList[0].name : orderData.districtId;

  const subtotal = orderData.items.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0);
  const total = subtotal + deliveryCharge;

  const normalizedPhone = normalizePhone(orderData.customerPhone);

  const newOrder = {
    id,
    orderNumber,
    customerName: orderData.customerName,
    customerPhone: normalizedPhone,
    customerAddress: orderData.customerAddress,
    districtId: orderData.districtId,
    districtName,
    deliveryCharge,
    items: JSON.stringify(orderData.items),
    subtotal,
    total,
    paymentMethod: orderData.paymentMethod || 'cod',
    paymentStatus: 'pending',
    status: 'Pending',
    notes: orderData.notes || '',
    cancellationReason: null,
    userUid: userUid || orderData.userUid || null,
  };

  await db.insert(orders).values(newOrder);

  // Deduct product stock in PostgreSQL
  for (const item of orderData.items) {
    const prodList = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
    if (prodList[0] && prodList[0].stock > 0) {
      const newStock = Math.max(0, prodList[0].stock - item.quantity);
      await db.update(products).set({ stock: newStock }).where(eq(products.id, item.productId));
    }
  }

  return {
    id,
    orderNumber,
    createdAt: new Date().toISOString(),
    customerName: orderData.customerName,
    customerPhone: orderData.customerPhone,
    customerAddress: orderData.customerAddress,
    districtId: orderData.districtId,
    districtName,
    deliveryCharge,
    items: orderData.items,
    subtotal,
    total,
    paymentMethod: orderData.paymentMethod || 'cod',
    paymentStatus: 'pending',
    status: 'Pending',
    notes: orderData.notes || undefined,
    cancellationReason: undefined,
    userUid: userUid || orderData.userUid || undefined,
  };
}

export async function updateOrderStatusInDb(id: string, status: string, cancellationReason?: string): Promise<Order> {
  const paymentStatus = status === 'Delivered' ? 'paid' : 'pending';
  const updatePayload: any = { status, paymentStatus };
  if (cancellationReason !== undefined) {
    updatePayload.cancellationReason = cancellationReason;
  }

  const updated = await db.update(orders)
    .set(updatePayload)
    .where(eq(orders.id, id))
    .returning();

  if (!updated[0]) throw new Error('Order not found');
  const o = updated[0];
  let items = [];
  try { items = JSON.parse(o.items); } catch { items = []; }

  return {
    id: o.id,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt ? o.createdAt.toISOString() : new Date().toISOString(),
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerAddress: o.customerAddress,
    districtId: o.districtId,
    districtName: o.districtName,
    deliveryCharge: o.deliveryCharge,
    items,
    subtotal: o.subtotal,
    total: o.total,
    paymentMethod: o.paymentMethod as any,
    paymentStatus: o.paymentStatus as any,
    status: o.status as any,
    notes: o.notes || undefined,
    cancellationReason: o.cancellationReason || undefined,
    userUid: o.userUid || undefined,
  };
}

export async function getDashboardStatsFromDb(): Promise<DashboardStats> {
  const allOrders = await db.select().from(orders);
  const allProducts = await db.select().from(products);

  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter(o => o.status === 'Pending').length;
  const deliveredOrders = allOrders.filter(o => o.status === 'Delivered').length;
  const totalRevenue = allOrders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const totalProducts = allProducts.length;
  const outOfStockProducts = allProducts.filter(p => p.stock <= 0).length;

  return {
    totalRevenue,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalProducts,
    outOfStockProducts,
  };
}
