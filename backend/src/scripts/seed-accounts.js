"use strict";
/**
 * Seed user accounts + permissions + role mappings.
 * Creates: ADMIN, EDITOR, and demo USER accounts.
 * Also seeds permissions & role-permission mappings.
 *
 * Usage: node src/scripts/seed-accounts.js
 * Idempotent – safe to run multiple times.
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// ─── Account data ─────────────────────────────────────────────────────────────

const ACCOUNTS = [
  {
    email: "admin@themidnightmoviereel.io.vn",
    password: "Admin@Midnight2026!",
    name: "Admin Midnight",
    role: "ADMIN",
  },
  {
    email: "editor@themidnightmoviereel.io.vn",
    password: "Editor@Midnight2026!",
    name: "Editor Midnight",
    role: "EDITOR",
  },
  {
    email: "demo@themidnightmoviereel.io.vn",
    password: "Demo@Midnight2026!",
    name: "Demo User",
    role: "USER",
  },
];

// ─── Permissions (mirrors seed-permissions.js — code is the unique key) ──────

const PERMISSIONS = [
  // Story Text
  { code: "story_text.view", name: "Xem truyện text", group: "story_text", type: "view", description: "Xem danh sách và chi tiết truyện text" },
  { code: "story_text.create", name: "Tạo truyện text", group: "story_text", type: "action", description: "Tạo truyện text mới" },
  { code: "story_text.update", name: "Sửa truyện text", group: "story_text", type: "action", description: "Chỉnh sửa truyện text" },
  { code: "story_text.delete", name: "Xóa truyện text", group: "story_text", type: "action", description: "Xóa truyện text" },
  // Story Audio
  { code: "story_audio.view", name: "Xem truyện audio", group: "story_audio", type: "view", description: "Xem danh sách và chi tiết truyện audio" },
  { code: "story_audio.create", name: "Tạo truyện audio", group: "story_audio", type: "action", description: "Tạo truyện audio mới" },
  { code: "story_audio.update", name: "Sửa truyện audio", group: "story_audio", type: "action", description: "Chỉnh sửa truyện audio" },
  { code: "story_audio.delete", name: "Xóa truyện audio", group: "story_audio", type: "action", description: "Xóa truyện audio" },
  // Film
  { code: "film.view", name: "Xem phim", group: "film", type: "view", description: "Xem danh sách và chi tiết phim" },
  { code: "film.create", name: "Tạo phim", group: "film", type: "action", description: "Tạo bài review phim mới" },
  { code: "film.update", name: "Sửa phim", group: "film", type: "action", description: "Chỉnh sửa bài review phim" },
  { code: "film.delete", name: "Xóa phim", group: "film", type: "action", description: "Xóa bài review phim" },
  // User
  { code: "user.view", name: "Xem người dùng", group: "user", type: "view", description: "Xem danh sách người dùng" },
  { code: "user.update", name: "Sửa người dùng", group: "user", type: "action", description: "Chỉnh sửa thông tin người dùng" },
  { code: "user.delete", name: "Xóa người dùng", group: "user", type: "action", description: "Xóa tài khoản người dùng" },
  // Admin
  { code: "admin.access", name: "Truy cập Admin", group: "admin", type: "view", description: "Quyền truy cập trang admin" },
  { code: "admin.dashboard.view", name: "Xem Dashboard", group: "admin", type: "view", description: "Xem trang tổng quan admin" },
  // Media
  { code: "media.view", name: "Xem media", group: "media", type: "view", description: "Xem danh sách file media" },
  { code: "media.upload", name: "Upload media", group: "media", type: "action", description: "Upload file media mới" },
  { code: "media.delete", name: "Xóa media", group: "media", type: "action", description: "Xóa file media" },
  // Moderation
  { code: "comment.moderate", name: "Duyệt bình luận", group: "moderation", type: "action", description: "Duyệt và quản lý bình luận" },
  // Blog
  { code: "blog.view", name: "Xem blog", group: "blog", type: "view", description: "Xem tất cả bài blog" },
  { code: "blog.create", name: "Viết blog", group: "blog", type: "action", description: "Tạo bài blog mới" },
  { code: "blog.update", name: "Sửa blog", group: "blog", type: "action", description: "Chỉnh sửa bài blog" },
  { code: "blog.delete", name: "Xóa blog", group: "blog", type: "action", description: "Xóa bài blog" },
  { code: "blog.category.create", name: "Thêm danh mục blog", group: "blog", type: "action", description: "Thêm danh mục blog mới" },
  { code: "blog.category.update", name: "Sửa danh mục blog", group: "blog", type: "action", description: "Sửa danh mục blog" },
  { code: "blog.category.delete", name: "Xóa danh mục blog", group: "blog", type: "action", description: "Xóa danh mục blog" },
];

// Role → permission codes (granted: true)
const ROLE_PERMISSIONS = {
  ADMIN: PERMISSIONS.map((p) => ({ code: p.code, granted: true })),
  EDITOR: [
    { code: "story_text.view", granted: true },
    { code: "story_text.create", granted: true },
    { code: "story_text.update", granted: true },
    { code: "story_text.delete", granted: true },
    { code: "story_audio.view", granted: true },
    { code: "story_audio.create", granted: true },
    { code: "story_audio.update", granted: true },
    { code: "story_audio.delete", granted: true },
    { code: "film.view", granted: true },
    { code: "film.create", granted: true },
    { code: "film.update", granted: true },
    { code: "film.delete", granted: true },
    { code: "admin.access", granted: true },
    { code: "admin.dashboard.view", granted: true },
    { code: "media.view", granted: true },
    { code: "media.upload", granted: true },
    { code: "media.delete", granted: true },
    { code: "comment.moderate", granted: true },
    { code: "blog.view", granted: true },
    { code: "blog.create", granted: true },
    { code: "blog.update", granted: true },
    { code: "blog.delete", granted: true },
    { code: "blog.category.create", granted: true },
    { code: "blog.category.update", granted: true },
    { code: "blog.category.delete", granted: true },
  ],
  USER: [
    { code: "story_text.view", granted: true },
    { code: "story_audio.view", granted: true },
    { code: "film.view", granted: true },
    { code: "blog.create", granted: true },
    { code: "blog.update", granted: true },
  ],
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding accounts, permissions & roles...\n");

  // 1. Create user accounts first
  console.log("👤 Seeding accounts...");
  for (const acc of ACCOUNTS) {
    const passwordHash = await bcrypt.hash(acc.password, 12);
    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: { name: acc.name, role: acc.role },
      create: {
        email: acc.email,
        passwordHash,
        name: acc.name,
        role: acc.role,
      },
    });
    console.log(`   ✅ ${user.email} [${user.role}] / ${acc.password}`);
  }

  // 2. Upsert permissions (using code as unique key)
  console.log("\n🔐 Seeding permissions...");
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        name: perm.name,
        group: perm.group,
        type: perm.type,
        description: perm.description,
      },
      create: perm,
    });
  }
  console.log(`   ✅ ${PERMISSIONS.length} permissions`);

  // 3. Build code→id map
  const dbPermissions = await prisma.permission.findMany();
  const permissionMap = {};
  for (const p of dbPermissions) {
    permissionMap[p.code] = p.id;
  }

  // 4. Seed role-permission mappings via RolePermission table
  console.log("\n👥 Seeding role-permission mappings...");
  for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
    let count = 0;
    for (const { code, granted } of perms) {
      const permissionId = permissionMap[code];
      if (!permissionId) {
        console.warn(`   ⚠️  Permission "${code}" not found, skipping`);
        continue;
      }
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role, permissionId } },
        update: { granted },
        create: { role, permissionId, granted },
      });
      count++;
    }
    console.log(`   ✅ ${role}: ${count} permissions mapped`);
  }

  console.log("\n✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
