// scratch/delete_user.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const EMAIL_TO_DELETE = 'emreguc87@gmail.com';

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: EMAIL_TO_DELETE }
  });

  if (!user) {
    console.log(`User ${EMAIL_TO_DELETE} not found.`);
    return;
  }

  // Delete relations first or use cascade (Prisma handles some, but let's be safe)
  // Appointments, Messages, etc.
  
  await prisma.appointment.deleteMany({ where: { userId: user.id } });
  await prisma.message.deleteMany({ where: { senderId: user.id } });
  await prisma.message.deleteMany({ where: { receiverId: user.id } });
  await prisma.verificationToken.deleteMany({ where: { email: user.email! } });
  
  await prisma.user.delete({
    where: { id: user.id }
  });

  console.log(`User ${EMAIL_TO_DELETE} and all related data deleted successfully.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
