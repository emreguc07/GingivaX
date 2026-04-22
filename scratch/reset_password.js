const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.update({
    where: { email: 'admin@gingivax.com' },
    data: { password: hashedPassword }
  });

  const doctor = await prisma.user.update({
    where: { email: 'elif@gingivax.com' },
    data: { password: hashedPassword }
  });

  console.log('Passwords reset for:', admin.email, 'and', doctor.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
