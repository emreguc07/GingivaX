// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // 1. Admin Account
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gingivax.com' },
    update: {},
    create: {
      email: 'admin@gingivax.com',
      name: 'GingivaX Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // 2. Initial Doctor (Dt. Elif Nur GÜÇ)
  const doctor = await prisma.user.upsert({
    where: { email: 'elif@gingivax.com' },
    update: {},
    create: {
      email: 'elif@gingivax.com',
      name: 'Dt. Elif Nur GÜÇ',
      password: hashedPassword,
      role: 'DOCTOR',
      specialty: 'Pedodonti (Çocuk Diş Hekimliği)',
      bio: 'Çocukların diş sağlığı ve klinik deneyimlerini eğlenceli hale getirme konusunda uzmanlaşmış, güler yüzlü yaklaşımıyla minik hastalarımızın güvenini kazanan hekimimizdir.',
      education: 'Karadeniz Teknik Üniversitesi Diş Hekimliği Fakültesi',
      image: '/hekimler/elif-nur-guc.jpg',
    },
  });

  console.log('Seed completed: Admin and Initial Doctor accounts created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
