import { FALLBACK_CAFES, FALLBACK_PUBLIC_MENUS } from '../data/fallbackData';
import type {
  Cafe,
  Identity,
  Order,
  OrderItem,
  OrderStatus,
  Paginated,
  User,
} from '../types';
import type { RegisterPayload } from './authService';
import type { PlaceOrderPayload } from './orderService';
import type { PublicMenu } from './menuService';

const baseUrl = import.meta.env.BASE_URL || '/';

export function isStaticPreview(): boolean {
  if (typeof window === 'undefined') return false;
  const isGh =
    window.location.hostname.includes('github.io') ||
    window.location.hostname.includes('pages.dev');
  const hasNoRemoteApi = !import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL === '';
  return isGh && hasNoRemoteApi;
}

export function isOfflineError(error: unknown): boolean {
  if (isStaticPreview()) return true;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('network error') ||
      msg.includes('err_connection_refused') ||
      msg.includes('failed to fetch') ||
      msg.includes('timeout') ||
      msg.includes('mixed content') ||
      msg.includes('networkerror')
    );
  }
  return false;
}

// -------------------------------------------------------------
// USER & IDENTITY STORAGE
// -------------------------------------------------------------

interface StoredUser {
  email: string;
  password?: string;
  identity: Identity;
}

function readStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem('fpc.users');
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeStoredUsers(users: StoredUser[]) {
  try {
    localStorage.setItem('fpc.users', JSON.stringify(users));
  } catch {
    /* ignore */
  }
}

export function mockRegister(payload: RegisterPayload): Identity {
  const userId = `usr-${Date.now()}`;
  const user: User = {
    id: userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    phone: payload.phone || null,
    status: 'active',
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  };

  let cafe: Cafe | undefined = undefined;
  if (payload.role === 'owner') {
    const cafeName = payload.cafe?.name || `${payload.name}'s Cafe`;
    const cafeSlug = cafeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const cafeId = `cafe-${Date.now()}`;

    cafe = {
      id: cafeId,
      name: cafeName,
      slug: cafeSlug,
      ownerId: user.id,
      description:
        payload.cafe?.description ||
        `Artisanal coffee and fresh gourmet dining in ${payload.cafe?.city || 'the neighborhood'}. Hand-crafted roasts and kitchen specials.`,
      status: 'approved',
      isOpen: true,
      addressLine: payload.cafe?.addressLine || 'Main High Street',
      city: payload.cafe?.city || 'Pune',
      state: payload.cafe?.state || 'Maharashtra',
      country: 'India',
      phone: payload.phone || '+91 98765 00000',
      email: payload.email,
      currency: 'INR',
      taxRate: 5,
      logoUrl: `${baseUrl}front-page-cafe-logo.png`,
      bannerUrl:
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1200',
      welcomeMessage: `Welcome to ${cafeName}! Scan table QR or order at the counter.`,
      announcement: 'Specialty roasts and freshly prepared wood-fired delights.',
      createdAt: new Date().toISOString(),
      _count: { menuItems: 6, orders: 0, staff: 1 },
    };

    saveCustomCafe(cafe);
    createDefaultMenuForCafe(cafe);
  }

  const identity: Identity = { user, cafe: cafe ?? null, staff: null };

  // Persist into mock user database
  const users = readStoredUsers();
  users.push({ email: payload.email.toLowerCase(), password: payload.password, identity });
  writeStoredUsers(users);

  // Set session tokens in localStorage
  localStorage.setItem('fpc.access', `local-access-${userId}`);
  localStorage.setItem('fpc.refresh', `local-refresh-${userId}`);
  localStorage.setItem('fpc.identity', JSON.stringify(identity));

  return identity;
}

