// src/app/actions/admin_users.ts
'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    throw new Error("Yetkisiz erişim.");
  }
}

export async function getAllUsers() {
  await checkAdmin();
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true
    }
  });
}

export async function verifyUserManually(userId: string) {
  await checkAdmin();
  return await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() }
  });
}

export async function deleteUser(userId: string) {
  await checkAdmin();
  
  // Clean up relations
  await prisma.appointment.deleteMany({ where: { userId } });
  await prisma.message.deleteMany({ where: { senderId: userId } });
  await prisma.message.deleteMany({ where: { receiverId: userId } });
  
  return await prisma.user.delete({
    where: { id: userId }
  });
}
