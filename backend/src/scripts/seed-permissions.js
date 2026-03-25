const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Default permissions for the RBAC system
 */
const PERMISSIONS = [
  // Story Text
  { code: "story_text.view", name: "Xem truyện text", group: "story_text", type: "view", description: "Xem danh sách và chi tiết truyện text" },
  { code: "story_text.create", name: "Tạo truyện text", group: "story_text", type: "action", description: "Tạo truyện text mới" },
  { code: "story_text.update", name: "Sửa truyện text", group: "story_text", type: "action", description: "Chỉnh sửa truyện text" },
  { code: "story_text.delete", name: "Xóa truyện text", group: "story_text", type: "action", description: "Xóa truyện text" },
  { code: "story_text.genre.create", name: "Thêm thể loại text", group: "story_text", type: "action", description: "Thêm thể loại truyện text mới" },
  { code: "story_text.genre.update", name: "Sửa thể loại text", group: "story_text", type: "action", description: "Sửa thể loại truyện text" },
  { code: "story_text.genre.delete", name: "Xóa thể loại text", group: "story_text", type: "action", description: "Xóa thể loại truyện text" },

  // Story Audio
  { code: "story_audio.view", name: "Xem truyện audio", group: "story_audio", type: "view", description: "Xem danh sách và chi tiết truyện audio" },
  { code: "story_audio.create", name: "Tạo truyện audio", group: "story_audio", type: "action", description: "Tạo truyện audio mới" },
  { code: "story_audio.update", name: "Sửa truyện audio", group: "story_audio", type: "action", description: "Chỉnh sửa truyện audio" },
  { code: "story_audio.delete", name: "Xóa truyện audio", group: "story_audio", type: "action", description: "Xóa truyện audio" },
  { code: "story_audio.genre.create", name: "Thêm thể loại audio", group: "story_audio", type: "action", description: "Thêm thể loại truyện audio mới" },
  { code: "story_audio.genre.update", name: "Sửa thể loại audio", group: "story_audio", type: "action", description: "Sửa thể loại truyện audio" },
  { code: "story_audio.genre.delete", name: "Xóa thể loại audio", group: "story_audio", type: "action", description: "Xóa thể loại truyện audio" },

  // Film
  { code: "film.view", name: "Xem phim", group: "film", type: "view", description: "Xem danh sách và chi tiết phim" },
  { code: "film.create", name: "Tạo phim", group: "film", type: "action", description: "Tạo bài review phim mới" },
  { code: "film.update", name: "Sửa phim", group: "film", type: "action", description: "Chỉnh sửa bài review phim" },
  { code: "film.delete", name: "Xóa phim", group: "film", type: "action", description: "Xóa bài review phim" },
  { code: "film.genre.create", name: "Thêm thể loại phim", group: "film", type: "action", description: "Thêm thể loại phim mới" },
  { code: "film.genre.update", name: "Sửa thể loại phim", group: "film", type: "action", description: "Sửa thể loại phim" },
  { code: "film.genre.delete", name: "Xóa thể loại phim", group: "film", type: "action", description: "Xóa thể loại phim" },

  // User
  { code: "user.view", name: "Xem người dùng", group: "user", type: "view", description: "Xem danh sách người dùng" },
  { code: "user.create", name: "Tạo người dùng", group: "user", type: "action", description: "Tạo tài khoản mới" },
  { code: "user.update", name: "Sửa người dùng", group: "user", type: "action", description: "Chỉnh sửa thông tin người dùng" },
  { code: "user.delete", name: "Xóa người dùng", group: "user", type: "action", description: "Xóa tài khoản người dùng" },

  // Admin UI
  { code: "admin.access", name: "Truy cập Admin", group: "admin", type: "view", description: "Quyền truy cập trang admin" },
  { code: "admin.dashboard.view", name: "Xem Dashboard", group: "admin", type: "view", description: "Xem trang tổng quan admin" },
  { code: "admin.roles.view", name: "Xem quản lý vai trò", group: "admin", type: "view", description: "Xem và quản lý phân quyền" },
  { code: "admin.analytics.view", name: "Xem thống kê", group: "admin", type: "view", description: "Xem trang phân tích và thống kê" },

  // Media
  { code: "media.view", name: "Xem media", group: "media", type: "view", description: "Xem danh sách file media" },
  { code: "media.upload", name: "Upload media", group: "media", type: "action", description: "Upload file media mới" },
  { code: "media.delete", name: "Xóa media", group: "media", type: "action", description: "Xóa file media" },

  // Moderation
  { code: "comment.moderate", name: "Duyệt bình luận", group: "moderation", type: "action", description: "Duyệt và quản lý bình luận" },
  { code: "review.moderate", name: "Duyệt đánh giá", group: "moderation", type: "action", description: "Duyệt và quản lý đánh giá phim" },
];

/**
 * Default role-permission mapping
 */
const ROLE_PERMISSIONS = {
  ADMIN: PERMISSIONS.map((p) => ({ code: p.code, granted: true })),
  EDITOR: [
    // Content CRUD
    { code: "story_text.view", granted: true },
    { code: "story_text.create", granted: true },
    { code: "story_text.update", granted: true },
    { code: "story_text.delete", granted: true },
    { code: "story_text.genre.create", granted: true },
    { code: "story_text.genre.update", granted: true },
    { code: "story_text.genre.delete", granted: true },
    { code: "story_audio.view", granted: true },
    { code: "story_audio.create", granted: true },
    { code: "story_audio.update", granted: true },
    { code: "story_audio.delete", granted: true },
    { code: "story_audio.genre.create", granted: true },
    { code: "story_audio.genre.update", granted: true },
    { code: "story_audio.genre.delete", granted: true },
    { code: "film.view", granted: true },
    { code: "film.create", granted: true },
    { code: "film.update", granted: true },
    { code: "film.delete", granted: true },
    { code: "film.genre.create", granted: true },
    { code: "film.genre.update", granted: true },
    { code: "film.genre.delete", granted: true },
    // Admin access
    { code: "admin.access", granted: true },
    { code: "admin.dashboard.view", granted: true },
    // Media
    { code: "media.view", granted: true },
    { code: "media.upload", granted: true },
    { code: "media.delete", granted: true },
  ],
  USER: [
    // View only
    { code: "story_text.view", granted: true },
    { code: "story_audio.view", granted: true },
    { code: "film.view", granted: true },
  ],
};

async function seedPermissions() {
  console.log("🔑 Seeding permissions...");

  // Upsert all permissions
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
  console.log(`  ✅ ${PERMISSIONS.length} permissions created/updated`);

  // Get all permissions from DB for ID lookup
  const dbPermissions = await prisma.permission.findMany();
  const permissionMap = {};
  for (const p of dbPermissions) {
    permissionMap[p.code] = p.id;
  }

  // Seed role-permission mappings
  for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
    let count = 0;
    for (const { code, granted } of perms) {
      const permissionId = permissionMap[code];
      if (!permissionId) {
        console.warn(`  ⚠️  Permission "${code}" not found, skipping`);
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: { role, permissionId },
        },
        update: { granted },
        create: { role, permissionId, granted },
      });
      count++;
    }
    console.log(`  ✅ ${role}: ${count} permissions mapped`);
  }

  console.log("🎉 Permission seeding complete!");
}

// Run if called directly
if (require.main === module) {
  seedPermissions()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error("❌ Error seeding permissions:", e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { seedPermissions, PERMISSIONS, ROLE_PERMISSIONS };