export function mockLogin(email: string, _password?: string): Identity {
  const normEmail = email.toLowerCase().trim();
  const users = readStoredUsers();
  const found = users.find((u) => u.email === normEmail);
  if (found) {
    localStorage.setItem('fpc.access', `local-access-${found.identity.user.id}`);
    localStorage.setItem('fpc.refresh', `local-refresh-${found.identity.user.id}`);
    localStorage.setItem('fpc.identity', JSON.stringify(found.identity));
    return found.identity;
  }

  // Pre-configured role accounts
  if (normEmail.includes('owner') || normEmail.includes('cafe')) {
    const defaultOwnerCafe = FALLBACK_CAFES[0];
    const identity: Identity = {
      user: {
        id: 'usr-owner-demo',
        email: normEmail,
        name: 'Cafe Owner',
        role: 'owner',
        status: 'active',
      },
      cafe: defaultOwnerCafe,
      staff: null,
    };
    localStorage.setItem('fpc.access', 'local-access-owner-demo');
    localStorage.setItem('fpc.identity', JSON.stringify(identity));
    return identity;
  }

  if (normEmail.includes('counter') || normEmail.includes('barista')) {
    const identity: Identity = {
      user: {
        id: 'usr-counter-demo',
        email: normEmail,
        name: 'Barista Alex',
        role: 'counter',
        status: 'active',
      },
      cafe: FALLBACK_CAFES[0],
      staff: {
        id: 'staff-demo-1',
        title: 'Lead Barista',
        isActive: true,
        counterId: 'cnt-1',
        counterName: 'Main Espresso Bar',
      },
    };
    localStorage.setItem('fpc.access', 'local-access-counter-demo');
    localStorage.setItem('fpc.identity', JSON.stringify(identity));
    return identity;
  }

  // Generic Customer Login
  const namePart = normEmail.split('@')[0].replace(/[._-]/g, ' ');
  const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  return mockRegister({
    name: formattedName || 'Guest User',
    email: normEmail,
    password: 'password123',
    role: 'customer',
  });
}

// -------------------------------------------------------------
// CUSTOM CAFES STORAGE
// -------------------------------------------------------------

