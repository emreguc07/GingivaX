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
            select: { id: true, name: true }
          },
          review: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) {
    throw new Error("Kullanıcı bulunamadı.");
  }

  const now = new Date();
  const mappedAppointments = user.appointments.map(app => {
    if (app.status === 'Bekliyor') {
      try {
        // Date format is assumed to be YYYY-MM-DD and time HH:mm
        const appDateTime = new Date(`${app.date}T${app.time || '00:00'}`);
        if (appDateTime < now) {
          return { ...app, status: 'Zaman Aşımı' };
        }
      } catch (e) {
        // Do nothing on parse error
      }
    }
    return app;
  });

  return {
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
    },
    appointments: mappedAppointments
  };
}

export async function updateUserProfile(data: { name: string, phone: string }) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).id) {
    return { success: false, error: "Oturum bulunamadı." };
  }

  try {
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: {
        name: data.name,
        phone: data.phone,
      }
    });
    return { success: true };
  } catch (error) {
    console.error("UPDATE_PROFILE_ERROR", error);
    return { success: false, error: "Profil güncellenemedi." };
  }
}

