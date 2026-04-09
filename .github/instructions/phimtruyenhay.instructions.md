---
applyTo: "**"
---

# phimtruyenhay.com — Project Context Instructions

## Tổng quan dự án

**phimtruyenhay.com** là web app full-stack phục vụ 3 nhóm nội dung chính:
1. **Truyện Audio** — Nghe truyện MP3 trực tuyến (tiên hiệp, đô thị, kiếm hiệp, ngôn tình...)
2. **Truyện Chữ** — Đọc truyện online
3. **Review Phim** — Đánh giá phim kèm link xem, episodes, actors, categories

Domain chính: `phimtruyenhay.com` | Domain phụ: `vivutruyenhay.com`

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Redux Toolkit |
| Backend | Node.js 20, Express, Prisma ORM |
| Database | PostgreSQL 15 |
| Infra (Prod) | Docker Compose, Nginx (reverse proxy), Let's Encrypt SSL |
| Auth | JWT (access token) + Refresh Token rotation (httpOnly cookie) + Google/Facebook OAuth |

---

## Cấu trúc thư mục & mối liên quan

```
phimtruyenhay.com/
│
├── backend/                        ← Node.js/Express API server
│   ├── src/
│   │   ├── index.js                ← Entry point: middleware, routes, error handler
│   │   ├── config/
│   │   │   ├── index.js            ← Tập trung env vars (port, jwt secrets, uploadPath...)
│   │   │   └── passport.js         ← Google & Facebook OAuth strategies
│   │   ├── routes/                 ← Định nghĩa endpoint (thin layer, chỉ khai báo route)
│   │   │   ├── auth.js             → /api/auth/*
│   │   │   ├── stories.js          → /api/stories/*
│   │   │   ├── chapters.js         → /api/chapters/*
│   │   │   ├── comments.js         → /api/comments/*
│   │   │   ├── bookmarks.js        → /api/bookmarks/*
│   │   │   ├── filmReviews.js      → /api/film-reviews/*
│   │   │   ├── blog.js             → /api/blog/*
│   │   │   ├── media.js            → /api/media/*
│   │   │   ├── affiliate.js        → /api/affiliate/* và /r/* (short redirect)
│   │   │   ├── admin.js            → /api/admin/*
│   │   │   ├── permissions.js      → /api/permissions/*
│   │   │   ├── users.js            → /api/users/*
│   │   │   └── contact.js          → /api/contact/*
│   │   ├── controllers/            ← Business logic, gọi Prisma, trả response
│   │   ├── middleware/
│   │   │   └── auth.js             ← JWT verify, role check (requireAuth, requireAdmin)
│   │   ├── lib/
│   │   │   └── prisma.js           ← Singleton PrismaClient instance
│   │   └── utils/
│   │       ├── tokenService.js     ← Tạo/verify JWT access + refresh token
│   │       ├── validationService.js← Validate input
│   │       ├── permissionService.js← RBAC permission checks
│   │       └── mediaUsageService.js← Track media file usage
│   ├── prisma/
│   │   ├── schema.prisma           ← Database models (source of truth)
│   │   └── migrations/             ← SQL migrations (chạy tự động khi start prod)
│   └── Dockerfile
│
├── frontend/                       ← Next.js 14 App Router
│   ├── src/
│   │   ├── app/                    ← Pages (file-based routing)
│   │   │   ├── page.tsx            ← Homepage: fetch & render hero + content sections
│   │   │   ├── layout.tsx          ← Root layout: metadata, fonts, providers, GA/AdSense
│   │   │   ├── providers.tsx       ← Redux Provider + React Query wrapper
│   │   │   ├── sitemap.ts          ← Auto-generated sitemap từ DB
│   │   │   ├── phim/               ← Review phim: list, detail (/phim/[slug])
│   │   │   ├── truyen-audio/       ← Truyện audio: list, detail, chapter player
│   │   │   ├── truyen-text/        ← Truyện chữ: list, detail, chapter reader
│   │   │   ├── stories/            ← Route chung cho stories (slug)
│   │   │   ├── genres/             ← Trang thể loại
│   │   │   ├── the-loai/           ← Trang thể loại (Vietnamese URL)
│   │   │   ├── blog/               ← Blog posts
│   │   │   ├── bookmarks/          ← User bookmarks (auth required)
│   │   │   ├── profile/            ← User profile
│   │   │   ├── auth/               ← Login, register pages
│   │   │   └── admin/              ← Admin panel (stories, media, settings)
│   │   ├── components/
│   │   │   ├── layout/             ← Layout, Navbar, Footer, ThemeProvider, Sidebar
│   │   │   ├── home/               ← Hero, HomepageContent sections
│   │   │   ├── stories/            ← StoryCard, StoryList, ChapterReader...
│   │   │   ├── audio/              ← AudioPlayer component
│   │   │   ├── comments/           ← Comment threads
│   │   │   ├── seo/                ← JsonLd, GoogleAnalytics, GoogleAdSense
│   │   │   ├── ui/                 ← Shared UI primitives (Button, Modal, Spinner...)
│   │   │   ├── admin/              ← Admin-specific components
│   │   │   └── DailyPopup.tsx      ← Daily popup/notification
│   │   ├── store/
│   │   │   ├── index.ts            ← Redux store config
│   │   │   └── slices/
│   │   │       ├── authSlice.ts    ← Auth state (user, tokens)
│   │   │       ├── bookmarkSlice.ts← Bookmarks state
│   │   │       ├── uiSlice.ts      ← UI state (theme, sidebar...)
│   │   │       └── unlockSlice.ts  ← Chapter unlock state
│   │   ├── hooks/                  ← Custom React hooks
│   │   ├── contexts/               ← React contexts
│   │   ├── types/                  ← TypeScript type definitions
│   │   └── utils/                  ← API client, helpers
│   ├── styles/globals.css
│   ├── public/                     ← robots.txt, manifest.json, images, videos
│   └── Dockerfile
│
├── nginx/
│   ├── nginx.conf                  ← Global nginx config (rate limiting zones)
│   └── prod.conf                   ← Virtual hosts: HTTP→HTTPS redirect, routing rules
│
├── uploads/                        ← Shared volume: audio files, images (bind-mount)
│   ├── audio/
│   └── image/
│
├── logs/
│   ├── backend/
│   └── nginx/
│
├── docker-compose.prod.yml         ← Production orchestration
├── docker-compose.dev.yml          ← Local development
└── .env.prod                       ← Environment variables (gitignored)
```

