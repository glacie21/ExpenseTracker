/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  // Income
  { name: "Salary", type: "INCOME", color: "#10b981" },
  { name: "Freelance", type: "INCOME", color: "#06b6d4" },
  { name: "Business", type: "INCOME", color: "#3b82f6" },
  { name: "Investment", type: "INCOME", color: "#8b5cf6" },
  { name: "Other Income", type: "INCOME", color: "#64748b" },
  // Expense
  { name: "Food & Drink", type: "EXPENSE", color: "#f97316" },
  { name: "Transportation", type: "EXPENSE", color: "#3b82f6" },
  { name: "Shopping", type: "EXPENSE", color: "#ec4899" },
  { name: "Bills", type: "EXPENSE", color: "#ef4444" },
  { name: "Entertainment", type: "EXPENSE", color: "#a855f7" },
  { name: "Health", type: "EXPENSE", color: "#14b8a6" },
  { name: "Education", type: "EXPENSE", color: "#eab308" },
  { name: "Other Expense", type: "EXPENSE", color: "#64748b" },
];

async function main() {
  console.log("🌱 Menjalankan database seed untuk Expense Tracker (Tahap 2)...");

  const email = "demo@example.com";
  const name = "Demo User";
  const rawPassword = "Password123!";

  // Hash password
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  // Upsert demo user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: hashedPassword,
    },
    create: {
      name,
      email,
      password: hashedPassword,
    },
  });

  // Seed default categories for demo user if they don't exist
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        userId_name_type: {
          userId: user.id,
          name: cat.name,
          type: cat.type,
        },
      },
      update: {
        color: cat.color,
      },
      create: {
        userId: user.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
      },
    });
  }

  console.log("✅ Seed berhasil!");
  console.log("-----------------------------------------");
  console.log(`Akun Demo Siap Digunakan:`);
  console.log(`Email      : ${user.email}`);
  console.log(`Password   : ${rawPassword}`);
  console.log(`User ID    : ${user.id}`);
  console.log(`Categories : ${DEFAULT_CATEGORIES.length} default categories seeded`);
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seed gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
