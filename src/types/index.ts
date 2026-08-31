export type Role = 'customer' | 'counter' | 'owner' | 'admin';
export type UserStatus = 'active' | 'suspended';
export type CafeStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'rejected';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed';
export type FulfillmentType = 'dine_in' | 'takeaway';
export type PaymentMethod = 'card' | 'upi' | 'wallet' | 'cash';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: Role;
  status: UserStatus;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface Cafe {
  id: string;
  name: string;
  slug: string;
  ownerId?: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  gstNumber?: string | null;
  licenseNumber?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  status?: CafeStatus;
  rejectionReason?: string | null;
  isOpen: boolean;
  currency: string;
  taxRate: number;
  welcomeMessage?: string | null;
  announcement?: string | null;
  createdAt?: string;
  _count?: { menuItems?: number; orders?: number; staff?: number };
}

export interface Counter {
  id: string;
  cafeId: string;
  name: string;
  code: string;
  isActive: boolean;
  staff?: CafeStaff[];
}

export interface CafeStaff {
  id: string;
  cafeId: string;
  userId: string;
  title: string;
  isActive: boolean;
  counterId?: string | null;
  createdAt?: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'lastLoginAt' | 'status'>;
  counter?: { id: string; name: string } | null;
}

export interface MenuCategory {
  id: string;
  cafeId: string;
  name: string;
  sortOrder: number;
  items?: MenuItem[];
}

export interface MenuItem {
  id: string;
  cafeId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  prepMinutes: number;
  category?: { name: string };
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  lineTotal: number;
  menuItem?: { id: string; name: string; imageUrl?: string | null };
}

export interface OrderEvent {
  id: string;
  status: OrderStatus;
  note?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  cafeId: string;
  customerId: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  paymentStatus: PaymentStatus;
  paymentMethod?: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes?: string | null;
  tableNumber?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  cancelReason?: string | null;
  placedAt: string;
  acceptedAt?: string | null;
  readyAt?: string | null;
  completedAt?: string | null;
  etaMinutes?: number;
  queuePosition?: number;
  items: OrderItem[];
  events?: OrderEvent[];
  cafe?: Pick<Cafe, 'id' | 'name' | 'slug' | 'currency'> & { phone?: string | null };
  counter?: { id: string; name: string } | null;
  customer?: Pick<User, 'id' | 'name' | 'email' | 'phone'>;
}

export interface KitchenLoad {
  activeOrders: number;
  backlogMinutes: number;
  queue: string[];
}

export interface PresenceEntry {
  userId: string;
  name: string;
  role: 'owner' | 'counter';
  counterId: string | null;
  counterName: string | null;
  online: boolean;
  connectedAt: string;
  lastSeenAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
}

export interface GuestContext {
  cafeId: string;
  cafeSlug: string;
  cafeName: string;
  tableId: string;
  tableLabel: string;
}

export interface Identity {
  user: User;
  cafe: Cafe | null;
  staff: {
    id: string;
    title: string;
    counterId: string | null;
    counterName: string | null;
    isActive: boolean;
  } | null;
  guest?: GuestContext | null;
}

export interface CafeTable {
  id: string;
  label: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  qrUrl: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; pageSize: number; pages: number };
}
