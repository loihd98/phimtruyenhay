# phimtruyenhay.com — Tài liệu tổng hợp

> Tài liệu hợp nhất từ: `PROJECT_ARCHITECTURE.md`, `DEPLOYMENT_GUIDE.md`, `MULTI_SITE_VPS_GUIDE.md`, `RBAC_DEPLOYMENT_GUIDE.md`, `GOOGLE_ADS_ANALYTICS_GUIDE.md`

---

## Mục lục

- [Phần 1: Kiến trúc & Công nghệ](#phần-1-kiến-trúc--công-nghệ)
- [Phần 2: Deploy lên VPS](#phần-2-deploy-lên-vps)
- [Phần 3: SSL & Domain](#phần-3-ssl--domain)
- [Phần 4: Database & Seeding](#phần-4-database--seeding)
- [Phần 5: RBAC — Phân quyền](#phần-5-rbac--phân-quyền)
- [Phần 6: Multi-Site VPS](#phần-6-multi-site-vps)
- [Phần 7: Google Analytics & AdSense](#phần-7-google-analytics--adsense)
- [Phần 8: Bảo trì & Troubleshooting](#phần-8-bảo-trì--troubleshooting)

---

# Phần 1: Kiến trúc & Công nghệ

## 1.1 Tổng quan

**phimtruyenhay.com** là nền tảng full-stack: đọc truyện online, nghe truyện audio, review phim. Containerize hoàn toàn bằng Docker, deploy trên VPS Ubuntu với Nginx reverse proxy + SSL.

## 1.2 Tech Stack

| Layer | Công nghệ | Vai trò |
|---|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Redux Toolkit | SSR/SSG, SEO |
| Backend | Node.js 20, Express, Prisma ORM | REST API |
| Database | PostgreSQL 15 | Data storage |
| Infra | Docker Compose, Nginx (alpine), Let's Encrypt SSL | Container orchestration |
| Auth | JWT (access + refresh rotation), Google/Facebook OAuth | Authentication |
| SEO | JSON-LD, Dynamic Sitemap, Open Graph | Search optimization |

## 1.3 Request Flow (Production)

```
Browser → Nginx (:80/:443)
    ├─ HTTP → 301 HTTPS
    ├─ /api/*  → backend:5000 (Express API)
    ├─ /uploads/* → nginx static serve (bind: ./uploads)
    └─ /*  → frontend:3000 (Next.js SSR)
```

## 1.4 Docker Services

```yaml
# Production (docker-compose.prod.yml)
postgres:15     # DB persistent (volume: postgres_data), mem 256M
backend:node20  # API, auto migrate on start, mem 512M
frontend:next14 # SSR/SSG, mem 1G
nginx:alpine    # Port 80/443 public, mem 128M
certbot         # Let's Encrypt renewal
```

## 1.5 Cấu trúc thư mục

```
phimtruyenhay.com/
├── backend/
│   ├── prisma/schema.prisma    # Database schema (source of truth)
│   ├── src/
│   │   ├── index.js            # Express entry point
│   │   ├── config/             # Env vars, OAuth passport
│   │   ├── controllers/        # Business logic
│   │   ├── routes/             # API route definitions
│   │   ├── middleware/auth.js  # JWT verify, role check
│   │   ├── lib/prisma.js       # Prisma singleton
│   │   ├── utils/              # Token, validation, permission services
│   │   └── scripts/            # Seed, healthcheck
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js pages (file-based routing)
│   │   ├── components/         # React components
│   │   ├── store/slices/       # Redux: auth, bookmark, ui, unlock
│   │   ├── types/              # TypeScript definitions
│   │   └── utils/              # API client, helpers
│   └── Dockerfile
├── nginx/
│   ├── nginx.conf              # Global config (rate limiting)
│   └── prod.conf               # Virtual hosts (SSL, routing)
├── uploads/                    # Shared volume: audio/, image/
├── docker-compose.prod.yml
└── .env.prod                   # Environment variables (gitignored)
```

## 1.6 Authentication Flow

```
Access Token (JWT)              Refresh Token (JWT)
├── Short-lived (~15min)        ├── Long-lived (~7 days)
├── Stored in Redux state       ├── Stored in httpOnly cookie
├── Sent via Authorization      ├── Auto-sent by browser
│   header                      └── Cannot be accessed by JS (XSS-safe)
└── NOT persisted to disk
```

**Login:** POST `/auth/login` → returns `{user, accessToken}` + sets `refreshToken` cookie (httpOnly, Secure).

**Silent Refresh:** On app load or 401, POST `/auth/refresh` (cookie auto-sent) → new `accessToken`.

**Rehydration:** `redux-persist` restores `user` from localStorage but forces `accessToken = null`, triggering silent refresh.

## 1.7 Database Schema (ER Overview)

```
User ──1:N──> Story ──1:N──> Chapter ──1:N──> Comment
  │              │  N:M          │
  │              └───> Genre     └──> AffiliateLink
  │
  ├──1:N──> Bookmark
  ├──1:N──> VipSubscription ──1:1──> PaymentTransaction
  │
  └──1:N──> FilmReview ──1:N──> FilmEpisode
                │  N:M            FilmComment
                ├──> FilmCategory
                └──> FilmActor
```

**Models:** User, Story, Chapter, Genre (Text/Audio), Comment, Bookmark, FilmReview, FilmEpisode, FilmComment, FilmCategory, FilmActor, AffiliateLink, Media, BlogPost, BlogComment, RefreshToken, VipSubscription, PaymentTransaction

## 1.8 API Architecture

```
/api
├── /auth          POST login, register, refresh, logout; GET profile
├── /stories       GET list, GET :slug
├── /chapters      GET :id
├── /genres        GET list
├── /bookmarks     GET, POST, DELETE
├── /comments      GET, POST
├── /film-reviews  GET list, GET :slug
├── /vip           GET plans, GET status, POST create-payment, GET payment-status
├── /blog          GET list, GET :slug
├── /affiliate     GET, redirect
├── /media         POST upload, GET list, DELETE :id
├── /contact       POST
└── /admin         CRUD stories, chapters, genres, users, comments, film-reviews,
                   film-categories, blog, media, settings, VIP payments/subscriptions
```

**Response format:**
```json
{ "data": [...], "total": 100, "page": 1, "limit": 10 }  // List
{ "data": { ... } }                                         // Single
{ "error": "Error Type", "message": "Human readable" }      // Error
```

## 1.9 Frontend Pattern (SSR + CSR)

```
Server Component (page.tsx)          Client Component (*Client.tsx)
├── Fetch data on server             ├── Interactive UI
├── generateMetadata() for SEO       ├── Client-side pagination
├── JSON-LD structured data          ├── Redux state access
└── Pass data as props ──────────>   └── Dynamic imports
```

`API_URL` (server, Docker internal: `http://backend:5000/api`) ≠ `NEXT_PUBLIC_API_URL` (browser: `https://domain/api`)

---

# Phần 2: Deploy lên VPS

## 2.1 Prerequisites

- VPS Ubuntu 20.04 LTS
- Root SSH access
- Domain configured (DNS A records → VPS IP)

## 2.2 VPS Initial Setup

```bash
# SSH vào VPS
ssh root@YOUR_VPS_IP

# Update system
apt update && apt upgrade -y

# Install essentials
apt install -y git curl wget ufw apt-transport-https ca-certificates gnupg lsb-release

# Firewall
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable

# (Optional) Non-root user
adduser deploy && usermod -aG sudo deploy
```

## 2.3 Install Docker

```bash
# Keyrings directory
install -m 0755 -d /etc/apt/keyrings

# Docker GPG key (download to temp first — avoids silent pipe failures)
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /tmp/docker.asc
gpg --dearmor < /tmp/docker.asc > /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg && rm /tmp/docker.asc

# Verify key exists (must NOT be 0 bytes)
ls -lh /etc/apt/keyrings/docker.gpg

# Add repo
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable docker && systemctl start docker

# Verify
docker --version && docker compose version
```

## 2.4 Deploy Application

```bash
# Clone
cd /opt
git clone https://github.com/YOUR_REPO.git webtruyen
cd /opt/webtruyen

# Create env file
cp .env.prod.example .env.prod
nano .env.prod  # Fill in DB credentials, JWT secrets, URLs

# Generate secrets
echo "JWT_SECRET: $(openssl rand -base64 48)"
echo "JWT_REFRESH_SECRET: $(openssl rand -base64 48)"
echo "DB_PASSWORD: $(openssl rand -base64 24)"

# Create directories
mkdir -p uploads/audio uploads/image logs/backend logs/nginx

# Build & start (first build: 5-15 min)
docker compose -f docker-compose.prod.yml up -d --build

# Verify
docker compose -f docker-compose.prod.yml ps    # All should be Up/healthy
curl http://YOUR_DOMAIN/api/health               # Should return OK
```

## 2.5 Environment Variables

| Biến | Mô tả |
|------|--------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Access token signing key |
| `JWT_REFRESH_SECRET` | Refresh token signing key |
| `NEXT_PUBLIC_API_URL` | Frontend browser → API (`https://domain/api`) |
| `API_URL` | Frontend SSR → API nội bộ (`http://backend:5000/api`) |
| `NEXT_PUBLIC_BASE_URL` | Base URL cho SEO |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth |
| `VIP_BANK_NAME`, `VIP_ACCOUNT_NUMBER`, `VIP_ACCOUNT_HOLDER` | VietQR payment |

---

# Phần 3: SSL & Domain

## 3.1 Initial HTTP Config

Trước khi lấy SSL, Nginx phải serve HTTP để Let's Encrypt verify domain. Tạm dùng HTTP-only config:

```bash
cat > /opt/webtruyen/nginx/prod.conf << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN www.YOUR_DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location /api/ { proxy_pass http://backend:5000/api/; }
    location / { proxy_pass http://frontend:3000; }
    location /uploads/ { alias /uploads/; expires 1y; }
}
EOF
docker compose -f docker-compose.prod.yml restart nginx
```

## 3.2 Obtain SSL Certificate

```bash
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  -d YOUR_DOMAIN -d www.YOUR_DOMAIN \
  --email your-email@gmail.com --agree-tos --no-eff-email
```

## 3.3 Restore Full HTTPS Config

```bash
git checkout nginx/prod.conf
docker compose -f docker-compose.prod.yml restart nginx

# Verify
curl -I https://YOUR_DOMAIN   # Should show security headers + 200
```

## 3.4 SSL Auto-Renewal

Certbot container auto-renews every 12 hours (entrypoint in docker-compose). For cron-based:

```bash
echo "0 3 */60 * * cd /opt/webtruyen && docker compose run --rm certbot renew && docker compose restart nginx" | crontab -
```

## 3.5 Security Headers

Configured in `nginx/prod.conf`:
- HSTS: `max-age=31536000; includeSubDomains; preload`
- X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy

---

# Phần 4: Database & Seeding

## 4.1 Migrations

Backend auto-runs `npx prisma migrate deploy` on start. Manual:

```bash
# In container
docker compose exec backend npx prisma migrate deploy

# Local development
cd backend && npx prisma migrate dev --name description_here
```

## 4.2 Seeding

```bash
# User accounts + genres
docker compose exec backend node src/scripts/seed-users-only.js

# Film reviews (optional)
docker compose exec backend node src/scripts/seed-film-reviews.js

# RBAC permissions (required for role-based access)
docker compose exec backend node src/scripts/seed-permissions.js
```

## 4.3 Admin Account

```bash
# Option 1: Register via website, then promote
docker compose exec postgres psql -U YOUR_USER -d YOUR_DB -c \
  "UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';"

# Option 2: Register via API
curl -X POST https://YOUR_DOMAIN/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"StrongPass123","name":"Admin"}'
```

## 4.4 Backup & Restore

```bash
# Backup
docker compose exec postgres pg_dump -U YOUR_USER -d YOUR_DB > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T postgres psql -U YOUR_USER -d YOUR_DB < backup_file.sql

# Volume backup
docker run --rm -v PROJECT_pgdata:/data -v $(pwd):/bk alpine tar czf /bk/pgdata.tar.gz /data
```

---

# Phần 5: RBAC — Phân quyền

## 5.1 Overview

- 3 roles: `USER`, `ADMIN`, `EDITOR` (+ `REVIEWER` for film)
- Resource-based permissions (~28 permissions across 8 groups)
- ADMIN bypasses all permission checks
- `requireAuth` (JWT verify) + `requireAdmin` (role check) middleware

## 5.2 Deploy RBAC

```bash
# 1. Backup database
docker compose exec postgres pg_dump -U $USER -d $DB > backup_pre_rbac.sql

# 2. Pull code & rebuild
git pull origin master
docker compose -f docker-compose.prod.yml build

# 3. Restart (migration runs automatically)
docker compose -f docker-compose.prod.yml up -d

# 4. Seed permissions
docker compose exec backend node src/scripts/seed-permissions.js
```

## 5.3 Verification

```sql
SELECT count(*) FROM permissions;                                    -- ~28
SELECT role, count(*) FROM role_permissions WHERE granted = true GROUP BY role;
-- EDITOR → ~17, USER → ~3
```

## 5.4 Rollback

```bash
# Rollback migration
npx prisma migrate resolve --rolled-back <migration_name>

# Restore backup
docker compose exec -T postgres psql -U $USER -d $DB < backup_pre_rbac.sql
```

## 5.5 Safety Guarantees

- Migration only ADDs tables/columns — no DROP/ALTER existing
- Existing users unaffected
- ADMIN role still bypasses all checks
- Cookie/JWT flow unchanged

---

# Phần 6: Multi-Site VPS

Hướng dẫn deploy nhiều website trên cùng 1 VPS.

## 6.1 Architecture

```
Internet → VPS
    ├─ Port 80/443 → Gateway Nginx (shared reverse proxy)
    │       ├─ site1.com → Site 1 docker-compose stack
    │       └─ site2.com → Site 2 docker-compose stack
    └─ Certbot (SSL cho tất cả domains)
```

## 6.2 Setup

```bash
# Folder structure
mkdir -p /opt/gateway/nginx/conf.d /opt/gateway/certbot/{www,certs}
mkdir -p /opt/sites/phimtruyenhay /opt/sites/site2

# Shared Docker network
docker network create gateway-network
```

## 6.3 Gateway Nginx

File `/opt/gateway/docker-compose.yml`:
- `nginx-gateway`: Port 80/443, volumes for configs + certbot + uploads
- `certbot`: Auto-renewal

Each site needs a separate nginx conf file in `/opt/gateway/nginx/conf.d/`. Site docker-compose files remove their own nginx/certbot services and join `gateway-network`.

## 6.4 Site Docker Compose Changes

- Remove `nginx` and `certbot` services
- Remove port exposes
- Add `container_name` (e.g., `phimtruyenhay-backend`)
- Add external network `gateway-network`
- Gateway routes by domain name to container names

---

# Phần 7: Google Analytics & AdSense

## 7.1 Google Analytics 4 (GA4)

1. [analytics.google.com](https://analytics.google.com/) → Create Property → Web Stream
2. Get **Measurement ID** (`G-XXXXXXXXXX`)
3. Set env: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX`

## 7.2 Google AdSense

1. [google.com/adsense](https://www.google.com/adsense/) → Register → Verify website
2. Get **Publisher ID** (`ca-pub-XXXXXXXXXXXXXXXX`)
3. Set env: `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX`
4. Create ad units in AdSense dashboard, use in code:

```tsx
import AdBanner from "@/components/seo/AdBanner";
<AdBanner slot="1234567890" format="horizontal" />
<AdBanner slot="0987654321" format="auto" responsive />
```

## 7.3 Google Search Console

1. [search.google.com/search-console](https://search.google.com/search-console) → Add property
2. HTML tag verification → add to `layout.tsx` metadata:
```tsx
verification: { google: 'your-verification-code' }
```

## 7.4 Docker Compose Env

```yaml
frontend:
  environment:
    - NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
    - NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

> After adding env vars, rebuild frontend container. GA4 data may take 24-48h.

---

# Phần 8: Bảo trì & Troubleshooting

## 8.1 Update & Redeploy

```bash
cd /opt/webtruyen
git pull origin master
docker compose -f docker-compose.prod.yml up -d --build
# Migration tự động chạy khi backend start
```

## 8.2 Zero-Downtime Restart

```bash
# Restart 1 service
docker compose -f docker-compose.prod.yml restart backend

# Rebuild 1 service (no downtime for others)
docker compose -f docker-compose.prod.yml up -d --build --no-deps backend
```

## 8.3 View Logs

```bash
docker compose -f docker-compose.prod.yml logs -f backend    # Backend logs
docker compose -f docker-compose.prod.yml logs -f nginx       # Nginx logs
docker compose -f docker-compose.prod.yml logs --tail 100     # Last 100 lines all
```

## 8.4 Cleanup

```bash
# Remove unused Docker resources
docker system prune -af --volumes  # WARNING: removes ALL unused images/volumes

# Safe cleanup (keep tagged images)
docker image prune -f
docker container prune -f
docker builder prune -f
```

## 8.5 Common Issues

| Vấn đề | Giải pháp |
|---------|-----------|
| 502 Bad Gateway | Check backend health: `docker compose logs backend` |
| Upload 500 error | Check nginx `client_max_body_size` + `proxy_request_buffering off` in upload location |
| SSL cert expired | `docker compose run --rm certbot renew && docker compose restart nginx` |
| DB connection refused | Check postgres health: `docker compose exec postgres pg_isready` |
| Frontend build OOM | Increase memory limit or set `NODE_OPTIONS=--max-old-space-size=2048` |
| Rate limit 429 | Adjust `burst` in nginx rate limiting zones |

## 8.6 Health Checks

```bash
curl https://YOUR_DOMAIN/api/health     # Backend health
curl -I https://YOUR_DOMAIN             # Nginx + Frontend
docker compose -f docker-compose.prod.yml ps  # All services status
```