---

## Luồng hoạt động trên VPS Production

### Infrastructure (Docker Compose)

```
5 services chạy trong network "app-network":

postgres:15     ← DB persistent (volume: postgres_data), mem 256M
    ↑ healthcheck: pg_isready
backend:node20  ← API, mem 512M, auto migrate khi start
    ↑ healthcheck: GET /api/health
frontend:next14 ← SSR/SSG, mem 1G
    ↑ started
nginx:alpine    ← Port 80/443 public, mem 128M
certbot         ← Let's Encrypt cert renewal (manual/cron)
```

### Request Flow (Production)

```
User Browser
    │
    ▼
Nginx (port 80/443)
    │
    ├─ HTTP → 301 HTTPS
    │
    ├─ /.well-known/acme-challenge/ → certbot volume (SSL renewal)
    │
    ├─ /api/*  ──────────────────────→ backend:5000 (Express)
    │              rate limit: 300 burst        │
    │                                     Prisma ORM
    │                                           │
    │                                     postgres:5432
    │
    ├─ /uploads/* ───────────────────→ nginx static serve (bind: ./uploads)
    │              cache 1 year
    │
    └─ /* ───────────────────────────→ frontend:3000 (Next.js SSR)
                   WebSocket support (HMR dev)
```

### SSL / Domains

- `phimtruyenhay.com` và `vivutruyenhay.com` đều có cert riêng
- `www.*` redirect → non-www
- HSTS: max-age=31536000, includeSubDomains, preload
- Security headers: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy

### Backend startup sequence

```
docker compose up
    → postgres healthy
    → backend: npx prisma migrate deploy && node src/index.js
    → frontend: next start (PORT=3000)
    → nginx: start proxying
```

### Environment Variables quan trọng

