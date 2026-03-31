# RBAC System — Production Deployment Guide

## Overview

Hệ thống RBAC (Role-Based Access Control) với:

- 3 vai trò: `USER`, `ADMIN`, `EDITOR`
- Phân quyền theo tài nguyên (resource-based permissions)
- MediaUsage tracking (theo dõi sử dụng media)
- UI visibility control (ẩn/hiện theo quyền)

---

## 1. Pre-Deployment Checklist

- [ ] Backup database hiện tại
- [ ] Kiểm tra Docker containers đang chạy
- [ ] Verify `.env` files

---

## 2. Backup Commands

```bash
# Backup PostgreSQL database
docker exec -t <postgres_container> pg_dump -U <user> -d <dbname> > backup_$(date +%Y%m%d_%H%M%S).sql

# Or if using docker-compose
docker-compose exec db pg_dump -U postgres -d vivutruyenghay > backup_pre_rbac.sql

# Backup toàn bộ volumes
docker run --rm -v themidnightmoviereel_pgdata:/data -v $(pwd):/backup alpine tar czf /backup/pgdata_backup.tar.gz /data
```

---

## 3. Migration Steps

### Step 1: Pull code mới

```bash
git pull origin master
```

### Step 2: Run Prisma migration

```bash
cd backend

# Generate migration (nếu chưa có)
npx prisma migrate dev --name add_rbac_system

# Hoặc deploy migration trong production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Step 3: Seed permissions

```bash
# Seed default permissions and role-permission mapping
node src/scripts/seed-permissions.js
```

### Step 4: Rebuild và restart containers

```bash
# Build lại
docker-compose -f docker-compose.prod.yml build

# Restart
docker-compose -f docker-compose.prod.yml up -d

# Chạy migration bên trong container
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend node src/scripts/seed-permissions.js
```

---

## 4. Verification Queries

Chạy các query sau để verify:

```sql
-- Kiểm tra bảng permissions đã tạo
SELECT count(*) FROM permissions;
-- Expected: ~28 permissions

-- Kiểm tra role_permissions
SELECT role, count(*) FROM role_permissions WHERE granted = true GROUP BY role;
-- Expected:
--   EDITOR   → ~17
--   USER     → ~3

-- Kiểm tra schema mới
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'permissions';

-- Kiểm tra media_usages table
SELECT count(*) FROM information_schema.tables WHERE table_name = 'media_usages';
-- Expected: 1

-- Kiểm tra Role enum có đủ giá trị
SELECT enum_range(NULL::\"Role\");
-- Expected: {USER,ADMIN,EDITOR,PREMIUM}
```

---

## 5. Rollback Strategy

### Nếu migration lỗi

```bash
# Rollback migration cuối
npx prisma migrate resolve --rolled-back <migration_name>

# Restore database từ backup
docker exec -i <postgres_container> psql -U <user> -d <dbname> < backup_pre_rbac.sql
```

### Nếu app lỗi sau deploy

```bash
# Rollback code
git revert HEAD

# Rebuild
docker-compose -f docker-compose.prod.yml build backend frontend
docker-compose -f docker-compose.prod.yml up -d
```

### Tables an toàn để drop nếu cần rollback hoàn toàn

```sql
-- Thứ tự drop (do foreign keys)
DROP TABLE IF EXISTS media_usages;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;

-- Revert Role enum (chỉ khi không có user nào role EDITOR/REVIEWER)
-- ALTER TYPE "Role" RENAME TO "Role_old";
-- CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
-- ALTER TABLE users ALTER COLUMN role TYPE "Role" USING role::text::"Role";
-- DROP TYPE "Role_old";
```

---

## 6. Data Safety Checklist

- [x] Migration chỉ ADD tables/columns — không DROP/ALTER bảng hiện tại
- [x] Bảng `users` không bị thay đổi cấu trúc
- [x] Role enum chỉ thêm giá trị mới (EDITOR, PREMIUM)
- [x] User hiện tại không bị ảnh hưởng
- [x] ADMIN role vẫn bypass tất cả permission checks
- [x] `requireAdmin` middleware cũ vẫn hoạt động (backward compatible)
- [x] Cookie/JWT flow không thay đổi

---

## 7. Post-Deployment Verification

```bash
# Test API health
curl http://localhost:5000/api/health

# Test permission endpoint (cần auth token)
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/auth/me/permissions

# Test permission matrix (admin only)
curl -H "Authorization: Bearer <admin_token>" http://localhost:5000/api/permissions/matrix

# Test admin access still works
curl -H "Authorization: Bearer <admin_token>" http://localhost:5000/api/admin/dashboard/stats
```

---

## 8. Tạo user EDITOR

```sql
-- Cập nhật role cho user hiện có
UPDATE users SET role = 'EDITOR' WHERE email = 'editor@example.com';
```

Hoặc qua Admin Panel → Users → Update Role.

---

## 9. Cấu trúc files mới

### Backend

- `prisma/schema.prisma` — Thêm Permission, RolePermission, MediaUsage models
- `src/utils/permissionService.js` — Permission cache & check logic
- `src/utils/mediaUsageService.js` — Media usage tracking
- `src/controllers/permissionsController.js` — CRUD API
- `src/routes/permissions.js` — Route definitions
- `src/scripts/seed-permissions.js` — Seed data
- `src/middleware/auth.js` — Thêm requirePermission, requireAdminAccess

### Frontend

- `src/types/index.ts` — Permission, PermissionMatrix types
- `src/types/admin.ts` — Thêm "roles" tab
- `src/hooks/usePermissions.ts` — Permission check hook
- `src/components/admin/RoleManagement.tsx` — Matrix UI
- `src/components/admin/AdminSidebar.tsx` — Permission-based visibility
- `src/components/admin/AdminGuard.tsx` — Allow EDITOR/REVIEWER
