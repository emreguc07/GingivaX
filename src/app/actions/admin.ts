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

export async function getClinicStats() {
  await verifyAdmin();
  
  const [totalAppointments, totalDoctors, totalPatients, appointments] = await Promise.all([
    prisma.appointment.count(),
    prisma.user.count({ where: { role: 'DOCTOR' } }),
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.appointment.findMany({
      include: {
        doctor: { select: { name: true } }
      }
    })
  ]);

  // Transform data for charts
  const serviceDistribution = appointments.reduce((acc: any, app) => {
    acc[app.service] = (acc[app.service] || 0) + 1;
    return acc;
  }, {});

  const doctorPerformance = appointments.reduce((acc: any, app) => {
    const docName = app.doctor?.name || 'Atanmamış';
    acc[docName] = (acc[docName] || 0) + 1;
    return acc;
  }, {});

  // For monthly growth (Last 6 months)
  const monthlyData: any = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString('tr-TR', { month: 'long' });
    monthlyData[monthName] = 0;
  }

  appointments.forEach(app => {
    const month = new Date(app.createdAt).toLocaleString('tr-TR', { month: 'long' });
    if (monthlyData[month] !== undefined) {
      monthlyData[month]++;
    }
  });

  return {
    totalAppointments,
    totalDoctors,
    totalPatients,
    serviceData: Object.entries(serviceDistribution).map(([name, value]) => ({ name, value })),
    doctorData: Object.entries(doctorPerformance).map(([name, value]) => ({ name, value })),
    growthData: Object.entries(monthlyData).map(([name, value]) => ({ name, value }))
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
