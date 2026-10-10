const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: 'adminpassword', role: 'ADMIN' },
    create: {
      username: 'admin',
      password: 'adminpassword',
      role: 'ADMIN',
    },
  });
  console.log('Admin user created successfully:', user);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
