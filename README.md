# Front Page Cafe

[![CI / Production Quality Gate](https://github.com/AbhayBhise/Front_Page_Cafe/actions/workflows/ci.yml/badge.svg)](https://github.com/AbhayBhise/Front_Page_Cafe/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/AbhayBhise/Front_Page_Cafe/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/AbhayBhise/Front_Page_Cafe/actions/workflows/deploy-pages.yml)
[![Node.js](https://img.shields.io/badge/Node.js-22_LTS-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Production_Ready-2496ED.svg)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Autoscaling_HPA-326CE5.svg)](https://kubernetes.io/)

Multi-tenant cafe ordering SaaS designed for scale. React 19 + Vite + Bootstrap 5 frontend, Express + Prisma (PostgreSQL 17) + Socket.IO backend, with high-performance response caching, horizontal pod autoscaling, and zero-touch CI/CD deployment.

🌐 **Live Demo on GitHub Pages**: [https://abhaybhise.github.io/Front_Page_Cafe/](https://abhaybhise.github.io/Front_Page_Cafe/)  
📖 **Operations & Deployment Manual**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for Kubernetes manifests, Docker Compose, and cloud blueprints.

## Roles

| Role | Can do |
|---|---|
| **customer** | discover cafes, order, pay (simulated), track live ETA + queue position, cancel pending orders |
| **counter** | Counter Console — work the live order queue (accept → prepare → ready → hand over), toggle item availability; presence is broadcast to the owner |
| **owner** | live dashboard, menu & category CRUD, staff + counter management, **live counter presence monitor**, analytics, cafe profile & open/closed toggle |
| **admin** | approve / reject / suspend cafes, manage & suspend users, platform analytics, full activity feed |

Unapproved cafes cannot open or take orders. Owners register their cafe during sign-up and it
enters the admin approval queue.

### Table QR ordering ("quick dine")
Owners generate a printable QR code per table (**Owner → Tables**). A diner scans it and lands on
a **welcome page for that cafe** that scrolls straight into the live menu (images, prices,
descriptions, veg tags, offers). They add items and either sign in or choose **Quick dine** — an
anonymous, account-free order.

Quick dine is deliberately gated so it can't be abused:
- a guest session token can **only** be minted by presenting the table's secret `k` (embedded in
  the QR), so it's impossible to guest-order without physically having a table's code;
- the token is scoped to that one cafe + table, expires in 4 hours, and the server — not the
  client — decides which cafe/table the order belongs to;
- guests are `dine_in` only, must give a name + phone, are rate-limited, capped at 6 open orders
  per table, and can't touch accounts, other cafes, or staff/admin areas;
- owners can **rotate** a table's QR instantly if a code leaks — old prints stop working.

### Unique selling point
**Kitchen Load-Aware ETA** — the ready-time estimate a customer sees reflects the cafe's *current*
live backlog, and their queue position updates in real time over Socket.IO. Owners and counter
staff see the same signal as a kitchen-load gauge.

## Run locally

```bash
# 1. backend deps + local Postgres 17 (real server, no Docker) — leave db running:
cd backend
npm install
npm run db            # keep this terminal open

# 2. backend API (new terminal, from backend/):
npm run db:push       # first run only (applies schema)
npm run seed          # first run only (demo data)
npm run dev           # http://localhost:5000

# 3. frontend (new terminal, from repo root):
npm install
npm run dev           # http://localhost:5173
```

### Demo logins

| Email | Password | Role |
|---|---|---|
| admin@frontpagecafe.com | Admin@12345 | admin |
| owner@frontpagecafe.com | Owner@12345 | owner — Front Page Cafe (approved) |
| owner2@frontpagecafe.com | Owner@12345 | owner — The Brew House (approved) |
| pending@frontpagecafe.com | Owner@12345 | owner — Corner Chai Co. (awaiting approval) |
| counter@frontpagecafe.com | Counter@12345 | counter — Front Page Cafe |
| customer@frontpagecafe.com | Customer@12345 | customer |

Payment simulation: any card/UPI value works; a value ending in **`fail`** is declined so the
failure + refund paths can be exercised.

## Frontend structure

```
src/
  lib/        api (axios + refresh interceptor), socket, format helpers
  context/    AuthContext — identity, tokens, socket lifecycle
  hooks/      useSocketEvent / useHeartbeat, useOwnerCafe, useCafeQueue
  services/   auth, cafe, menu, order, admin, notification  (typed API wrappers, no mock data)
  components/ ui kit (PageState, StatCard, badges), Navbar, NotificationBell, MenuItemCard,
              CafeCard, OrderQueueCard, ActivityFeed, BarChart
  pages/      public + customer flows
  pages/counter/  CounterConsole
  pages/owner/    OwnerDashboard, MenuManagement, StaffManagement, OwnerAnalytics, OwnerActivity, CafeSettings
  pages/admin/    AdminDashboard (overview / approvals / users / activity)
```

New routes: `/t/:cafeSlug/:tableCode?k=…` (table QR landing), `/owner/tables` (QR management).

Environment: frontend `VITE_API_URL`, `VITE_SOCKET_URL` (`.env`); backend `PUBLIC_WEB_URL`
(used to build the QR deep links — set it to the deployed frontend URL in production).

See `backend/README.md` for the API surface and backend architecture.

## Deploy (Docker)

The whole stack runs from one compose file — Postgres 17, the API, and an nginx that serves the
built SPA and reverse-proxies `/api` + `/socket.io` to the API (so everything is same-origin, no
CORS surface in production).

```bash
cp .env.example .env          # then edit — JWT secrets are required
#   openssl rand -base64 48   → JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
docker compose up -d --build
```

- App: `http://localhost:8080` (override with `WEB_PORT` / `PUBLIC_URL`)
- The API container runs `prisma migrate deploy` on start and auto-creates the platform admin
  on first boot (`ADMIN_EMAIL` / `ADMIN_PASSWORD`; if the password is blank a random one is
  generated and printed once in `docker compose logs api`).
- The API **refuses to boot in production** with the placeholder JWT secrets.
- Behind TLS, terminate at your load balancer / another nginx and set `PUBLIC_URL` to the
  `https://` address so table QR links and CORS use the right origin.

Migrations live in `backend/prisma/migrations`. Add one after a schema change with
`cd backend && npx prisma migrate dev --name <change>`.

## Production notes

- **Payments** are simulated (`PAYMENTS_MODE=simulated`). `backend/src/modules/orders/payment.ts`
  is the single seam — implement `charge()` / `refund()` against Stripe/Razorpay to go live.
- **Bundle**: staff dashboards are route-split (`React.lazy`); a diner only downloads the
  public/customer chunk (~150 kB gzip).
- **Guest cleanup**: QR quick-dine creates a lightweight `User` row per session (`isGuest = true`).
  A periodic job to prune guests with no orders older than a day is a reasonable add.
