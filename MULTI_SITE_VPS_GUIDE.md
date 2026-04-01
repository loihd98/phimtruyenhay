# Multi-Site VPS Deployment Guide

Hướng dẫn deploy **nhiều website** trên **cùng 1 VPS** sử dụng Docker + Nginx Reverse Proxy.

## Kiến trúc tổng quan

```
Internet → VPS (103.199.17.168)
    ├─ Port 80/443 → Gateway Nginx (shared reverse proxy)
    │       ├─ phimtruyenhay.com → Site 1 (docker-compose stack)
    │       └─ site2.com → Site 2 (docker-compose stack)
    └─ Certbot (SSL cho tất cả domains)
```

**Nguyên tắc:**

- 1 Gateway Nginx duy nhất giữ port 80/443
- Mỗi site là 1 docker-compose stack riêng, KHÔNG expose port ra host
- Tất cả dùng chung 1 Docker network (`gateway-network`)
- Gateway route theo domain name

---

## Bước 1: Tạo folder cấu trúc trên VPS

```bash
# SSH vào VPS
ssh root@103.199.17.168

# Tạo cấu trúc
mkdir -p /opt/gateway/nginx/conf.d
mkdir -p /opt/gateway/certbot/www
mkdir -p /opt/gateway/certbot/certs
mkdir -p /opt/sites/phimtruyenhay     # Site 1
mkdir -p /opt/sites/site2             # Site 2
```

## Bước 2: Tạo shared Docker network

```bash
docker network create gateway-network
```

## Bước 3: Setup Gateway Nginx

### File: `/opt/gateway/docker-compose.yml`

```yaml
services:
  nginx-gateway:
    image: nginx:alpine
    container_name: nginx-gateway
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certbot/www:/var/www/certbot:ro
      - ./certbot/certs:/etc/letsencrypt:ro
      - /opt/sites/phimtruyenhay/uploads:/uploads/phimtruyenhay:ro
      # Thêm uploads cho site 2 nếu cần
      # - /opt/sites/site2/uploads:/uploads/site2:ro
    networks:
      - gateway-network
    deploy:
      resources:
        limits:
          memory: 128M

  certbot:
    image: certbot/certbot
    container_name: certbot
    restart: unless-stopped
    volumes:
      - ./certbot/www:/var/www/certbot:rw
      - ./certbot/certs:/etc/letsencrypt:rw
    entrypoint: /bin/sh -c "trap exit TERM; while :; do certbot renew --webroot -w /var/www/certbot --quiet; sleep 12h & wait $${!}; done"
    networks:
      - gateway-network

networks:
  gateway-network:
    external: true
```

### File: `/opt/gateway/nginx/nginx.conf`

```nginx
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
    multi_accept on;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" $request_time';

    access_log /var/log/nginx/access.log main;
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout  65;
    types_hash_max_size 2048;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_types text/plain text/css text/javascript application/javascript application/json application/xml image/svg+xml font/woff2;

    client_max_body_size 2g;
    server_tokens off;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=150r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=90r/s;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    include /etc/nginx/conf.d/*.conf;
}
```

### File: `/opt/gateway/nginx/conf.d/phimtruyenhay.conf`

```nginx
########################################################
# Site 1: phimtruyenhay.com
########################################################

# HTTP → HTTPS + Let's Encrypt
server {
    listen 80;
    server_name phimtruyenhay.com www.phimtruyenhay.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS www → non-www
server {
    listen 443 ssl;
    http2 on;
    server_name www.phimtruyenhay.com;

    ssl_certificate /etc/letsencrypt/live/phimtruyenhay.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/phimtruyenhay.com/privkey.pem;

    return 301 https://phimtruyenhay.com$request_uri;
}

# HTTPS main
server {
    listen 443 ssl;
    http2 on;
    server_name phimtruyenhay.com;

    ssl_certificate /etc/letsencrypt/live/phimtruyenhay.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/phimtruyenhay.com/privkey.pem;

    client_max_body_size 2g;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # API → backend container (tên container trong docker-compose của site 1)
    location /api/ {
        limit_req zone=api burst=300 nodelay;
        proxy_pass http://phimtruyenhay-backend:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        add_header Cache-Control "no-store";
    }

    # Frontend → Next.js container
    location / {
        proxy_pass http://phimtruyenhay-frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Next.js static assets
    location /_next/static/ {
        proxy_pass http://phimtruyenhay-frontend:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Static uploads
    location ^~ /uploads/ {
        alias /uploads/phimtruyenhay/;
        autoindex off;
        expires 1y;
        add_header Cache-Control "public, immutable";

        location ~* \.(mp3|mp4|wav|ogg|m4a|aac|flac)$ {
            add_header Accept-Ranges bytes;
            add_header Cache-Control "public, max-age=86400";
        }
    }

    location ~* \.(ico|svg|png|webp)$ {
        proxy_pass http://phimtruyenhay-frontend:3000;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }
}
```

