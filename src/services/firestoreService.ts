import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, User, Product, Category, HeroSlide } from '../types';

const ORDERS_COLLECTION = 'orders';
const USERS_COLLECTION = 'users';
const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';
const HERO_SLIDES_COLLECTION = 'hero_slides';

// Normalize email for document key
function emailToKey(email: string): string {
  return email.trim().toLowerCase().replace(/[.#$[\]]/g, '_');
}

/**
 * Recursively removes all `undefined` properties from an object so Firestore setDoc / updateDoc succeeds.
 * In the Firebase Firestore JavaScript SDK, having `undefined` as a field value immediately throws:
 * "Function setDoc() called with invalid data. Unsupported field value: undefined".
 * Cleaning ensures cross-device uploads never crash silently.
 */
export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        cleaned[key] = cleanForFirestore(val);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Real-time listener for Orders (Live Response)
 * Automatically triggers whenever any device places or updates an order.
 */
export function subscribeToLiveOrders(
  onOrdersUpdated: (orders: Order[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  try {
    const ordersQuery = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    
    return onSnapshot(
      ordersQuery,
      (snapshot) => {
        const orders: Order[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            orderNumber: data.orderNumber || d.id,
            createdAt: data.createdAt || new Date().toISOString(),
            customerName: data.customerName || 'Customer',
            customerPhone: data.customerPhone || '',
            customerAddress: data.customerAddress || '',
            districtId: data.districtId || 'dhaka',
            districtName: data.districtName || 'Dhaka',
            deliveryCharge: Number(data.deliveryCharge || 80),
            items: typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || []),
            subtotal: Number(data.subtotal || 0),
            total: Number(data.total || 0),
            paymentMethod: data.paymentMethod || 'cod',
            paymentStatus: data.paymentStatus || 'pending',
            status: data.status || 'Pending',
            notes: data.notes || '',
            cancellationReason: data.cancellationReason || '',
            userUid: data.userUid || '',
          } as Order;
        });
        onOrdersUpdated(orders);
      },
      (err) => {
        console.warn('Live orders onSnapshot error, falling back to manual fetch:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('Could not initialize live listener:', err);
    return () => {};
  }
}

/**
 * Fetch all orders from Cloud Firestore
 */
export async function getOrdersFromCloud(userUid?: string): Promise<Order[]> {
  try {
    const ordersCol = collection(db, ORDERS_COLLECTION);
    const q = userUid
      ? query(ordersCol, where('userUid', '==', userUid), orderBy('createdAt', 'desc'))
      : query(ordersCol, orderBy('createdAt', 'desc'));

    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        orderNumber: data.orderNumber || d.id,
        createdAt: data.createdAt || new Date().toISOString(),
        customerName: data.customerName || 'Customer',
        customerPhone: data.customerPhone || '',
        customerAddress: data.customerAddress || '',
        districtId: data.districtId || 'dhaka',
        districtName: data.districtName || 'Dhaka',
        deliveryCharge: Number(data.deliveryCharge || 80),
        items: typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || []),
        subtotal: Number(data.subtotal || 0),
        total: Number(data.total || 0),
        paymentMethod: data.paymentMethod || 'cod',
        paymentStatus: data.paymentStatus || 'pending',
        status: data.status || 'Pending',
        notes: data.notes || '',
        cancellationReason: data.cancellationReason || '',
        userUid: data.userUid || '',
      } as Order;
    });
  } catch (err) {
    console.warn('Cloud orders fetch error:', err);
    return [];
  }
}

/**
 * Save an order to Cloud Firestore (Accessible by all devices worldwide)
 */
export async function saveOrderToCloud(order: Order): Promise<void> {
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, order.id);
    const dataToSave = cleanForFirestore({
      ...order,
      // Ensure items is safely serialized if needed
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(orderDocRef, dataToSave, { merge: true });
  } catch (err) {
    console.error('Failed to save order to Firestore:', err);
    throw err;
  }
}

/**
 * Update order status in Cloud Firestore
 */
export async function updateOrderStatusInCloud(
  id: string,
  status: string,
  cancellationReason?: string
): Promise<void> {
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, id);
    await updateDoc(orderDocRef, {
      status,
      cancellationReason: cancellationReason || '',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to update order status in Firestore:', err);
    throw err;
  }
}

/**
 * Register a customer account in Cloud Firestore
 * Allows the customer to log in from ANY device (phone, laptop, Netlify, etc.)
 */
