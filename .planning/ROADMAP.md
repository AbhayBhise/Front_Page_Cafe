# Roadmap: Front Page Cafe Enterprise Production Overhaul

## Milestones & Phases

### Phase 1: GitHub Live Site & CI/CD Pipeline
- [x] 1.1 Configure Vite `base` and React Router `basename` with dynamic subpath support.
- [x] 1.2 Add SPA 404 fallback (`public/404.html`) for GitHub Pages deep linking.
- [x] 1.3 Create `.github/workflows/deploy-pages.yml` for automated zero-touch GitHub Pages deployment.
- [x] 1.4 Create `.github/workflows/ci.yml` for automated linting, typechecking, building, and security auditing.
- [x] 1.5 Add `.github/dependabot.yml`, PR template, and issue templates.

### Phase 2: Frontend Enterprise Resilience & Fallback Experience
- [x] 2.1 Implement Resilient API Service with automated Demo/Offline Fallback for static environments (GitHub Pages).
- [x] 2.2 Add Global React ErrorBoundary component with recovery actions and diagnostics.
- [x] 2.3 Enhance `index.html` with OpenGraph, Twitter Cards, SEO meta tags, and PWA manifest (`public/manifest.webmanifest`).
- [x] 2.4 Add Demo Mode notification badge/banner informing users when running in live preview mode.

### Phase 3: Backend Scalability & Enterprise Standards (Millions of Users)
- [x] 3.1 Configure Prisma connection pooling and PgBouncer support in `backend/src/lib/prisma.ts`.
- [x] 3.2 Implement distributed Redis Adapter for Socket.IO with seamless in-memory fallback for horizontal pod scaling.
- [x] 3.3 Implement high-throughput in-memory/Redis response caching for read-heavy public endpoints (cafes, menus).
- [x] 3.4 Strengthen security headers (Helmet CSP, HSTS), rate-limiting, and production error sanitization.
- [x] 3.5 Implement SRE health probes (`/api/health`, `/api/health/ready`, `/api/health/live`) and graceful shutdown handlers (`SIGTERM`/`SIGINT`).

### Phase 4: Cloud-Native Infrastructure & Multi-Cloud Deployment
- [x] 4.1 Create Kubernetes enterprise production manifests in `k8s/` (Deployments, HPAs, Services, Ingress, PDB, ConfigMaps).
- [x] 4.2 Create production Docker Compose (`docker-compose.prod.yml`) with PostgreSQL 17 + Redis 7 + API + Nginx with HTTP/2 and caching.
- [x] 4.3 Create single-click cloud deployment manifests (`render.yaml`, `railway.json`, `vercel.json`).

### Phase 5: Verification, Testing & Production Documentation
- [x] 5.1 Add npm test scripts for frontend and backend validation.
- [x] 5.2 Validate end-to-end builds (frontend Vite build + backend TypeScript compilation).
- [x] 5.3 Write comprehensive production deployment guide (`DEPLOYMENT.md`) and update `README.md`.