### File: `/opt/gateway/nginx/conf.d/site2.conf` (Template cho site 2)

```nginx
########################################################
# Site 2: site2.com (thay domain thật của bạn)
########################################################

server {
    listen 80;
    server_name site2.com www.site2.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name site2.com;

    ssl_certificate /etc/letsencrypt/live/site2.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/site2.com/privkey.pem;

    client_max_body_size 100m;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Thay container name và port phù hợp với site 2
    location /api/ {
        proxy_pass http://site2-backend:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://site2-frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Bước 4: Sửa docker-compose.prod.yml của Site 1

**Thay đổi chính:**

- Xóa service `nginx` và `certbot` (Gateway xử lý)
- Xóa port expose
- Thêm `container_name` cố định
- Thêm external network `gateway-network`

Sử dụng file `docker-compose.multisite.yml`:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: phimtruyenhay-postgres
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
    env_file:
      - .env.prod
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 256M
    networks:
      - internal
      - gateway-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      args:
        - NODE_ENV=production
    container_name: phimtruyenhay-backend
    restart: unless-stopped
    volumes:
      - ./uploads:/uploads
    env_file:
      - .env.prod
    depends_on:
      postgres:
        condition: service_healthy
    command: sh -c "npx prisma migrate deploy && node src/index.js"
    healthcheck:
      test: ["CMD", "node", "src/scripts/healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 512M
    networks:
      - internal
      - gateway-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - NODE_OPTIONS=--max-old-space-size=2048
        - NODE_ENV=production
        - NEXT_PUBLIC_API_URL=https://phimtruyenhay.com/api
        - NEXT_PUBLIC_BASE_URL=https://phimtruyenhay.com
        - NEXT_PUBLIC_MEDIA_URL=https://phimtruyenhay.com
    container_name: phimtruyenhay-frontend
    restart: unless-stopped
    volumes:
      - ./uploads:/app/public/uploads:ro
    env_file:
      - .env.prod
    environment:
      - NODE_OPTIONS=--max-old-space-size=1024
      - PORT=3000
      - API_URL=http://phimtruyenhay-backend:5000/api
      - MEDIA_URL_INTERNAL=http://nginx-gateway
    depends_on:
      backend:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 1G
    networks:
      - internal
      - gateway-network

volumes:
  postgres_data:

networks:
  internal:
    driver: bridge
  gateway-network:
    external: true
```

---

## Bước 5: Deploy từ đầu

### 5.1. Upload code lên VPS

```bash
# Từ máy local, rsync code lên VPS
rsync -avz --exclude node_modules --exclude .next --exclude postgres_data \
  ./phimtruyenhay/ root@103.199.17.168:/opt/sites/phimtruyenhay/
```

### 5.2. Tạo shared network

```bash
ssh root@103.199.17.168
docker network create gateway-network
```

### 5.3. Lấy SSL certificate (lần đầu)

```bash
# Chạy Gateway với config HTTP tạm (chưa có SSL)
cd /opt/gateway

# Tạo file tạm để lấy cert
cat > nginx/conf.d/temp.conf << 'EOF'
server {
    listen 80;
    server_name phimtruyenhay.com www.phimtruyenhay.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
EOF

docker compose up -d nginx-gateway

# Lấy cert
docker run --rm \
  -v /opt/gateway/certbot/www:/var/www/certbot \
  -v /opt/gateway/certbot/certs:/etc/letsencrypt \
  certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  -d phimtruyenhay.com \
  -d www.phimtruyenhay.com \
  --email your-email@gmail.com \
  --agree-tos --no-eff-email

# Lấy cert cho site 2
docker run --rm \
  -v /opt/gateway/certbot/www:/var/www/certbot \
  -v /opt/gateway/certbot/certs:/etc/letsencrypt \
  certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  -d site2.com \
  -d www.site2.com \
  --email your-email@gmail.com \
  --agree-tos --no-eff-email

# Xóa config tạm, thay bằng config thật
rm nginx/conf.d/temp.conf
# Copy phimtruyenhay.conf và site2.conf vào nginx/conf.d/

docker compose down
```

