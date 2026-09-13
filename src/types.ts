export interface District {
  id: string;
  name: string;
  bnName: string;
  division: string;
  charge: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  itemCount?: number;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  subcategory?: string;
  images: string[];
  sizes: string[];
  colors: ProductColor[];
  stock: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  rating: number;
  reviewCount: number;
  fabric?: string;
  care?: string;
}

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  districtId: string;
  districtName: string;
  deliveryCharge: number;
  items: OrderItem[];
  subtotal: number;
  total: number;
  paymentMethod: 'cod' | 'bkash' | 'nagad';
  paymentStatus: 'pending' | 'paid';
  status: OrderStatus;
  notes?: string;
  cancellationReason?: string;
  userUid?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalProducts: number;
  outOfStockProducts: number;
}

export interface User {
  id?: number;
  uid: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'customer' | 'admin';
  createdAt?: string;
}