export async function registerCustomerInCloud(
  email: string,
  pass: string,
  name?: string,
  phone?: string
): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const userKey = emailToKey(cleanEmail);
  const userDocRef = doc(db, USERS_COLLECTION, userKey);

  // Check if account already exists
  const existingSnap = await getDoc(userDocRef);
  if (existingSnap.exists()) {
    throw new Error('An account with this email already exists. Please sign in instead.');
  }

  const uid = 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const newUser: User = {
    id: 0,
    uid,
    email: cleanEmail,
    name: name?.trim() || cleanEmail.split('@')[0],
    phone: phone?.trim() || '',
    role: 'customer',
    createdAt: new Date().toISOString(),
  };

  await setDoc(userDocRef, {
    ...newUser,
    password: pass, // Plain/hash for simple cross-device verification
    updatedAt: new Date().toISOString(),
  });

  return newUser;
}

/**
 * Authenticate customer from Cloud Firestore
 * Enables cross-device login for accounts created on any device
 */
export async function loginCustomerFromCloud(email: string, pass: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const userKey = emailToKey(cleanEmail);
  const userDocRef = doc(db, USERS_COLLECTION, userKey);

  const userSnap = await getDoc(userDocRef);
  if (!userSnap.exists()) {
    // Also try checking by querying the email field directly as fallback
    const q = query(collection(db, USERS_COLLECTION), where('email', '==', cleanEmail));
    const querySnap = await getDocs(q);
    if (querySnap.empty) {
      throw new Error('No account found with this email or password incorrect. Please register an account.');
    }
    const docData = querySnap.docs[0].data();
    if (docData.password !== pass) {
      throw new Error('Incorrect password. Please check and try again.');
    }
    return {
      id: Number(docData.id || 0),
      uid: docData.uid,
      email: docData.email,
      name: docData.name || '',
      phone: docData.phone || '',
      role: docData.role || 'customer',
      createdAt: docData.createdAt,
    };
  }

  const data = userSnap.data();
  if (data.password !== pass) {
    throw new Error('Incorrect password. Please check and try again.');
  }

  return {
    id: Number(data.id || 0),
    uid: data.uid,
    email: data.email,
    name: data.name || '',
    phone: data.phone || '',
    role: data.role || 'customer',
    createdAt: data.createdAt,
  };
}

/**
 * Fetch all registered users from Cloud Firestore
 */
export async function getUsersFromCloud(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: Number(data.id || 0),
        uid: data.uid || d.id,
        email: data.email || '',
        name: data.name || '',
        phone: data.phone || '',
        role: data.role || 'customer',
        createdAt: data.createdAt || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.warn('Failed to fetch cloud users:', err);
    return [];
  }
}

/**
 * Delete a user from Cloud Firestore
 */
export async function deleteUserFromCloud(uidOrEmail: string): Promise<void> {
  try {
    const clean = uidOrEmail.trim().toLowerCase();
    const userKey = emailToKey(clean);
    await deleteDoc(doc(db, USERS_COLLECTION, userKey));

    // Also attempt deletion by UID if key was an email or vice versa
    const q = query(collection(db, USERS_COLLECTION), where('uid', '==', uidOrEmail));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(doc(db, USERS_COLLECTION, d.id));
    }
  } catch (err) {
    console.warn('Error deleting user from cloud:', err);
  }
}

/**
 * Real-time listener for Products
 * Automatically updates whenever any product is added, updated, or removed from any device.
 */
