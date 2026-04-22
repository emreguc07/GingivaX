const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ take: 2 });
  if (users.length < 2) {
    console.log('Not enough users to test chat.');
    return;
  }

  try {
    const msg = await prisma.message.create({
      data: {
        content: 'Test message',
        senderId: users[0].id,
        receiverId: users[1].id
      }
    });
    console.log('Message created successfully:', msg.id);
  } catch (err) {
    console.error('Error creating message:', err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
