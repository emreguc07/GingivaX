// src/app/actions/doctor.ts
'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getAppointments() {
  const session = await getServerSession(authOptions);
  
  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;

  if (userRole === 'ADMIN') {
    return await prisma.appointment.findMany({
      include: {
        user: { select: { name: true, email: true } },
        doctor: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  return await prisma.appointment.findMany({
    where: { doctorId: userId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function updateAppointmentStatus(id: number, status: string) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== 'DOCTOR') {
    throw new Error("Yetkisiz erişim. Sadece hekimler durumu güncelleyebilir.");
  }

  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;

  const whereClause: any = { id: id };
  if (userRole !== 'ADMIN') {
    whereClause.doctorId = userId;
  }

  return await prisma.appointment.update({
    where: whereClause,
    data: { status }
  });
}

export async function deleteAppointment(id: number) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== 'DOCTOR') {
    throw new Error("Yetkisiz erişim. Sadece hekimler randevuyu silebilir.");
  }

  return await prisma.appointment.delete({
    where: { id }
  });
}
