/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  // Income
  { name: "Gaji", type: "INCOME", color: "#2b67a8" },
  { name: "Pekerjaan lepas", type: "INCOME", color: "#3d8a8a" },
  { name: "Usaha", type: "INCOME", color: "#5b5fa8" },
  { name: "Investasi", type: "INCOME", color: "#4f7d3a" },
  { name: "Pemasukan lain", type: "INCOME", color: "#75716a" },
  // Expense
  { name: "Makan & minum", type: "EXPENSE", color: "#c4532b" },
  { name: "Transportasi", type: "EXPENSE", color: "#5f8fb8" },
  { name: "Belanja", type: "EXPENSE", color: "#8a4f9e" },
  { name: "Tagihan", type: "EXPENSE", color: "#a8324a" },
  { name: "Hiburan", type: "EXPENSE", color: "#b8892b" },
  { name: "Kesehatan", type: "EXPENSE", color: "#8a9a2b" },
  { name: "Pendidikan", type: "EXPENSE", color: "#7a6a55" },
  { name: "Pengeluaran lain", type: "EXPENSE", color: "#75716a" },
];

// Default names used before the categories were translated
const LEGACY_NAMES = {
  Salary: "Gaji",
  Freelance: "Pekerjaan lepas",
  Business: "Usaha",
  Investment: "Investasi",
  "Other Income": "Pemasukan lain",
  "Food & Drink": "Makan & minum",
  Transportation: "Transportasi",
  Shopping: "Belanja",
  Bills: "Tagihan",
  Entertainment: "Hiburan",
  Health: "Kesehatan",
  Education: "Pendidikan",
  "Other Expense": "Pengeluaran lain",
};

async function main() {
  console.log("🌱 Menjalankan database seed untuk Expense Tracker...");

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

  // Rename the demo user's old English defaults so transactions keep their category
  for (const [oldName, newName] of Object.entries(LEGACY_NAMES)) {
    const taken = await prisma.category.findFirst({ where: { userId: user.id, name: newName } });
    if (!taken) {
      await prisma.category.updateMany({ where: { userId: user.id, name: oldName }, data: { name: newName } });
    }
  }

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