export function getCustomCafes(): Cafe[] {
  try {
    const raw = localStorage.getItem('fpc.custom_cafes');
    return raw ? (JSON.parse(raw) as Cafe[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomCafe(cafe: Cafe) {
  try {
    const list = getCustomCafes();
    const idx = list.findIndex((c) => c.id === cafe.id || c.slug === cafe.slug);
    if (idx >= 0) list[idx] = cafe;
    else list.unshift(cafe);
    localStorage.setItem('fpc.custom_cafes', JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function getAllCafesMerged(params: { q?: string; city?: string; page?: number; pageSize?: number } = {}): Paginated<Cafe> {
  const custom = getCustomCafes();
  let list = [...custom, ...FALLBACK_CAFES];

  // Remove duplicates by slug
  const seen = new Set<string>();
  list = list.filter((c) => {
    if (seen.has(c.slug)) return false;
    seen.add(c.slug);
    return true;
  });

  if (params.q) {
    const q = params.q.toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)),
    );
  }
  if (params.city) {
    const city = params.city.toLowerCase();
    list = list.filter((c) => c.city && c.city.toLowerCase() === city);
  }

  const page = params.page || 1;
  const pageSize = params.pageSize || 30;
  return {
    data: list.slice((page - 1) * pageSize, page * pageSize),
    meta: {
      page,
      pageSize,
      total: list.length,
      pages: Math.ceil(list.length / pageSize),
    },
  };
}

export function getCafeByIdOrSlug(idOrSlug: string): Cafe {
  const custom = getCustomCafes();
  const match = custom.find((c) => c.slug === idOrSlug || c.id === idOrSlug);
  if (match) return match;
  return (
    FALLBACK_CAFES.find((c) => c.slug === idOrSlug || c.id === idOrSlug) ||
    FALLBACK_CAFES[0]
  );
}

// -------------------------------------------------------------
// MENU STORAGE FOR CUSTOM CAFES
// -------------------------------------------------------------

function createDefaultMenuForCafe(cafe: Cafe) {
  const publicMenu: PublicMenu = {
    cafe: {
      id: cafe.id,
      name: cafe.name,
      slug: cafe.slug,
      isOpen: cafe.isOpen,
      taxRate: cafe.taxRate,
      currency: cafe.currency,
      logoUrl: cafe.logoUrl,
      bannerUrl: cafe.bannerUrl,
      description: cafe.description,
      welcomeMessage: cafe.welcomeMessage,
      announcement: cafe.announcement,
    },
    categories: [
      {
        id: `cat-${cafe.id}-1`,
        cafeId: cafe.id,
        name: 'Specialty Coffee',
        sortOrder: 1,
        items: [
          {
            id: `item-${cafe.id}-1`,
            cafeId: cafe.id,
            categoryId: `cat-${cafe.id}-1`,
            name: 'Artisan Pour-Over',
            description: 'Single-origin Ethiopian Yirgacheffe with floral jasmine and bergamot notes.',
            price: 240,
            isVeg: true,
            isAvailable: true,
            isFeatured: true,
            prepMinutes: 5,
            imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800',
          },
          {
            id: `item-${cafe.id}-2`,
            cafeId: cafe.id,
            categoryId: `cat-${cafe.id}-1`,
            name: 'Velvet Flat White',
            description: 'Double ristretto blended with silky steamed whole milk.',
            price: 210,
            isVeg: true,
            isAvailable: true,
            isFeatured: false,
            prepMinutes: 4,
            imageUrl: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&q=80&w=800',
          },
          {
            id: `item-${cafe.id}-3`,
            cafeId: cafe.id,
            categoryId: `cat-${cafe.id}-1`,
            name: 'Nitro Cold Brew',
            description: '18-hour cold steeped coffee infused with nitrogen for creamy foam.',
            price: 230,
            isVeg: true,
            isAvailable: true,
            isFeatured: false,
            prepMinutes: 2,
            imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&q=80&w=800',
          },
        ],
      },
      {
        id: `cat-${cafe.id}-2`,
        cafeId: cafe.id,
        name: 'Fresh Kitchen & Bakes',
        sortOrder: 2,
        items: [
          {
            id: `item-${cafe.id}-4`,
            cafeId: cafe.id,
            categoryId: `cat-${cafe.id}-2`,
            name: 'Wood-Fired Margherita Pizza',
            description: 'Slow-fermented sourdough, San Marzano tomato sugo, fresh mozzarella, and sweet basil.',
            price: 380,
            isVeg: true,
            isAvailable: true,
            isFeatured: true,
            prepMinutes: 12,
            imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800',
          },
          {
            id: `item-${cafe.id}-5`,
            cafeId: cafe.id,
            categoryId: `cat-${cafe.id}-2`,
            name: 'Flaky French Butter Croissant',
            description: 'Hand-laminated with pure butter, baked fresh every morning.',
            price: 150,
            isVeg: true,
            isAvailable: true,
            isFeatured: false,
            prepMinutes: 2,
            imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800',
          },
          {
            id: `item-${cafe.id}-6`,
            cafeId: cafe.id,
            categoryId: `cat-${cafe.id}-2`,
            name: 'Rosemary Garlic Wedges',
            description: 'Crispy skin-on potato wedges tossed in sea salt and fresh garden rosemary.',
            price: 170,
            isVeg: true,
            isAvailable: true,
            isFeatured: false,
            prepMinutes: 8,
            imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=800',
          },
        ],
      },
    ],
  };

  try {
    const raw = localStorage.getItem('fpc.custom_menus') || '{}';
    const store = JSON.parse(raw) as Record<string, PublicMenu>;
    store[cafe.slug] = publicMenu;
    store[cafe.id] = publicMenu;
    localStorage.setItem('fpc.custom_menus', JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function getPublicMenuForCafe(cafeIdOrSlug: string): PublicMenu {
  try {
    const raw = localStorage.getItem('fpc.custom_menus') || '{}';
    const store = JSON.parse(raw) as Record<string, PublicMenu>;
    if (store[cafeIdOrSlug]) return store[cafeIdOrSlug];
  } catch {
    /* ignore */
  }

  return FALLBACK_PUBLIC_MENUS[cafeIdOrSlug] || FALLBACK_PUBLIC_MENUS['front-page-cafe'];
}

// -------------------------------------------------------------
// ORDERS STORAGE & REALTIME SIMULATION
// -------------------------------------------------------------

export function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem('fpc.orders');
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredOrders(orders: Order[]) {
  try {
    localStorage.setItem('fpc.orders', JSON.stringify(orders));
  } catch {
    /* ignore */
  }
}

export function mockPlaceOrder(payload: PlaceOrderPayload): Order {
  const cafe = getCafeByIdOrSlug(payload.cafeId || 'cafe-front-page');
  const menu = getPublicMenuForCafe(cafe.slug);

  const allItems = menu.categories.flatMap((c) => c.items);
  let subtotal = 0;
  const lineItems: OrderItem[] = payload.items.map((pi) => {
    const item = allItems.find((i) => i.id === pi.menuItemId) || {
      id: pi.menuItemId,
      name: 'Artisan Cafe Item',
      price: 220,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800',
    };
    const lineTotal = item.price * pi.quantity;
    subtotal += lineTotal;
    return {
      id: `oi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      menuItemId: item.id,
      nameSnapshot: item.name,
      priceSnapshot: item.price,
      quantity: pi.quantity,
      lineTotal,
      menuItem: { id: item.id, name: item.name, imageUrl: item.imageUrl },
    };
  });

  const taxAmount = Math.round(subtotal * 0.05);
  const total = subtotal + taxAmount;
  const orderId = `ord-${Date.now()}`;
  const orderNumber = Math.floor(1000 + Math.random() * 9000);

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    cafeId: cafe.id,
    customerId: localStorage.getItem('fpc.identity')
      ? (JSON.parse(localStorage.getItem('fpc.identity') || '{}') as Identity).user?.id || 'usr-guest'
      : 'usr-guest',
    status: 'pending',
    fulfillmentType: payload.fulfillmentType,
    paymentStatus: payload.payment.method === 'cash' ? 'unpaid' : 'paid',
    paymentMethod: payload.payment.method,
    subtotal,
    taxAmount,
    discountAmount: 0,
    total,
    notes: payload.notes || null,
    tableNumber: payload.tableNumber || null,
    customerName: payload.customerName || 'Guest Customer',
    customerPhone: payload.customerPhone || null,
    placedAt: new Date().toISOString(),
    etaMinutes: 12,
    queuePosition: 2,
    items: lineItems,
    events: [{ id: `ev-1`, status: 'pending', note: 'Order placed by guest', createdAt: new Date().toISOString() }],
    cafe: { id: cafe.id, name: cafe.name, slug: cafe.slug, currency: cafe.currency, phone: cafe.phone },
  };

  const current = getStoredOrders();
  current.unshift(newOrder);
  saveStoredOrders(current);

  // Simulate WebSocket lifecycle advancement for realistic live tracking demo
  simulateOrderLifecycle(orderId);

  return newOrder;
}

export function mockTransitionOrder(id: string, nextStatus: OrderStatus, note?: string): Order {
  const orders = getStoredOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) {
    throw new Error('Order not found');
  }

  const updated: Order = {
    ...orders[idx],
    status: nextStatus,
    events: [
      ...(orders[idx].events || []),
      { id: `ev-${Date.now()}`, status: nextStatus, note: note || null, createdAt: new Date().toISOString() },
    ],
  };

  if (nextStatus === 'accepted') updated.acceptedAt = new Date().toISOString();
  if (nextStatus === 'ready') {
    updated.readyAt = new Date().toISOString();
    updated.etaMinutes = 0;
    updated.queuePosition = 1;
  }
  if (nextStatus === 'completed') updated.completedAt = new Date().toISOString();

  orders[idx] = updated;
  saveStoredOrders(orders);

  // Broadcast window event for live subscribers
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fpc:order:updated', { detail: updated }));
  }

  return updated;
}

function simulateOrderLifecycle(orderId: string) {
  if (typeof window === 'undefined') return;

  // 12s -> accepted
  setTimeout(() => {
    try {
      mockTransitionOrder(orderId, 'accepted', 'Barista accepted ticket');
    } catch {
      /* ignore */
    }
  }, 12000);

  // 26s -> preparing
  setTimeout(() => {
    try {
      mockTransitionOrder(orderId, 'preparing', 'Baking and grinding in kitchen');
    } catch {
      /* ignore */
    }
  }, 26000);

  // 45s -> ready
  setTimeout(() => {
    try {
      mockTransitionOrder(orderId, 'ready', 'Ready for pickup at counter');
    } catch {
      /* ignore */
    }
  }, 45000);
}