| Biến | Mô tả |
|------|-------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Access token signing key |
| `JWT_REFRESH_SECRET` | Refresh token signing key |
| `NEXT_PUBLIC_API_URL` | Frontend gọi API từ browser (https://domain/api) |
| `API_URL` | Frontend SSR gọi API nội bộ (http://backend:5000/api) |
| `NEXT_PUBLIC_BASE_URL` | Base URL để build absolute URLs cho SEO |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth |
| `FACEBOOK_APP_ID/SECRET` | Facebook OAuth |

---

## Database Schema (Prisma)

### Models chính

| Model | Mô tả |
|-------|-------|
| `User` | Người dùng, roles: USER/ADMIN/EDITOR/REVIEWER, OAuth support |
| `RefreshToken` | Refresh token rotation, token family tracking, revocation |
| `Story` | Truyện (TEXT hoặc AUDIO), slug, viewCount, status: DRAFT/PUBLISHED/HIDDEN |
| `Chapter` | Chapter của story: content (text) hoặc audioUrl (audio), có thể lock |
| `TextGenre` | Thể loại truyện chữ (many-to-many với Story) |
| `AudioGenre` | Thể loại truyện audio (many-to-many với Story) |
| `Comment` | Comment threaded trên chapters |
| `Bookmark` | User bookmark story hoặc film review |
| `FilmReview` | Review phim: rating, reviewLink, tags, isMovie, totalEpisodes, language |
| `FilmEpisode` | Các tập phim: episodeNum, videoUrl, duration, language |
| `FilmComment` | Comment threaded trên film reviews |
| `FilmCategory` | Thể loại phim (many-to-many) |
| `FilmActor` | Diễn viên (many-to-many) |
| `AffiliateLink` | Link affiliate (Google Drive, Fshare, Mega...) gắn vào stories/chapters/films |
| `Media` | File upload (image/audio), track usage |
| `BlogPost` | Blog posts |
| `BlogComment` | Comment trên blog |

### Enums

- `Role`: USER | ADMIN | EDITOR | REVIEWER
- `StoryType`: TEXT | AUDIO
- `StoryStatus`: DRAFT | PUBLISHED | HIDDEN
- `FilmReviewStatus`: DRAFT | PUBLISHED
- `FilmLanguage`: VIETSUB | THUYET_MINH | LONG_TIENG

---

## Tính năng đầy đủ

### User-facing

- **Trang chủ**: Hero banner + sections: Truyện audio mới, Truyện chữ mới, Review phim mới, Trending
- **Truyện Audio**: List với filter thể loại, sort; detail page; audio player HTML5 streaming MP3
- **Truyện Chữ**: List với filter, sort; detail page; chapter reader với nội dung dài
- **Review Phim**: List với filter category/actor/tags; detail với rating, episodes list, videoUrl, affiliate links
- **Thể loại**: Trang browse theo genre (text/audio) và film category
- **Tìm kiếm**: Search stories và film reviews
- **Blog**: Đọc bài viết blog
- **Authentication**: Đăng ký/đăng nhập email+password, Google OAuth, Facebook OAuth
- **Bookmarks**: Lưu stories và film reviews (requires auth)
- **Comments**: Threaded comments trên chapters và film reviews
- **Profile**: Xem/edit thông tin người dùng
- **Dark/Light theme**: Toggle qua Redux uiSlice
- **PWA**: manifest.json, offline-ready

### Admin Panel (`/admin`)

- **Dashboard**: Stats tổng quan (users, stories, chapters, views...)
- **Stories management**: CRUD stories (text + audio), upload thumbnail
- **Chapters management**: CRUD chapters, upload audio files (lên tới 1.5GB)
- **Film Reviews management**: CRUD film reviews, episodes, actors, categories
- **Media library**: Upload/manage images và audio files, track usage
- **User management**: Xem/edit users, phân quyền roles
- **Comment moderation**: Approve/delete comments
- **Affiliate links**: CRUD affiliate links, gắn vào content
- **Settings**: Cấu hình site

### SEO & Performance

- Dynamic metadata (`generateMetadata`) cho mọi trang
- Open Graph tags, Twitter Card
- JSON-LD structured data (Organization, Website, Book, Article, BreadcrumbList)
- Auto-generated sitemap.xml từ DB (revalidate)
- robots.txt tùy chỉnh
- Gzip/compression tại nginx
- Static asset caching 1 năm (`/uploads/*`)
- ISR (Incremental Static Regeneration) với `revalidate: 300`
- Google Analytics, Google AdSense components (opt-in)
- Image optimization qua Next.js Image

### Security

- JWT access token (short-lived) + Refresh token rotation (httpOnly cookie)
- Token family tracking để detect reuse attacks
- Rate limiting: 6000 req/15min global, 600 req/15min cho auth endpoints
- CORS whitelist
- Helmet.js security headers
- Input validation qua validationService
- RBAC: Role-based access control (ADMIN/EDITOR/REVIEWER)
- HTTPS enforced, HSTS

---

## Coding Conventions

### Backend (Node.js/Express)

- **Pattern**: Routes chỉ khai báo path + middleware + gọi controller. Business logic trong controllers.
- **DB**: Luôn dùng singleton `require('./lib/prisma')`, không tạo PrismaClient mới.
- **Auth middleware**: `requireAuth` (JWT verify), `requireAdmin` (role check) từ `middleware/auth.js`.
- **Error handling**: Throw error có `name` và `message`, middleware global xử lý.
- **Uploads**: Files lưu tại `/uploads/` (bind-mounted volume), accessible qua `/uploads/*`.
- **IDs**: Prisma dùng `cuid()` cho tất cả IDs.

### Frontend (Next.js/TypeScript)

- **Data fetching**: Server Components fetch trực tiếp qua `API_URL` (nội bộ Docker). Client Components dùng Redux/hooks.
- **API URL**: Server-side dùng `process.env.API_URL` (http://backend:5000/api). Client-side dùng `NEXT_PUBLIC_API_URL` (https://domain/api).
- **State management**: Redux Toolkit slices: `authSlice` (user/token), `bookmarkSlice`, `uiSlice` (theme), `unlockSlice`.
- **Revalidation**: ISR với `next: { revalidate: 300 }` cho public data.
- **SEO**: Mỗi trang phải có `generateMetadata`, JSON-LD schema phù hợp.
- **Styling**: Tailwind CSS utility classes, dark mode via class strategy.
- **TypeScript**: Strict mode, types định nghĩa trong `src/types/`.

### Database

- **Schema changes**: Tạo migration mới, không edit migration cũ.
- **Soft delete**: Dùng `status` field (HIDDEN/DRAFT), không xoá cứng content.
- **Slugs**: Unique, URL-safe, dùng cho routing (`/truyen-audio/[slug]`, `/phim/[slug]`).

### Docker / Deployment

- **Production**: `docker compose -f docker-compose.prod.yml up -d --build`
- **Migrations**: Tự động chạy `npx prisma migrate deploy` khi backend start.
- **Env file**: `.env.prod` (không commit vào git).
- **Volumes**: `postgres_data` (persistent DB), `./uploads` (bind-mount shared giữa backend+frontend+nginx), `certbot-certs`.
- **Memory limits**: postgres 256M, backend 512M, frontend 1G, nginx 128M.

---

## API Pattern

Tất cả API responses follow format:

```json
// Success list
{ "data": [...], "total": 100, "page": 1, "limit": 10 }

// Success single
{ "data": { ... } }

// Error
{ "error": "Error Type", "message": "Human readable message" }
```

Base URL production: `https://phimtruyenhay.com/api`

---

## File Upload

- **Audio**: MP3, tối đa ~1.5GB, lưu tại `./uploads/audio/`
- **Images**: JPG/PNG/WebP, lưu tại `./uploads/image/`
- **Nginx**: `client_max_body_size 2g` để cho phép upload lớn
- **Backend**: `express.json({ limit: "2gb" })`
- **Track**: `MediaUsage` model track file được dùng ở đâu

---

## Quan trọng khi làm việc với codebase này

1. **Không đổi tên slug fields** — slug được dùng trong URLs, SEO, và sitemap.xml
2. **Giữ nguyên API response format** — Frontend và SEO data depend vào structure hiện tại.
3. **Migration trước khi deploy** — Mọi thay đổi DB đều cần Prisma migration.
4. **Audio streaming** — audioUrl trong Chapter là URL file, không embed base64.
5. **ISR revalidation** — Khi thêm tính năng mới, set revalidate phù hợp (300s mặc định).
6. **Environment separation** — `API_URL` (server, Docker internal) ≠ `NEXT_PUBLIC_API_URL` (browser, HTTPS).
7. **Rate limits** — Auth endpoints có limit riêng ketat hơn (600/15min).
8. **RBAC** — EDITOR chỉ manage stories/chapters, REVIEWER manage film reviews, ADMIN full access.
