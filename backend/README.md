# Front Page Cafe — API

Multi-tenant cafe ordering SaaS backend. Node + Express + Prisma (PostgreSQL) + Socket.IO.

## Architecture

```
src/
  config/        env loading & validation
  lib/           prisma, logger, errors, auth-tokens, password, slug, activity, http helpers
  middleware/    authenticate / requireRole, cafeAccess (tenant scoping), validate (zod), rateLimit, error
  realtime/      Socket.IO server + in-memory presence registry
  modules/
    auth/        register (customer|owner), login, refresh (rotating), logout, me, change-password, sessions
    cafes/       public discovery, owner profile, counters, staff, cafe-ops (orders/analytics/presence/activity)
    menu/        public menu, owner CRUD, counter availability toggle
    orders/      cart -> priced order, simulated payments, status state-machine, kitchen-load ETA
    analytics/   per-cafe + platform metrics
    admin/       platform overview, cafe approval queue, user management, global activity feed
    notifications/
  bootstrap.ts   guarantees a platform admin exists on first boot
```

### Roles (RBAC)
`customer` → browse, order, track · `counter` → work the queue, toggle item availability ·
`owner` → menu, staff, counters, analytics, monitor live counter presence ·
`admin` → approve/suspend cafes, manage users, platform analytics, full audit trail.

Tenant isolation is enforced by `requireCafeAccess` — every cafe-scoped route resolves the
caller's relationship to the target cafe (owns it / assigned staff / admin) before proceeding.

### Unique selling point — Kitchen Load-Aware ETA
When an order is placed the API measures the *current* live backlog (every pending/accepted/
preparing order's slowest item) and returns a realistic `etaMinutes` plus a live `queuePosition`
that updates over Socket.IO. Owners see the same signal as a kitchen-load gauge.

## Running locally

```bash
npm install

# 1. Local PostgreSQL 17 — a real server, no Docker. Keep this terminal running:
npm run db             # data in backend/.pgdata (gitignored); delete it for a clean slate

# 2. In another terminal:
npm run db:push        # apply schema
npm run seed           # demo cafes, menu, staff, 10 days of orders
npm run dev            # http://localhost:5000
```

Prefer your own / a managed Postgres? Point `DATABASE_URL` in `.env` at it and run
`npm run db:push` (or `npm run prisma:migrate` for migration history). `npm run db` is only
the local convenience server.

### Seeded logins

| Email | Password | Role |
|---|---|---|
| admin@frontpagecafe.com | Admin@12345 | admin |
| owner@frontpagecafe.com | Owner@12345 | owner · Front Page Cafe (approved) |
| owner2@frontpagecafe.com | Owner@12345 | owner · The Brew House (approved) |
| pending@frontpagecafe.com | Owner@12345 | owner · Corner Chai Co. (pending approval) |
| counter@frontpagecafe.com | Counter@12345 | counter · Front Page Cafe |
| customer@frontpagecafe.com | Customer@12345 | customer |

## Security

helmet · CORS allow-list · rate limiting (global / auth / write) · zod validation on every
body & query · bcrypt password hashing · rotating refresh tokens stored only as SHA-256 hashes ·
session revocation on password change / suspension · server-authoritative pricing on checkout ·
full activity/audit log.

## API surface (all under `/api`)

- `auth/*` — register, login, refresh, logout, me, change-password, sessions
- `cafes` — `GET /` discovery, `GET /:idOrSlug`, `GET /mine`
- `cafes/:cafeId` — `PATCH /`, `toggle-open`, `counters*`, `staff*` (owner) · `orders`, `presence`, `analytics/*`, `activity` (owner+counter)
- `menu/:cafeId` — public · `menu/:cafeId/manage/*` — categories & items
- `orders` — `POST /`, `GET /mine`, `GET /:id`, `POST /:id/transition`, `POST /:id/cancel`
- `admin/*` — overview, analytics/timeseries, cafes (+`/:id/review`), users (+`PATCH`), activity
- `notifications` — list, `:id/read`, `read-all`
- `qr/resolve`, `qr/session` — validate a table QR / mint a scoped 4h guest token (quick dine)
- `cafes/:cafeId/tables*` — owner CRUD for table QR codes (+ `/:tableId/rotate`)

### Realtime events (Socket.IO, auth via `{ token }` handshake)
`presence:update` · `order:new` · `order:updated` · `cafe:status` · `account:suspended` · client emits `heartbeat`
