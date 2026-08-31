import { PrismaClient, type OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const hash = (p: string) => bcrypt.hash(p, 10);

interface SeedItem {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  isVeg: boolean;
  prepMinutes: number;
  isFeatured?: boolean;
  imageUrl?: string;
}
type SeedMenu = Record<string, SeedItem[]>;

const CAFE_A_MENU: SeedMenu = {
  Coffee: [
    { name: 'Signature Cold Brew', description: '18-hour steeped, smooth and bold', price: 150, compareAtPrice: 180, isVeg: true, prepMinutes: 4, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fb7be0e0d3?auto=format&fit=crop&q=80&w=800' },
    { name: 'Cappuccino', description: 'Double shot with velvety microfoam', price: 150, isVeg: true, prepMinutes: 5, imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&q=80&w=800' },
    { name: 'Caramel Latte', description: 'Espresso, steamed milk, house caramel', price: 170, isVeg: true, prepMinutes: 6, imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800' },
    { name: 'Espresso', description: 'Single origin, seasonal rotation', price: 110, isVeg: true, prepMinutes: 3, imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&q=80&w=800' },
  ],
  'All-Day Breakfast': [
    { name: 'Avocado Sourdough', description: 'Smashed avo, chilli, poached egg', price: 320, isVeg: true, prepMinutes: 12, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=800' },
    { name: 'Big Breakfast Plate', description: 'Eggs, hashbrown, sausage, beans, toast', price: 420, isVeg: false, prepMinutes: 18, imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=80&w=800' },
    { name: 'Pancake Stack', description: 'Buttermilk pancakes, maple, berries', price: 300, isVeg: true, prepMinutes: 14, imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&q=80&w=800' },
  ],
  'Mains & Bowls': [
    { name: 'Grilled Chicken Bowl', description: 'Quinoa, greens, roast veg, tahini', price: 380, isVeg: false, prepMinutes: 16, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800' },
    { name: 'Paneer Tikka Wrap', description: 'Charred paneer, mint slaw, kachumber', price: 290, isVeg: true, prepMinutes: 13, imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=800' },
    { name: 'Truffle Mushroom Pasta', description: 'Tagliatelle, cream, parmesan, truffle oil', price: 375, compareAtPrice: 440, isVeg: true, prepMinutes: 20, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80&w=800' },
  ],
  Desserts: [
    { name: 'Chocolate Lava Cake', description: 'Molten centre, vanilla bean ice cream', price: 240, isVeg: true, prepMinutes: 10, imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&q=80&w=800' },
    { name: 'New York Cheesecake', description: 'Graham crust, berry compote', price: 260, isVeg: true, prepMinutes: 5, imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=800' },
  ],
};

const CAFE_B_MENU: SeedMenu = {
  'Wood-Fired Pizza': [
    { name: 'Margherita DOP', description: 'San Marzano, fior di latte, basil', price: 340, isVeg: true, prepMinutes: 14, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=800' },
    { name: 'Diavola', description: 'Spicy salami, chilli, mozzarella', price: 420, isVeg: false, prepMinutes: 15, imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800' },
    { name: 'Garden Veg', description: 'Zucchini, peppers, olives, rocket', price: 380, isVeg: true, prepMinutes: 15, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800' },
  ],
  'Small Plates': [
    { name: 'Garlic Focaccia', description: 'Rosemary, sea salt, olive oil', price: 180, isVeg: true, prepMinutes: 8, imageUrl: 'https://images.unsplash.com/photo-1585478259715-1c093a7b70d3?auto=format&fit=crop&q=80&w=800' },
    { name: 'Crispy Calamari', description: 'Lemon aioli, herbs', price: 320, isVeg: false, prepMinutes: 12, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=800' },
    { name: 'Burrata & Tomato', description: 'Heirloom tomato, basil oil, focaccia', price: 360, isVeg: true, prepMinutes: 7, isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&q=80&w=800' },
  ],
  Drinks: [
    { name: 'House Lemonade', description: 'Fresh pressed, mint', price: 140, isVeg: true, prepMinutes: 3, imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800' },
    { name: 'Iced Peach Tea', description: 'Black tea, peach, citrus', price: 130, isVeg: true, prepMinutes: 3, imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=800' },
  ],
};

async function seedMenu(cafeId: string, menu: SeedMenu) {
  let sort = 0;
  for (const [categoryName, items] of Object.entries(menu)) {
    const category = await prisma.menuCategory.create({
      data: { cafeId, name: categoryName, sortOrder: sort++ },
    });
    for (const it of items) {
      await prisma.menuItem.create({ data: { ...it, cafeId, categoryId: category.id } });
    }
  }
}

async function main() {
  console.log('Resetting database…');
  await prisma.$transaction([
    prisma.orderEvent.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.activityLog.deleteMany(),
    prisma.menuItem.deleteMany(),
    prisma.menuCategory.deleteMany(),
    prisma.cafeStaff.deleteMany(),
    prisma.counter.deleteMany(),
    prisma.table.deleteMany(),
    prisma.session.deleteMany(),
    prisma.cafe.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const admin = await prisma.user.create({
    data: { name: 'Platform Admin', email: 'admin@frontpagecafe.com', passwordHash: await hash('Admin@12345'), role: 'admin' },
  });

  // ---- Cafe A (approved, live) ----
  const ownerA = await prisma.user.create({
    data: { name: 'Aarav Mehta', email: 'owner@frontpagecafe.com', phone: '+91 90000 00001', passwordHash: await hash('Owner@12345'), role: 'owner' },
  });
  const cafeA = await prisma.cafe.create({
    data: {
      name: 'Front Page Cafe', slug: 'front-page-cafe', ownerId: ownerA.id,
      description: 'Specialty coffee, all-day breakfast and comfort mains in the heart of the city.',
      phone: '+91 90000 00001', email: 'hello@frontpagecafe.com',
      addressLine: '12 Turner Road', city: 'Mumbai', state: 'Maharashtra', postalCode: '400050',
      gstNumber: '27AAAAA0000A1Z5', licenseNumber: 'FSSAI-11522998000123',
      status: 'approved', reviewedById: admin.id, reviewedAt: new Date(), isOpen: true, taxRate: 5,
      welcomeMessage: 'Welcome to Front Page Cafe! Scan, browse and order right from your table — no queue, no wait.',
      announcement: 'Happy hours 4–6pm: 20% off all coffee ☕',
      logoUrl: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&q=80&w=400',
      bannerUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1200',
    },
  });
  await prisma.$transaction(
    ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Patio 1'].map((label, i) =>
      prisma.table.create({
        data: {
          cafeId: cafeA.id,
          label,
          code: label.toLowerCase().replace(/\s+/g, '-'),
          qrSecret: `seedqr_${cafeA.id.slice(0, 6)}_${i}_${Math.random().toString(36).slice(2, 10)}`,
        },
      }),
    ),
  );
  const counterA1 = await prisma.counter.create({ data: { cafeId: cafeA.id, name: 'Front Counter', code: 'FC1' } });
  const counterA2 = await prisma.counter.create({ data: { cafeId: cafeA.id, name: 'Drive-Through', code: 'DT1' } });
  const staffAUser = await prisma.user.create({
    data: { name: 'Neha Rao', email: 'counter@frontpagecafe.com', passwordHash: await hash('Counter@12345'), role: 'counter' },
  });
  await prisma.cafeStaff.create({ data: { cafeId: cafeA.id, userId: staffAUser.id, counterId: counterA1.id, title: 'Head Cashier' } });
  await seedMenu(cafeA.id, CAFE_A_MENU);

  // ---- Cafe B (approved) ----
  const ownerB = await prisma.user.create({
    data: { name: 'Sofia Diniz', email: 'owner2@frontpagecafe.com', passwordHash: await hash('Owner@12345'), role: 'owner' },
  });
  const cafeB = await prisma.cafe.create({
    data: {
      name: 'The Brew House', slug: 'the-brew-house', ownerId: ownerB.id,
      description: 'Wood-fired pizza and Mediterranean small plates.',
      city: 'Pune', state: 'Maharashtra', status: 'approved', reviewedById: admin.id, reviewedAt: new Date(), isOpen: true,
      bannerUrl: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&q=80&w=1200',
    },
  });
  await prisma.counter.create({ data: { cafeId: cafeB.id, name: 'Main Till', code: 'MT1' } });
  await seedMenu(cafeB.id, CAFE_B_MENU);

  // ---- Cafe C (pending approval — for the admin queue) ----
  const ownerC = await prisma.user.create({
    data: { name: 'Rahul Verma', email: 'pending@frontpagecafe.com', passwordHash: await hash('Owner@12345'), role: 'owner' },
  });
  await prisma.cafe.create({
    data: {
      name: 'Corner Chai Co.', slug: 'corner-chai-co', ownerId: ownerC.id,
      description: 'Cutting chai, bun maska and kebab rolls.',
      city: 'Delhi', state: 'Delhi', status: 'pending', isOpen: false,
    },
  });

  // ---- Customers ----
  const customerPw = await hash('Customer@12345');
  const customers = [];
  for (const [name, email] of [
    ['Priya Sharma', 'priya@example.com'],
    ['Kabir Singh', 'kabir@example.com'],
    ['Ananya Iyer', 'ananya@example.com'],
    ['Customer Demo', 'customer@frontpagecafe.com'],
  ]) {
    customers.push(
      await prisma.user.create({ data: { name, email, passwordHash: customerPw, role: 'customer' } }),
    );
  }

  // ---- Historical orders for analytics (last 10 days) ----
  const items = await prisma.menuItem.findMany({ where: { cafeId: cafeA.id } });
  const statuses: OrderStatus[] = ['completed', 'completed', 'completed', 'completed', 'cancelled'];
  let created = 0;
  for (let day = 10; day >= 1; day -= 1) {
    const count = 2 + Math.floor(Math.random() * 5);
    for (let n = 0; n < count; n += 1) {
      const placedAt = new Date();
      placedAt.setDate(placedAt.getDate() - day);
      placedAt.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
      const picks = [...items].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3));
      const lineItems = picks.map((p) => {
        const quantity = 1 + Math.floor(Math.random() * 2);
        return { menuItemId: p.id, nameSnapshot: p.name, priceSnapshot: p.price, quantity, lineTotal: p.price * quantity };
      });
      const subtotal = lineItems.reduce((s, l) => s + l.lineTotal, 0);
      const taxAmount = Number((subtotal * 0.05).toFixed(2));
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const acceptedAt = new Date(placedAt.getTime() + 3 * 60000);
      const completedAt = new Date(placedAt.getTime() + (12 + Math.random() * 20) * 60000);
      await prisma.order.create({
        data: {
          cafeId: cafeA.id, customerId: customer.id, status,
          fulfillmentType: Math.random() > 0.5 ? 'takeaway' : 'dine_in',
          paymentStatus: status === 'cancelled' ? 'refunded' : 'paid',
          paymentMethod: ['card', 'upi', 'cash'][Math.floor(Math.random() * 3)],
          paymentRef: `pay_seed_${created}`,
          subtotal, taxAmount, total: Number((subtotal + taxAmount).toFixed(2)),
          placedAt, createdAt: placedAt,
          acceptedAt: status === 'cancelled' ? null : acceptedAt,
          completedAt: status === 'completed' ? completedAt : null,
          counterId: counterA1.id, handledById: staffAUser.id,
          items: { create: lineItems },
          events: { create: { status, note: 'seed', createdAt: completedAt } },
        },
      });
      created += 1;
    }
  }

  console.log(`Seed complete: ${created} historical orders, 3 cafes, admin + owners + counter + ${customers.length} customers.`);
  console.log('\nLogins (password shown):');
  console.log('  admin@frontpagecafe.com      Admin@12345');
  console.log('  owner@frontpagecafe.com      Owner@12345   (Front Page Cafe – approved)');
  console.log('  owner2@frontpagecafe.com     Owner@12345   (The Brew House – approved)');
  console.log('  pending@frontpagecafe.com    Owner@12345   (Corner Chai Co. – pending)');
  console.log('  counter@frontpagecafe.com    Counter@12345 (Front Page Cafe counter staff)');
  console.log('  customer@frontpagecafe.com   Customer@12345');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
