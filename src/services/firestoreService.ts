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
import { Order, User } from '../types';

const ORDERS_COLLECTION = 'orders';
const USERS_COLLECTION = 'users';

// Normalize email for document key
function emailToKey(email: string): string {
  return email.trim().toLowerCase().replace(/[.#$[\]]/g, '_');
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
    await setDoc(orderDocRef, {
      ...order,
      // Ensure items is safely serialized if needed
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
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