### 5.4. Start Site 1

```bash
cd /opt/sites/phimtruyenhay
docker compose -f docker-compose.multisite.yml up -d --build
```

### 5.5. Start Gateway

```bash
cd /opt/gateway
docker compose up -d
```

### 5.6. Start Site 2

```bash
cd /opt/sites/site2
docker compose -f docker-compose.yml up -d --build
```

---

## Bước 6: Thêm Site 2 (website mới)

### 6.1. Tạo docker-compose.yml cho site 2

```yaml
# /opt/sites/site2/docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    container_name: site2-postgres
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=site2user
      - POSTGRES_PASSWORD=STRONG_PASSWORD_HERE
      - POSTGRES_DB=site2db
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U site2user -d site2db"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - internal

  backend:
    build: ./backend
    container_name: site2-backend
    restart: unless-stopped
    env_file: .env.prod
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - internal
      - gateway-network

  frontend:
    build: ./frontend
    container_name: site2-frontend
    restart: unless-stopped
    env_file: .env.prod
    depends_on:
      - backend
    networks:
      - internal
      - gateway-network

volumes:
  postgres_data:

networks:
  internal:
    driver: bridge
  gateway-network:
    external: true
```

### 6.2. Thêm nginx config cho site 2

```bash
# Tạo /opt/gateway/nginx/conf.d/site2.conf (dùng template ở trên)
# Restart gateway
cd /opt/gateway
docker compose restart nginx-gateway
```

---

## Quản lý hàng ngày

### Xem logs

```bash
# Gateway
docker logs nginx-gateway -f

# Site 1
docker logs phimtruyenhay-frontend -f
docker logs phimtruyenhay-backend -f

# Site 2
docker logs site2-frontend -f
```

### Restart services

```bash
# Restart 1 site (không ảnh hưởng site khác)
cd /opt/sites/phimtruyenhay
docker compose -f docker-compose.multisite.yml restart

# Restart gateway (ảnh hưởng tất cả sites)
cd /opt/gateway
docker compose restart nginx-gateway
```

### Update code

```bash
# Từ local
rsync -avz --exclude node_modules --exclude .next --exclude postgres_data \
  ./phimtruyenhay/ root@103.199.17.168:/opt/sites/phimtruyenhay/

# Trên VPS
cd /opt/sites/phimtruyenhay
docker compose -f docker-compose.multisite.yml up -d --build
```

### Renew SSL (tự động, nhưng manual nếu cần)

```bash
docker exec certbot certbot renew --quiet
cd /opt/gateway && docker compose restart nginx-gateway
```

---

## Tài nguyên VPS (khuyến nghị)

| Sites    | RAM tối thiểu | RAM khuyến nghị | CPU       |
| -------- | ------------- | --------------- | --------- |
| 1 site   | 2 GB          | 4 GB            | 2 cores   |
| 2 sites  | 4 GB          | 6 GB            | 2-4 cores |
| 3+ sites | 6 GB          | 8 GB            | 4 cores   |

### Kiểm tra tài nguyên

```bash
# RAM usage
docker stats --no-stream

# Disk usage
docker system df
df -h
```

---

## Troubleshooting

### Container không thấy nhau

```bash
# Kiểm tra network
docker network inspect gateway-network

# Đảm bảo tất cả containers cần giao tiếp đều trong gateway-network
docker network connect gateway-network phimtruyenhay-backend
docker network connect gateway-network phimtruyenhay-frontend
```

### SSL certificate lỗi

```bash
# Kiểm tra cert exists
ls -la /opt/gateway/certbot/certs/live/

# Lấy lại cert
docker run --rm \
  -v /opt/gateway/certbot/www:/var/www/certbot \
  -v /opt/gateway/certbot/certs:/etc/letsencrypt \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d yourdomain.com --force-renewal
```

### Port 80/443 bị chiếm

```bash
# Tìm process dùng port
ss -tlnp | grep -E ':80|:443'

# Nếu là nginx trên host
systemctl stop nginx
systemctl disable nginx
```
