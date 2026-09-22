import { pgTable, text, serial, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

// Users table (for customers & admins)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase UID or generated customer ID
  email: text('email').notNull().unique(),
  name: text('name'),
  phone: text('phone'),
  password: text('password'), // encrypted/hashed or direct password for simple customer login
  role: text('role').notNull().default('customer'), // 'customer' | 'admin'
  createdAt: timestamp('created_at').defaultNow(),
});

// Categories table
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  originalPrice: integer('original_price'),
  categoryId: text('category_id').notNull(),
  subcategory: text('subcategory'),
  images: text('images').notNull(), // JSON string
  sizes: text('sizes').notNull(), // JSON string
  colors: text('colors').notNull(), // JSON string
  stock: integer('stock').notNull().default(10),
  isFeatured: boolean('is_featured').notNull().default(false),
  isNewArrival: boolean('is_new_arrival').notNull().default(true),
  rating: text('rating').notNull().default('5.0'),
  reviewCount: integer('review_count').notNull().default(1),
  fabric: text('fabric'),
  care: text('care'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Districts table (Single Source of Truth for delivery charges)
export const districts = pgTable('districts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  bnName: text('bn_name'),
  division: text('division').notNull(),
  charge: integer('charge').notNull().default(150),
});

// Orders table
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerAddress: text('customer_address').notNull(),
  districtId: text('district_id').notNull(),
  districtName: text('district_name').notNull(),
  deliveryCharge: integer('delivery_charge').notNull(),
  items: text('items').notNull(), // JSON string of items
  subtotal: integer('subtotal').notNull(),
  total: integer('total').notNull(),
  paymentMethod: text('payment_method').notNull().default('cod'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  status: text('status').notNull().default('Pending'),
  notes: text('notes'),
  cancellationReason: text('cancellation_reason'),
  userUid: text('user_uid'),
  createdAt: timestamp('created_at').defaultNow(),
});