export function subscribeToLiveProducts(
  onProductsUpdated: (products: Product[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  try {
    const productsQuery = query(collection(db, PRODUCTS_COLLECTION));
    return onSnapshot(
      productsQuery,
      (snapshot) => {
        if (snapshot.empty) return;
        const prods: Product[] = snapshot.docs.map((d) => {
          const data = d.data();
          let images: string[] = [];
          let sizes: string[] = [];
          let colors: any[] = [];
          if (Array.isArray(data.images)) images = data.images;
          else if (typeof data.images === 'string') {
            try { images = JSON.parse(data.images); } catch { images = [data.images]; }
          }
          if (Array.isArray(data.sizes)) sizes = data.sizes;
          else if (typeof data.sizes === 'string') {
            try { sizes = JSON.parse(data.sizes); } catch { sizes = ['Standard']; }
          }
          if (Array.isArray(data.colors)) colors = data.colors;
          else if (typeof data.colors === 'string') {
            try { colors = JSON.parse(data.colors); } catch { colors = []; }
          }

          return {
            id: d.id,
            productCode: data.productCode || undefined,
            slug: data.slug || d.id,
            name: data.name || 'Product',
            description: data.description || '',
            price: Number(data.price || 0),
            originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
            categoryId: data.categoryId || 'sarees',
            subcategory: data.subcategory || undefined,
            images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'],
            sizes: sizes.length > 0 ? sizes : ['Standard'],
            colors: colors.length > 0 ? colors : [{ name: 'Default', hex: '#BE185D' }],
            stock: Number(data.stock ?? 10),
            isFeatured: Boolean(data.isFeatured),
            isNewArrival: Boolean(data.isNewArrival),
            rating: Number(data.rating || 5.0),
            reviewCount: Number(data.reviewCount || 1),
            fabric: data.fabric || undefined,
            care: data.care || undefined,
            createdAt: data.createdAt || undefined,
            updatedAt: data.updatedAt || undefined,
          } as Product;
        });

        prods.sort((a, b) => {
          const timeA = (a as any).updatedAt || (a as any).createdAt || '';
          const timeB = (b as any).updatedAt || (b as any).createdAt || '';
          if (timeA && timeB) return timeB.localeCompare(timeA);
          return 0;
        });

        onProductsUpdated(prods);
      },
      (err) => {
        console.warn('Live products onSnapshot error:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('Could not initialize live products listener:', err);
    return () => {};
  }
}

/**
 * Real-time listener for Categories
 * Automatically triggers whenever any category is added, updated, or removed from any device.
 */
export function subscribeToLiveCategories(
  onCategoriesUpdated: (categories: Category[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  try {
    const categoriesQuery = query(collection(db, CATEGORIES_COLLECTION));
    return onSnapshot(
      categoriesQuery,
      (snapshot) => {
        if (snapshot.empty) return;
        const cats: Category[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || 'Category',
            slug: data.slug || d.id,
            description: data.description || '',
            image: data.image || '',
            itemCount: Number(data.itemCount || 0),
          };
        });
        onCategoriesUpdated(cats);
      },
      (err) => {
        console.warn('Live categories onSnapshot error:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('Could not initialize live categories listener:', err);
    return () => {};
  }
}

/**
 * Save product to Cloud Firestore
 * Uploads the product immediately so all visitors on any device see it live
 */
export async function saveProductToCloud(product: Product): Promise<void> {
  try {
    const prodId = product.id || ('prod-' + Date.now());
    const prodDocRef = doc(db, PRODUCTS_COLLECTION, prodId);
    const hasValidDiscount = Boolean(product.originalPrice && Number(product.originalPrice) > Number(product.price));
    const dataToSave = cleanForFirestore({
      ...product,
      id: prodId,
      originalPrice: hasValidDiscount ? Number(product.originalPrice) : null,
      updatedAt: new Date().toISOString(),
      createdAt: (product as any).createdAt || new Date().toISOString(),
    });
    await setDoc(prodDocRef, dataToSave, { merge: true });
    console.log(`[Cloud Firestore] Product "${product.name}" (${prodId}) saved live to cloud.`);
  } catch (err) {
    console.error('Cloud Firestore saveProduct error:', err);
    throw err;
  }
}

/**
 * Delete product from Cloud Firestore
 */
export async function deleteProductFromCloud(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
    console.log(`[Cloud Firestore] Product (${productId}) removed from cloud.`);
  } catch (err) {
    console.warn('Cloud Firestore deleteProduct note:', err);
  }
}

/**
 * Save category to Cloud Firestore
 * Uploads the category immediately so all visitors on any device see it live
 */
export async function saveCategoryToCloud(category: Category): Promise<void> {
  try {
    const catId = category.id || ('cat-' + Date.now());
    const catDocRef = doc(db, CATEGORIES_COLLECTION, catId);
    const dataToSave = cleanForFirestore({
      ...category,
      id: catId,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(catDocRef, dataToSave, { merge: true });
    console.log(`[Cloud Firestore] Category "${category.name}" (${catId}) saved live to cloud.`);
  } catch (err) {
    console.error('Cloud Firestore saveCategory error:', err);
    throw err;
  }
}

/**
 * Delete category from Cloud Firestore
 */
export async function deleteCategoryFromCloud(categoryId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, categoryId));
    console.log(`[Cloud Firestore] Category (${categoryId}) removed from cloud.`);
  } catch (err) {
    console.warn('Cloud Firestore deleteCategory note:', err);
  }
}

/**
 * Fetch all products from Cloud Firestore
 */
export async function getProductsFromCloud(): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    if (snap.empty) return [];
    const prods = snap.docs.map((d) => {
      const data = d.data();
      let images: string[] = [];
      let sizes: string[] = [];
      let colors: any[] = [];
      if (Array.isArray(data.images)) images = data.images;
      else if (typeof data.images === 'string') {
        try { images = JSON.parse(data.images); } catch { images = [data.images]; }
      }
      if (Array.isArray(data.sizes)) sizes = data.sizes;
      else if (typeof data.sizes === 'string') {
        try { sizes = JSON.parse(data.sizes); } catch { sizes = ['Standard']; }
      }
      if (Array.isArray(data.colors)) colors = data.colors;
      else if (typeof data.colors === 'string') {
        try { colors = JSON.parse(data.colors); } catch { colors = []; }
      }

      return {
        id: d.id,
        slug: data.slug || d.id,
        name: data.name || 'Product',
        description: data.description || '',
        price: Number(data.price || 0),
        originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
        categoryId: data.categoryId || 'sarees',
        subcategory: data.subcategory || undefined,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'],
        sizes: sizes.length > 0 ? sizes : ['Standard'],
        colors: colors.length > 0 ? colors : [{ name: 'Default', hex: '#BE185D' }],
        stock: Number(data.stock ?? 10),
        isFeatured: Boolean(data.isFeatured),
        isNewArrival: Boolean(data.isNewArrival),
        rating: Number(data.rating || 5.0),
        reviewCount: Number(data.reviewCount || 1),
        fabric: data.fabric || undefined,
        care: data.care || undefined,
        createdAt: data.createdAt || undefined,
        updatedAt: data.updatedAt || undefined,
      } as Product;
    });

    prods.sort((a, b) => {
      const timeA = (a as any).updatedAt || (a as any).createdAt || '';
      const timeB = (b as any).updatedAt || (b as any).createdAt || '';
      if (timeA && timeB) return timeB.localeCompare(timeA);
      return 0;
    });

    return prods;
  } catch (err) {
    console.warn('Failed to fetch products from Cloud Firestore:', err);
    return [];
  }
}

/**
 * Fetch all categories from Cloud Firestore
 */
export async function getCategoriesFromCloud(): Promise<Category[]> {
  try {
    const snap = await getDocs(collection(db, CATEGORIES_COLLECTION));
    if (snap.empty) return [];
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || 'Category',
        slug: data.slug || d.id,
        description: data.description || '',
        image: data.image || '',
        itemCount: Number(data.itemCount || 0),
      };
    });
  } catch (err) {
    console.warn('Failed to fetch categories from Cloud Firestore:', err);
    return [];
  }
}

/**
 * Seed initial categories & products to Cloud Firestore if empty
 * Ensures every visitor across any device immediately has access to full catalog
 */
export async function seedCatalogToCloudIfEmpty(
  initialCategories: Category[],
  initialProducts: Product[]
): Promise<void> {
  try {
    const catSnap = await getDocs(collection(db, CATEGORIES_COLLECTION));
    if (catSnap.empty && initialCategories.length > 0) {
      console.log('Auto-populating Cloud Firestore categories for website...');
      for (const cat of initialCategories) {
        await setDoc(doc(db, CATEGORIES_COLLECTION, cat.id), cleanForFirestore({
          ...cat,
          createdAt: new Date().toISOString(),
        }), { merge: true });
      }
    }

    const prodSnap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    if (prodSnap.empty && initialProducts.length > 0) {
      console.log('Auto-populating Cloud Firestore products for website...');
      for (const prod of initialProducts) {
        await setDoc(doc(db, PRODUCTS_COLLECTION, prod.id), cleanForFirestore({
          ...prod,
          createdAt: new Date().toISOString(),
        }), { merge: true });
      }
    }
  } catch (err) {
    console.warn('Seed catalog to cloud note:', err);
  }
}

/**
 * Sync all products to Cloud Firestore in batch
 * Useful to push any locally or database stored products to cloud for multi-device sync
 */
export async function syncAllProductsToCloud(products: Product[]): Promise<number> {
  let count = 0;
  for (const prod of products) {
    try {
      await saveProductToCloud(prod);
      count++;
    } catch (err) {
      console.warn(`Failed to sync product ${prod.id} to cloud:`, err);
    }
  }
  return count;
}

/**
 * Sync all categories to Cloud Firestore in batch
 */
export async function syncAllCategoriesToCloud(categories: Category[]): Promise<number> {
  let count = 0;
  for (const cat of categories) {
    try {
      await saveCategoryToCloud(cat);
      count++;
    } catch (err) {
      console.warn(`Failed to sync category ${cat.id} to cloud:`, err);
    }
  }
  return count;
}

/**
 * Real-time listener for Hero Banner Slides
 * Updates immediately across all devices when admin modifies banner slides
 */
export function subscribeToLiveHeroSlides(
  onSlidesUpdated: (slides: HeroSlide[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  try {
    const slidesQuery = query(collection(db, HERO_SLIDES_COLLECTION));
    return onSnapshot(
      slidesQuery,
      (snapshot) => {
        if (snapshot.empty) return;
        const slides: HeroSlide[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title || '',
            subtitle: data.subtitle || '',
            category: data.category || 'all',
            image: data.image || '',
            cta: data.cta || 'Shop Now',
            order: Number(data.order || 0),
            isActive: data.isActive !== false,
            createdAt: data.createdAt || undefined,
            updatedAt: data.updatedAt || undefined,
          };
        });

        slides.sort((a, b) => (a.order || 0) - (b.order || 0));
        onSlidesUpdated(slides);
      },
      (err) => {
        console.warn('Live hero slides onSnapshot error:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('Could not initialize live hero slides listener:', err);
    return () => {};
  }
}

/**
 * Fetch all hero slides from Cloud Firestore
 */
export async function getHeroSlidesFromCloud(): Promise<HeroSlide[]> {
  try {
    const snap = await getDocs(collection(db, HERO_SLIDES_COLLECTION));
    if (snap.empty) return [];
    const slides: HeroSlide[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title || '',
        subtitle: data.subtitle || '',
        category: data.category || 'all',
        image: data.image || '',
        cta: data.cta || 'Shop Now',
        order: Number(data.order || 0),
        isActive: data.isActive !== false,
        createdAt: data.createdAt || undefined,
        updatedAt: data.updatedAt || undefined,
      };
    });
    slides.sort((a, b) => (a.order || 0) - (b.order || 0));
    return slides;
  } catch (err) {
    console.warn('Failed to fetch hero slides from Cloud Firestore:', err);
    return [];
  }
}

/**
 * Save hero slide to Cloud Firestore
 */
export async function saveHeroSlideToCloud(slide: HeroSlide): Promise<void> {
  try {
    const slideId = slide.id || ('slide-' + Date.now());
    const slideDocRef = doc(db, HERO_SLIDES_COLLECTION, slideId);
    const dataToSave = cleanForFirestore({
      ...slide,
      id: slideId,
      updatedAt: new Date().toISOString(),
      createdAt: slide.createdAt || new Date().toISOString(),
    });
    await setDoc(slideDocRef, dataToSave, { merge: true });
    console.log(`[Cloud Firestore] Hero slide "${slide.title}" (${slideId}) saved live.`);
  } catch (err) {
    console.error('Cloud Firestore saveHeroSlide error:', err);
    throw err;
  }
}

/**
 * Delete hero slide from Cloud Firestore
 */
export async function deleteHeroSlideFromCloud(slideId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, HERO_SLIDES_COLLECTION, slideId));
    console.log(`[Cloud Firestore] Hero slide (${slideId}) deleted from cloud.`);
  } catch (err) {
    console.warn('Cloud Firestore deleteHeroSlide note:', err);
  }
}

/**
 * Seed initial hero slides to Cloud Firestore if empty
 */
export async function seedHeroSlidesIfEmpty(initialSlides: HeroSlide[]): Promise<void> {
  try {
    const snap = await getDocs(collection(db, HERO_SLIDES_COLLECTION));
    if (snap.empty && initialSlides.length > 0) {
      console.log('Auto-populating Cloud Firestore hero slides...');
      for (const slide of initialSlides) {
        await setDoc(doc(db, HERO_SLIDES_COLLECTION, slide.id), cleanForFirestore({
          ...slide,
          createdAt: new Date().toISOString(),
        }), { merge: true });
      }
    }
  } catch (err) {
    console.warn('Seed hero slides note:', err);
  }
}
