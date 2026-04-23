// src/app/actions/admin.ts
'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') {
    throw new Error("Yetkisiz erişim. Sadece yöneticiler bu işlemi yapabilir.");
  }
}

export async function getActivities() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    throw new Error("Yetkisiz erişim.");
  }

  return await prisma.activity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
}
  await verifyAdmin();
  
  const [totalAppointments, totalDoctors, totalPatients] = await Promise.all([
    prisma.appointment.count(),
    prisma.user.count({ where: { role: 'DOCTOR' } }),
    prisma.user.count({ where: { role: 'USER' } }),
  ]);

  return {
    totalAppointments,
    totalDoctors,
    totalPatients
  };
}

export async function getDoctors() {
  await verifyAdmin();
  return await prisma.user.findMany({
    where: { role: 'DOCTOR' },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createDoctor(data: {
  name: string;
  email: string;
  password?: string;
  specialty?: string;
  bio?: string;
  education?: string;
  image?: string;
}) {
  await verifyAdmin();
  
  const hashedPassword = await bcrypt.hash(data.password || "doctor123", 10);
  
  try {
    const doctor = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'DOCTOR',
        specialty: data.specialty,
        bio: data.bio,
        education: data.education,
        image: data.image || '/doctor-placeholder.jpg',
      }
    });
    return { success: true, doctor };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "Bu email adresi zaten kullanımda." };
    }
    return { success: false, error: "Hekim oluşturulamadı." };
  }
}

export async function updateDoctor(id: string, data: {
  name: string;
  email: string;
  password?: string;
  specialty?: string;
  bio?: string;
  education?: string;
  image?: string;
}) {
  await verifyAdmin();
  
  const updateData: any = {
    name: data.name,
    email: data.email,
    specialty: data.specialty,
    bio: data.bio,
    education: data.education,
    image: data.image,
  };

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  try {
    const doctor = await prisma.user.update({
      where: { id },
      data: updateData
    });
    return { success: true, doctor };
  } catch (error: any) {
    return { success: false, error: "Hekim güncellenemedi." };
  }
}

export async function deleteDoctor(id: string) {
  await verifyAdmin();
  try {
    await prisma.user.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Hekim silinemedi." };
  }
}
