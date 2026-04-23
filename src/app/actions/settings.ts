// src/app/actions/settings.ts
'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getDoctorAvailability() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'DOCTOR') {
    throw new Error("Yetkisiz erişim.");
  }
  const doctorId = (session.user as any).id;

  const workingDays = await prisma.workingDay.findMany({
    where: { doctorId },
    orderBy: { dayOfWeek: 'asc' }
  });

  const offDates = await prisma.offDate.findMany({
    where: { doctorId },
    orderBy: { date: 'asc' }
  });

  return { workingDays, offDates };
}

export async function updateWorkingDay(dayOfWeek: number, startTime: string, endTime: string, isClosed: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'DOCTOR') {
    throw new Error("Yetkisiz erişim.");
  }
  const doctorId = (session.user as any).id;

  await prisma.workingDay.upsert({
    where: {
      doctorId_dayOfWeek: { doctorId, dayOfWeek }
    },
    update: { startTime, endTime, isClosed },
    create: { doctorId, dayOfWeek, startTime, endTime, isClosed }
  });

  revalidatePath('/doctor/ayarlar');
}

export async function addOffDate(date: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'DOCTOR') {
    throw new Error("Yetkisiz erişim.");
  }
  const doctorId = (session.user as any).id;

  try {
    await prisma.offDate.create({
      data: { doctorId, date }
    });
    revalidatePath('/doctor/ayarlar');
  } catch (err) {
    // Already exists
  }
}

export async function removeOffDate(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'DOCTOR') {
    throw new Error("Yetkisiz erişim.");
  }

  await prisma.offDate.delete({
    where: { id }
  });
  revalidatePath('/doctor/ayarlar');
}
