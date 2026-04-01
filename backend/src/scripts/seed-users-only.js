const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with users only...");

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash("Admin@Midnight2026!", 12);
    const admin = await prisma.user.upsert({
      where: { email: "admin@phimtruyenhay.com" },
      update: {},
      create: {
        email: "admin@phimtruyenhay.com",
        passwordHash: adminPassword,
        name: "Admin Midnight",
        role: "ADMIN",
      },
    });

    // Create editor user
    const editorPassword = await bcrypt.hash("Editor@Midnight2026!", 12);
    const editor = await prisma.user.upsert({
      where: { email: "editor@phimtruyenhay.com" },
      update: {},
      create: {
        email: "editor@phimtruyenhay.com",
        passwordHash: editorPassword,
        name: "Editor Midnight",
        role: "EDITOR",
      },
    });

    // Create demo user
    const userPassword = await bcrypt.hash("Demo@Midnight2026!", 12);
    const user = await prisma.user.upsert({
      where: { email: "demo@phimtruyenhay.com" },
      update: {},
      create: {
        email: "demo@phimtruyenhay.com",
        passwordHash: userPassword,
        name: "Demo User",
        role: "USER",
      },
    });

    console.log("✅ Database seeded successfully!");
    console.log("👤 Admin:", admin.email, "/ Admin@Midnight2026!");
    console.log("👤 Editor:", editor.email, "/ Editor@Midnight2026!");
    console.log("👤 User:", user.email, "/ Demo@Midnight2026!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
