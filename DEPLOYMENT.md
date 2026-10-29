# Front Page Cafe — Production Deployment & High-Scale Operations Guide

This guide covers everything required to deploy, scale, and operate **Front Page Cafe** to handle **millions of users** across GitHub Pages, Kubernetes, Docker Compose, and cloud platforms (Render, Railway, AWS, Vercel).

---

## Architecture at Scale (Millions of Users)

```
                            [ Cloudflare / Route53 / AWS CloudFront ]
                                               │
                                     (TLS 1.3 / Anycast DNS)
                                               │
                          ┌────────────────────┴────────────────────┐
                          ▼                                         ▼
                 [ Static Hosting ]                           [ Ingress / ALB ]
                 (GitHub Pages / CDN)                   (cert-manager TLS, HTTP/2)
                 - React 19 SPA                                     │
                 - Hashed Assets (1yr Cache)             ┌──────────┴──────────┐
                 - Offline/Demo Fallback                 ▼                     ▼
                                                    [ Nginx Web ]        [ API Gateway ]
                                                    (Reverse Proxy)       (Node.js / Express)
                                                                               │
                                                    ┌──────────────────────────┼──────────────────────────┐
                                                    ▼                          ▼                          ▼
                                            [ Pod 1 (API) ]            [ Pod 2 (API) ]           [ Pod 3...50 (HPA) ]
                                            - LRU Response Cache       - LRU Response Cache      - Auto-scaled (70% CPU)
                                            - Distributed Rate Limit   - Socket.IO Pub/Sub       - Liveness / Readiness
                                                    │                          │                          │
                                                    └──────────────────────────┼──────────────────────────┘
                                                                               ▼
                                                          ┌────────────────────┴────────────────────┐
                                                          ▼                                         ▼
                                                   [ Redis Cluster ]                       [ PgBouncer Pool ]
                                                   - Socket.IO Adapter                     - Max 10,000 conns
                                                   - Rate Limit Store                               │
                                                   - Session Cache                                  ▼
                                                                                           [ PostgreSQL 17 HA ]
                                                                                           (Primary + Read Replicas)
```

---

## 1. Live Site Deployment on GitHub (GitHub Pages)

### Why the previous setup was failing
1. GitHub Pages was serving unbundled TypeScript source code (`/src/main.tsx`).
2. Assets were requested from root `/assets/` instead of the repository subpath `/Front_Page_Cafe/assets/`.
3. There was no GitHub Actions build workflow to compile the Vite application into static production assets.
4. Refreshing pages resulted in 404s due to missing SPA fallback.

### What is now in place
- **Automated Workflow**: `.github/workflows/deploy-pages.yml` builds and deploys on every push to `main`.
- **Dynamic Base Path**: `vite.config.ts` automatically configures `/Front_Page_Cafe/` for GitHub Pages and `/` for custom domains.
- **SPA Routing**: `public/404.html` and `index.html` redirect handlers preserve client-side routes across refreshes.
- **Offline / Live Demo Resilience**: If the backend API is sleeping or unreachable, the frontend gracefully falls back to interactive sample cafes and menus with an informative banner.

### Enabling GitHub Pages in your Repository
1. Go to your repository on GitHub: `https://github.com/AbhayBhise/Front_Page_Cafe`.
2. Click **Settings** → **Pages** (under Code and automation).
3. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions** (NOT "Deploy from a branch").
4. Push a commit or trigger the workflow under the **Actions** tab (`Deploy to GitHub Pages`).
5. Your live site will be deployed and available at:
   `https://abhaybhise.github.io/Front_Page_Cafe/`

---

## 2. Kubernetes Production Deployment (`k8s/`)

The repository includes enterprise-grade manifests in `k8s/`:

| Manifest | Purpose |
|---|---|
| `k8s/namespace.yaml` | Dedicated `front-page-cafe` namespace |
| `k8s/configmap.yaml` | Production environment configuration |
| `k8s/secret.yaml` | Encrypted secrets template (JWT, DB) |
| `k8s/redis.yaml` | Redis 7 deployment & service |
| `k8s/backend-deployment.yaml` | 3+ replicas, zero-downtime rolling update, resource limits |
| `k8s/backend-hpa.yaml` | Horizontal Pod Autoscaler scaling from 3 to 50 replicas at 70% CPU |
| `k8s/frontend-deployment.yaml` | High-performance Nginx frontend deployment |
| `k8s/frontend-hpa.yaml` | Frontend autoscaler scaling from 3 to 30 replicas |
| `k8s/ingress.yaml` | Ingress with TLS (cert-manager), WebSocket upgrades, proxy timeouts |
| `k8s/pdb.yaml` | PodDisruptionBudget maintaining minimum 2 pods during maintenance |

### Deploy to Kubernetes Cluster (EKS / GKE / AKS / Minikube)
```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Apply config and secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# 3. Deploy Redis and Datastore
kubectl apply -f k8s/redis.yaml

# 4. Deploy Backend and Frontend with Autoscaling
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-hpa.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-hpa.yaml

# 5. Apply High-Availability Policies and Ingress
kubectl apply -f k8s/pdb.yaml
kubectl apply -f k8s/ingress.yaml

# Check rollout status
kubectl get pods -n front-page-cafe -w
```

---

## 3. Production Docker Compose (`docker-compose.prod.yml`)

Runs the complete isolated stack with PostgreSQL 17, Redis 7 (alpine), Backend API, and Nginx reverse proxy with resource limits and health checks.

```bash
# Generate high-entropy secrets
export JWT_ACCESS_SECRET=$(openssl rand -base64 48)
export JWT_REFRESH_SECRET=$(openssl rand -base64 48)
export DB_PASSWORD=$(openssl rand -base64 24)

# Launch stack
docker compose -f docker-compose.prod.yml up -d --build

# View container logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## 4. Single-Click Cloud Deployments

### Render (`render.yaml`)
1. Create a Blueprint project on Render.
2. Connect `https://github.com/AbhayBhise/Front_Page_Cafe`.
3. Render automatically provisions the PostgreSQL database, Backend Web Service, and Static Frontend.

### Vercel (`vercel.json`)
Connect the repository to Vercel. `vercel.json` automatically configures Vite SPA rewrites, clean routing, and long-term asset caching.

---

## 5. SRE Health Probes & Observability

The backend API exposes SRE-standard health endpoints:

- `GET /api/health/live`: Fast liveness check (200 OK)
- `GET /api/health/ready`: Deep readiness probe checking database connectivity (200 OK or 503 Service Unavailable)
- `GET /api/health`: Comprehensive system metrics:
  ```json
  {
    "status": "ok",
    "db": "ok",
    "dbLatencyMs": 3,
    "uptimeSeconds": 1420,
    "memory": {
      "rssMb": 84,
      "heapUsedMb": 42
    },
    "env": "production",
    "time": "2026-10-29T21:30:00.000Z"
  }
  ```
- **Correlation ID**: Every HTTP request receives an `X-Request-Id` header for cross-service tracing in Datadog, Grafana Loki, or AWS CloudWatch.
- **Graceful Shutdown**: On `SIGTERM` or `SIGINT`, the server closes HTTP listeners, allows in-flight requests 10 seconds to finish, and cleanly disconnects the Prisma database pool.

