// scratch/fix_seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // 1. Admin Account
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gingivax.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'admin@gingivax.com',
      name: 'GingivaX Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // 2. Initial Doctor
  const doctor = await prisma.user.upsert({
    where: { email: 'elif@gingivax.com' },
    update: { 
      role: 'DOCTOR',
      specialty: 'Pedodonti (Çocuk Diş Hekimliği)',
      bio: 'Çocukların diş sağlığı ve klinik deneyimlerini eğlenceli hale getirme konusunda uzmanlaşmış, güler yüzlü yaklaşımıyla minik hastalarımızın güvenini kazanan hekimimizdir.',
      education: 'Karadeniz Teknik Üniversitesi Diş Hekimliği Fakültesi',
      image: '/hekimler/elif-nur-guc.jpg',
    },
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

  console.log('Seed application successful via scratch script!');
  console.log('Admin:', admin.email);
  console.log('Doctor:', doctor.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
