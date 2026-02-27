# 🚀 SIMPLE DEPLOYMENT GUIDE - WebTruyen

**Domain:** vivutruyenhay.com  
**VPS IP:** 103.199.18.123  
**OS:** Ubuntu 20.04 LTS  
**Stack:** Docker + Nginx + PostgreSQL + Node.js + Next.js

---

## 📋 PHẦN 1: CHẠY LOCAL (Development)

### 1. Clone project

```bash
git clone https://github.com/loihd98/vivutruyenhay.git
cd vivutruyenhay
```

### 2. Setup environment

```bash
# Environment file đã có sẵn .env.dev với config:
# - NEXT_PUBLIC_API_URL=http://localhost/api
# - NEXT_PUBLIC_FRONTEND_URL=http://localhost
# - NEXT_PUBLIC_MEDIA_URL=http://localhost
# - All traffic goes through nginx on port 80
```

### 3. Start development với Docker

```bash
# Build và start tất cả services local
docker compose -f docker-compose.dev.yml up -d --build

# Kiểm tra services
docker compose -f docker-compose.dev.yml ps

# Check logs nếu có lỗi
docker compose -f docker-compose.dev.yml logs -f
```

### 4. Truy cập local

- **Website:** http://localhost (nginx reverse proxy)
- **API:** http://localhost/api (nginx → backend:5000)
- **Uploads:** http://localhost/uploads/\* (nginx static files)
- **Direct Backend:** http://localhost:5000 (dev debug only)
- **Direct Frontend:** http://localhost:3000 (dev debug only)
- **Database:** PostgreSQL localhost:5432

### 5. Architecture Development

```
Browser → nginx:80 → {
  /api/* → backend:5000
  /uploads/* → static files
  /* → frontend:3000
}
```

---

## 🌐 PHẦN 2: DEPLOY PRODUCTION (VPS)

### 1. Setup VPS Ubuntu 20.04

```bash
# SSH vào VPS
ssh root@103.199.18.123

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ufw apt-transport-https ca-certificates gnupg lsb-release

# Mở firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Install Docker

> ⚠️ **Ubuntu 20.04 (focal):** Do NOT use `curl -fsSL https://get.docker.com | sh` — it will fail because  
> `docker-model-plugin` is not available on focal. Use the manual apt method below instead.

```bash
# Add Docker's official GPG key
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker apt repository (focal)
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker (without docker-model-plugin which is unavailable on focal)
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-buildx-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

# Reload group without logout
newgrp docker

# Verify
docker --version
docker compose version
```

### 2b. Configure Docker Registry Mirror (bắt buộc cho VPS Việt Nam)

> ⚠️ VPS tại Việt Nam thường không kết nối được trực tiếp tới `registry-1.docker.io` (TLS timeout).  
> Cần cấu hình mirror trước khi chạy `docker compose`.

```bash
# Tạo hoặc chỉnh sửa file daemon.json
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://mirror.gcr.io",
    "https://registry.docker-cn.com",
    "https://docker.mirrors.ustc.edu.cn"
  ],
  "dns": ["8.8.8.8", "1.1.1.1"]
}
EOF

# Reload và restart Docker daemon
sudo systemctl daemon-reload
sudo systemctl restart docker

# Verify Docker is running
sudo systemctl status docker

# Test pull works
docker pull hello-world
```

### 3. Clone project trên VPS

```bash
cd /opt
sudo git clone https://github.com/loihd98/vivutruyenhay.git webtruyen
sudo chown -R $USER:$USER webtruyen
cd webtruyen

# Tạo uploads directory
mkdir -p uploads
```

### 4. Setup production environment

```bash
# Environment file .env.prod đã có config:
# - NEXT_PUBLIC_API_URL=https://vivutruyenhay.com/api
# - NEXT_PUBLIC_BASE_URL=https://vivutruyenhay.com
# - NEXT_PUBLIC_MEDIA_URL=https://vivutruyenhay.com
# - BASE_URL=https://vivutruyenhay.com
# - CORS_ORIGIN=https://vivutruyenhay.com

# ⚠️ QUAN TRỌNG: Đổi các secrets trong .env.prod
nano .env.prod
# Thay đổi:
# - JWT_SECRET=your-new-strong-secret-min-32-chars
# - JWT_REFRESH_SECRET=your-new-refresh-secret-min-32-chars
# - NEXTAUTH_SECRET=your-nextauth-secret-min-32-chars
# - POSTGRES_PASSWORD=your-strong-db-password
```

### 5. Configure DNS

Trong domain registrar của bạn, set A record:

- **@** → 103.199.18.123
- **www** → 103.199.18.123

Verify DNS:

```bash
dig +short vivutruyenhay.com
# Phải trả về: 103.199.18.123
```

### 6. Start production containers

