// scratch/verify_existing.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    data: { emailVerified: new Date() }
  });
  console.log("All existing users marked as verified.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
