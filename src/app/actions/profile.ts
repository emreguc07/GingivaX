// src/app/actions/profile.ts
'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getProfileData() {
  const session = await getServerSession(authOptions);
  
  if (!session || !(session.user as any).id) {
    throw new Error("Oturum bulunamadı.");
  }

  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      appointments: {
        include: {
          doctor: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) {
    throw new Error("Kullanıcı bulunamadı.");
  }

  return {
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    appointments: user.appointments
  };
}
