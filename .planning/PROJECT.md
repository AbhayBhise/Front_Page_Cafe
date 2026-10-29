# Project: Front Page Cafe — Production Scale & Live Deployment

## Overview
Front Page Cafe is a multi-tenant cafe ordering SaaS with kitchen load-aware live queueing, table QR quick-dining, counter operations, and owner/admin management.
This initiative transforms the project into an enterprise-grade, production-ready platform designed to reliably serve millions of users and run seamlessly on GitHub and multi-cloud environments.

## Core Problem Statement
1. **GitHub Live Site Inoperable**: The live site deployed on GitHub (GitHub Pages) is broken because GitHub serves unbundled source files (`/src/main.tsx`), lacks a Vite build & deploy workflow, has base path mismatches (`/Front_Page_Cafe/`), lacks SPA 404 routing, and fails when trying to call `http://localhost:5000/api` from public visitor browsers.
2. **Production Scale Readiness**: Serving millions of users requires enterprise architecture: connection pooling (PgBouncer), distributed caching, multi-node WebSocket pub/sub (Socket.IO Redis adapter), horizontal autoscaling (Kubernetes HPA), distributed rate limiting, OWASP-compliant security headers, SRE observability (readiness/liveness probes, structured logging), and multi-cloud deployment blueprints.

## Scope & Target Milestones
- **Phase 1: GitHub Live Site & Build Pipeline**:
  - Vite base path and React Router basename compatibility for subpaths (`/Front_Page_Cafe/`) and custom domains.
  - SPA 404 fallback (`public/404.html`) for client-side routing on static hosting.
  - GitHub Actions automated CI (`.github/workflows/ci.yml`) and GitHub Pages deployment (`.github/workflows/deploy-pages.yml`).
  - GitHub community standards (issue templates, PR template, Dependabot).
- **Phase 2: Frontend Enterprise Resilience & Demo Mode**:
  - Intelligent resilience/demo fallback layer in API client: when running on static previews or when the backend is unreachable, gracefully fall back to rich interactive mock data with an informative banner.
  - Global React Error Boundary with recovery UI.
  - SEO, OpenGraph metadata, PWA manifest, and high-DPI favicons in `index.html`.
- **Phase 3: Backend High-Scale Architecture (Millions of Users)**:
  - Prisma connection pooling & PgBouncer compatibility.
  - Distributed WebSocket scalability via optional Redis Adapter with automatic in-memory fallback.
  - High-throughput response cache layer for read-heavy cafe and menu queries.
  - Distributed rate limiting with Redis store support.
  - OWASP security headers (strict CSP, HSTS, secure cookies) and safe production error masking.
  - SRE observability: `/api/health`, `/api/health/ready` (DB + Redis pings), `/api/health/live`, structured logging, and graceful shutdown handlers.
- **Phase 4: Cloud-Native Infrastructure & Deployment Blueprints**:
  - Production Kubernetes manifests (`k8s/`): Deployments, HPAs (auto-scale 3 to 50+ pods), Redis, Ingress, PodDisruptionBudget.
  - Upgraded production Docker Compose (`docker-compose.prod.yml`) with Redis, Postgres, API, and Nginx.
  - Zero-touch cloud configurations: `render.yaml`, `railway.json`, `vercel.json`.
- **Phase 5: Verification & Full Stack Testing**:
  - End-to-end build verification (frontend + backend).
  - Test scripts and quality gates.
  - Comprehensive documentation in `README.md` and `DEPLOYMENT.md`.