```bash
# Build và start production
docker compose -f docker-compose.prod.yml up -d --build

# Check containers
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

### 4. Configure DNS

Trong domain registrar của bạn, set A record:

- **@** → 103.199.18.123
- **www** → 103.199.18.123

Verify DNS:

```bash
dig +short vivutruyenhay.com
# Phải trả về: 103.199.18.123
```

### 5. Start production containers

```bash
# Build và start production
docker compose -f docker-compose.prod.yml up -d --build

# Check containers
docker compose -f docker-compose.prod.yml ps
```

### 7. Test HTTP first (before SSL)

```bash
# Test website HTTP access
curl -I http://vivutruyenhay.com
curl -I http://103.199.18.123

# Test API
curl http://vivutruyenhay.com/api/health
curl http://103.199.18.123/api/health

# If works, proceed to SSL setup
```

### 8. Setup SSL với Let's Encrypt

```bash
# Get SSL certificates
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  -d vivutruyenhay.com -d www.vivutruyenhay.com \
  --email your@email.com --agree-tos --no-eff-email

# Restart nginx để load SSL
docker compose -f docker-compose.prod.yml restart nginx

# Wait for nginx to restart
sleep 5
```

### 9. Run database migrations

```bash
# Chạy Prisma migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Hoặc nếu exec không work:
docker compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
```

### 10. Verify production website

- **HTTPS:** https://vivutruyenhay.com
- **HTTP redirect:** http://vivutruyenhay.com → https://vivutruyenhay.com
- **API:** https://vivutruyenhay.com/api/health
- **Uploads:** https://vivutruyenhay.com/uploads/* (static files)

### 11. Production Architecture

```
Browser → nginx:443/80 → {
  HTTP → HTTPS redirect
  /api/* → backend:5000
  /uploads/* → static files
  /* → frontend:3000
}
```

---

## 🔧 KIỂM TRA & DEBUG

### Check logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Test API

```bash
# Health check
curl -i https://vivutruyenhay.com/api/health

# From browser console
fetch('https://vivutruyenhay.com/api/health')
```

### Restart services

```bash
# Restart all
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart nginx
```

---

## 🔄 AUTO SSL RENEWAL

Add cron job cho SSL renewal:

```bash
# Edit crontab
crontab -e

# Add line (runs daily at 3 AM)
0 3 * * * cd /opt/webtruyen && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker compose -f docker-compose.prod.yml restart nginx
```

---

## 📊 COMMON TROUBLESHOOTING

### 1. Nginx 502 Bad Gateway

```bash
# Check backend logs
docker compose -f docker-compose.prod.yml logs backend

# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

### 2. SSL Certificate errors

```bash
# Check certificate files
docker compose -f docker-compose.prod.yml exec nginx ls -la /etc/letsencrypt/live/vivutruyenhay.com/

# Restart nginx
docker compose -f docker-compose.prod.yml restart nginx
```

### 3. CORS errors

- Check `.env.prod` has correct `CORS_ORIGIN=https://vivutruyenhay.com`
- Check `NEXT_PUBLIC_API_URL=https://vivutruyenhay.com/api`

### 4. Database connection errors

```bash
# Check PostgreSQL
docker compose -f docker-compose.prod.yml logs postgres

# Check DATABASE_URL in .env.prod
```

---

## 🎯 API ENDPOINTS MAPPING

### Development (localhost)

| URL                          | Proxy To             | Description     |
| ---------------------------- | -------------------- | --------------- |
| `http://localhost/`          | `frontend:3000`      | Next.js website |
| `http://localhost/api/*`     | `backend:5000/api/*` | API endpoints   |
| `http://localhost/uploads/*` | `/uploads/*`         | Static files    |

### Production (vivutruyenhay.com)

| URL                                   | Proxy To             | Description     |
| ------------------------------------- | -------------------- | --------------- |
| `https://vivutruyenhay.com/`          | `frontend:3000`      | Next.js website |
| `https://vivutruyenhay.com/api/*`     | `backend:5000/api/*` | API endpoints   |
| `https://vivutruyenhay.com/uploads/*` | `/uploads/*`         | Static files    |

### Frontend API calls:

```javascript
// ✅ Production
const response = await fetch("https://vivutruyenhay.com/api/stories");

// ✅ Development (updated - via nginx)
const response = await fetch("http://localhost/api/stories");

// ❌ Old way (direct backend - don't use)
const response = await fetch("http://localhost:5000/api/stories");
```

### Environment Variables Summary:

```bash
# Development (.env.dev)
NEXT_PUBLIC_API_URL=http://localhost/api
NEXT_PUBLIC_MEDIA_URL=http://localhost

# Production (.env.prod)
NEXT_PUBLIC_API_URL=https://vivutruyenhay.com/api
NEXT_PUBLIC_MEDIA_URL=https://vivutruyenhay.com
```

---

**🎉 HOÀN TẤT!** Website đã sẵn sàng tại https://vivutruyenhay.com
