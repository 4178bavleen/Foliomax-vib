// prisma/seed.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@local.test';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('⚠️  Admin already exists:', existing.id);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const u = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: 'Admin',
      role: 'ADMIN',
      emailVerified: true, // ✅ Admin email is verified by default
    },
  });

  console.log('✅ Admin created with id:', u.id);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
