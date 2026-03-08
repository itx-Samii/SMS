const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding admin user...');
  const user = await prisma.user.create({
    data: {
      name: 'System Admin',
      password: 'admin',
      role: 'ADMIN',
    }
  });
  console.log('Created user:', user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
